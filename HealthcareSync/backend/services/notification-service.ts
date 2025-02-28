import { WebSocket } from 'ws';
import { CacheService } from '../lib/cache';

export interface Notification {
  id: string;
  userId: number;
  type: 'appointment' | 'health' | 'medication' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  read: boolean;
}

export class NotificationService {
  private static clients = new Map<number, WebSocket>();
  private static CACHE_PREFIX = 'notifications:';
  private static CACHE_TTL = 86400; // 24 hours

  static addClient(userId: number, ws: WebSocket) {
    this.clients.set(userId, ws);
  }

  static removeClient(userId: number) {
    this.clients.delete(userId);
  }

  static async sendNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    try {
      const fullNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        read: false
      };

      // Store notification in cache
      const userNotifications = await this.getUserNotifications(notification.userId);
      userNotifications.unshift(fullNotification);
      await CacheService.set(
        `${this.CACHE_PREFIX}${notification.userId}`,
        userNotifications,
        this.CACHE_TTL
      );

      // Send to connected client if available
      const client = this.clients.get(notification.userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'notification',
          data: fullNotification
        }));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async getUserNotifications(userId: number): Promise<Notification[]> {
    const notifications = await CacheService.get<Notification[]>(`${this.CACHE_PREFIX}${userId}`);
    return notifications || [];
  }

  static async markAsRead(userId: number, notificationId: string) {
    try {
      const notifications = await this.getUserNotifications(userId);
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );

      await CacheService.set(
        `${this.CACHE_PREFIX}${userId}`,
        updatedNotifications,
        this.CACHE_TTL
      );

      // Notify client about the update
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'notificationUpdate',
          data: { id: notificationId, read: true }
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  static async clearUserNotifications(userId: number) {
    await CacheService.delete(`${this.CACHE_PREFIX}${userId}`);
  }
}
