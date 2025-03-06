import { WebSocket } from 'ws';
import { prisma } from '../../lib/prisma';
import { websocketService } from './websocket-service';
import * as crypto from 'crypto';

export interface Message {
  id: string;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
  read: boolean;
  encrypted: boolean;
}

export interface ChatRoom {
  id: string;
  participants: number[];
  messages: Message[];
  metadata: {
    patientId: number;
    providerId: number;
    createdAt: string;
    lastActivity: string;
  };
}

export class MessagingService {
  private static readonly ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || crypto.randomBytes(32);
  private static chatRooms = new Map<string, ChatRoom>();

  static async createChatRoom(patientId: number, providerId: number): Promise<ChatRoom> {
    try {
      // Verify both users exist
      const [patient, provider] = await Promise.all([
        prisma.patient.findUnique({ where: { id: patientId } }),
        prisma.user.findUnique({ where: { id: providerId } })
      ]);

      if (!patient || !provider) {
        throw new Error('Invalid participants');
      }

      const chatRoom: ChatRoom = {
        id: crypto.randomUUID(),
        participants: [patientId, providerId],
        messages: [],
        metadata: {
          patientId,
          providerId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        }
      };

      this.chatRooms.set(chatRoom.id, chatRoom);

      // Create chat room record in database
      await prisma.chatRoom.create({
        data: {
          id: chatRoom.id,
          patientId,
          providerId,
          createdAt: new Date(chatRoom.metadata.createdAt),
          lastActivity: new Date(chatRoom.metadata.lastActivity)
        }
      });

      return chatRoom;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  static async sendMessage(chatRoomId: string, senderId: number, content: string): Promise<Message> {
    try {
      const chatRoom = this.chatRooms.get(chatRoomId);
      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      if (!chatRoom.participants.includes(senderId)) {
        throw new Error('Sender not in chat room');
      }

      // Encrypt message content
      const encryptedContent = this.encryptMessage(content);

      const message: Message = {
        id: crypto.randomUUID(),
        senderId,
        recipientId: chatRoom.participants.find(id => id !== senderId)!,
        content: encryptedContent,
        timestamp: new Date().toISOString(),
        read: false,
        encrypted: true
      };

      chatRoom.messages.push(message);
      chatRoom.metadata.lastActivity = message.timestamp;

      // Store message in database
      await prisma.message.create({
        data: {
          id: message.id,
          chatRoomId,
          senderId: message.senderId,
          recipientId: message.recipientId,
          content: message.content,
          timestamp: new Date(message.timestamp),
          read: message.read,
          encrypted: message.encrypted
        }
      });

      // Update chat room last activity
      await prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: { lastActivity: new Date(message.timestamp) }
      });

      // Notify recipient through WebSocket
      websocketService.notifyUser(message.recipientId, {
        type: 'new_message',
        data: {
          chatRoomId,
          message: {
            ...message,
            content: this.decryptMessage(message.content) // Decrypt for recipient
          }
        }
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async getChatRoomMessages(chatRoomId: string, userId: number): Promise<Message[]> {
    try {
      const chatRoom = this.chatRooms.get(chatRoomId);
      if (!chatRoom || !chatRoom.participants.includes(userId)) {
        throw new Error('Access denied');
      }

      // Decrypt messages for user
      return chatRoom.messages.map(message => ({
        ...message,
        content: this.decryptMessage(message.content)
      }));
    } catch (error) {
      console.error('Error getting chat room messages:', error);
      throw error;
    }
  }

  static async markMessageAsRead(messageId: string, userId: number): Promise<void> {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { chatRoom: true }
      });

      if (!message || message.recipientId !== userId) {
        throw new Error('Access denied');
      }

      await prisma.message.update({
        where: { id: messageId },
        data: { read: true }
      });

      // Update in-memory state
      const chatRoom = this.chatRooms.get(message.chatRoom.id);
      if (chatRoom) {
        const messageToUpdate = chatRoom.messages.find(m => m.id === messageId);
        if (messageToUpdate) {
          messageToUpdate.read = true;
        }
      }

      // Notify sender through WebSocket
      websocketService.notifyUser(message.senderId, {
        type: 'message_read',
        data: { messageId }
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  private static encryptMessage(content: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted content, and auth tag
    const combined = Buffer.concat([iv, encrypted, authTag]);
    return combined.toString('base64');
  }

  private static decryptMessage(encryptedContent: string): string {
    const combined = Buffer.from(encryptedContent, 'base64');
    const iv = combined.slice(0, 16);
    const authTag = combined.slice(-16);
    const encrypted = combined.slice(16, -16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}