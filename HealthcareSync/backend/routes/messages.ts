import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/auth';
import { Storage } from '../storage';
import { WebSocketService } from '../services/websocket-service';

const router = Router();
const storage = new Storage();

// Message schema
const messageSchema = z.object({
  senderId: z.string(),
  recipientId: z.string(),
  subject: z.string().min(1),
  content: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    fileContent: z.string(), // Base64 encoded content
  })).optional(),
});

type Message = z.infer<typeof messageSchema>;

// Get all messages for a user (both sent and received)
router.get('/user/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own messages or has admin rights
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access to messages' });
    }
    
    const sentMessages = await storage.prisma.message.findMany({
      where: { senderId: userId },
      include: {
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const receivedMessages = await storage.prisma.message.findMany({
      where: { recipientId: userId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({
      sent: sentMessages,
      received: receivedMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversation between two users
router.get('/conversation/:userId/:otherUserId', authenticateJWT, async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    
    // Ensure user can only access their own conversations
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access to conversation' });
    }
    
    const messages = await storage.prisma.message.findMany({
      where: {
        OR: [
          { 
            AND: [
              { senderId: userId },
              { recipientId: otherUserId }
            ] 
          },
          { 
            AND: [
              { senderId: otherUserId },
              { recipientId: userId }
            ] 
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Mark unread messages as read
    const unreadMessageIds = messages
      .filter(msg => msg.recipientId === userId && !msg.readAt)
      .map(msg => msg.id);
    
    if (unreadMessageIds.length > 0) {
      await storage.prisma.message.updateMany({
        where: { id: { in: unreadMessageIds } },
        data: { readAt: new Date() }
      });
    }
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get unread message count
router.get('/unread/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own messages
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access to message count' });
    }
    
    const count = await storage.prisma.message.count({
      where: {
        recipientId: userId,
        readAt: null
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread message count' });
  }
});

// Send a new message
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const validatedData = messageSchema.parse(req.body);
    
    // Ensure sender ID matches authenticated user
    if (req.user.id !== validatedData.senderId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized attempt to send message as another user' });
    }
    
    const newMessage = await storage.prisma.message.create({
      data: {
        senderId: validatedData.senderId,
        recipientId: validatedData.recipientId,
        subject: validatedData.subject,
        content: validatedData.content,
        priority: validatedData.priority,
        attachments: validatedData.attachments,
      }
    });
    
    // Notify recipient via WebSocket
    WebSocketService.getInstance().sendToUser(validatedData.recipientId, 'new-message', {
      message: newMessage,
      sender: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      }
    });
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
});

// Mark message as read
router.put('/:messageId/read', authenticateJWT, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await storage.prisma.message.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Ensure only recipient can mark as read
    if (req.user.id !== message.recipientId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access to mark message as read' });
    }
    
    const updatedMessage = await storage.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() }
    });
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Delete a message
router.delete('/:messageId', authenticateJWT, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await storage.prisma.message.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Ensure only sender or recipient can delete
    if (req.user.id !== message.senderId && req.user.id !== message.recipientId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access to delete message' });
    }
    
    // Soft delete by setting deleted flag for appropriate user
    const updateData = req.user.id === message.senderId
      ? { senderDeleted: true }
      : { recipientDeleted: true };
      
    const updatedMessage = await storage.prisma.message.update({
      where: { id: messageId },
      data: updateData
    });
    
    // If both sender and recipient have deleted, hard delete
    if (updatedMessage.senderDeleted && updatedMessage.recipientDeleted) {
      await storage.prisma.message.delete({
        where: { id: messageId }
      });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;

import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';

const conversationsRouter = express.Router();

// Get all conversations for current user
conversationsRouter.get('/', requireAuth, async (req, res) => {
  try {
    // Mock implementation since we don't have the actual schema
    // In a real implementation, fetch from database
    const mockConversations = [
      {
        id: 'conv-1',
        participants: [
          { id: req.user.id, name: 'Current User' },
          { id: 'user-2', name: 'Dr. Smith' }
        ],
        lastMessage: {
          content: 'When should I schedule my next appointment?',
          sentBy: req.user.id,
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'conv-2',
        participants: [
          { id: req.user.id, name: 'Current User' },
          { id: 'user-3', name: 'Nurse Johnson' }
        ],
        lastMessage: {
          content: 'Your test results are ready',
          sentBy: 'user-3',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        unreadCount: 1,
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    res.json(mockConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get all messages in a conversation
conversationsRouter.get('/:conversationId', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Mock implementation
    const mockMessages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i + 1}`,
      conversationId,
      content: `This is message #${i + 1} in the conversation`,
      sentBy: i % 2 === 0 ? req.user.id : 'other-user',
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      read: i > 2 || i % 2 === 0,
    }));

    res.json(mockMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send a new message
conversationsRouter.post('/:conversationId', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Mock implementation
    const newMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      content,
      attachments: attachments || [],
      sentBy: req.user.id,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // In a real implementation:
    // 1. Save message to database
    // 2. Notify recipients via websocket
    // 3. Send push notifications if enabled

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Start a new conversation
conversationsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { participantIds, initialMessage } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([...participantIds, req.user.id])];

    // Mock implementation
    const newConversation = {
      id: `conv-${Date.now()}`,
      participants: allParticipantIds.map(id => ({ 
        id, 
        name: id === req.user.id ? 'Current User' : `User ${id}` 
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create initial message if provided
    let firstMessage = null;
    if (initialMessage) {
      firstMessage = {
        id: `msg-${Date.now()}`,
        conversationId: newConversation.id,
        content: initialMessage,
        sentBy: req.user.id,
        timestamp: new Date().toISOString(),
        read: false,
      };
    }

    res.status(201).json({
      conversation: newConversation,
      message: firstMessage
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// Mark messages as read
conversationsRouter.patch('/:conversationId/read', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'No message IDs provided' });
    }

    // Mock implementation
    // In a real system, update read status in database

    res.json({ 
      message: 'Messages marked as read',
      updatedCount: messageIds.length
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

export { router as messageRouter, conversationsRouter };