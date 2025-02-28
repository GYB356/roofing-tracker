
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Get all messages for a conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get all conversations for a user
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantIds: { has: userId } },
          { createdById: userId }
        ]
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Send a new message
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;
    const senderId = req.user?.id;
    
    if (!senderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        attachments,
        createdAt: new Date()
      }
    });
    
    // Update conversation lastActivityAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastActivityAt: new Date() }
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
