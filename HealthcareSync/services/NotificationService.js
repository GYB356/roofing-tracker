/**
 * Notification Service
 * 
 * This service handles real-time notifications via WebSockets.
 * It provides:
 * - User-specific notifications
 * - Role-based notifications
 * - Notification persistence
 * - Notification delivery status tracking
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/notifications.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class NotificationService {
  constructor() {
    // Map of connected clients: userId -> socket
    this.clients = new Map();
    
    // Map of role-based rooms: role -> Set of userIds
    this.roleRooms = new Map();
    
    // Initialize role rooms
    const roles = ['patient', 'doctor', 'nurse', 'admin', 'receptionist', 'lab_tech', 'manager'];
    roles.forEach(role => this.roleRooms.set(role, new Set()));
  }
  
  /**
   * Add a client to the notification service
   * @param {String} userId - User ID
   * @param {Object} socket - Socket.io socket
   */
  addClient(userId, socket) {
    this.clients.set(userId, socket);
    
    // Add user to user-specific room
    socket.join(`user:${userId}`);
    
    // Add user to role-based room
    this.addUserToRoleRoom(userId);
    
    logger.info(`Client added: ${userId}`);
  }
  
  /**
   * Remove a client from the notification service
   * @param {String} userId - User ID
   */
  removeClient(userId) {
    if (this.clients.has(userId)) {
      const socket = this.clients.get(userId);
      
      // Leave user-specific room
      socket.leave(`user:${userId}`);
      
      // Remove from role-based rooms
      this.removeUserFromRoleRooms(userId);
      
      // Remove from clients map
      this.clients.delete(userId);
      
      logger.info(`Client removed: ${userId}`);
    }
  }
  
  /**
   * Add a user to their role-based room
   * @param {String} userId - User ID
   */
  async addUserToRoleRoom(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      
      const role = user.role;
      
      // Add to role-based room
      if (this.roleRooms.has(role)) {
        this.roleRooms.get(role).add(userId);
        
        // Join socket to role room
        const socket = this.clients.get(userId);
        if (socket) {
          socket.join(`role:${role}`);
        }
        
        logger.info(`User ${userId} added to role room: ${role}`);
      }
    } catch (err) {
      logger.error(`Error adding user to role room: ${err.message}`);
    }
  }
  
  /**
   * Remove a user from all role-based rooms
   * @param {String} userId - User ID
   */
  removeUserFromRoleRooms(userId) {
    for (const [role, users] of this.roleRooms.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        
        // Leave socket from role room
        const socket = this.clients.get(userId);
        if (socket) {
          socket.leave(`role:${role}`);
        }
        
        logger.info(`User ${userId} removed from role room: ${role}`);
      }
    }
  }
  
  /**
   * Send a notification to a specific user
   * @param {String} userId - User ID
   * @param {Object} notification - Notification object
   */
  async sendToUser(userId, notification) {
    try {
      // Create notification in database
      const newNotification = await Notification.create({
        recipient: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        priority: notification.priority || 'normal'
      });
      
      // Send to user if online
      const io = global.io;
      if (io) {
        io.to(`user:${userId}`).emit('notification', {
          ...newNotification.toObject(),
          createdAt: new Date()
        });
        
        logger.info(`Notification sent to user ${userId}: ${notification.title}`);
      }
      
      return newNotification;
    } catch (err) {
      logger.error(`Error sending notification to user: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Send a notification to users with a specific role
   * @param {String} role - Role name
   * @param {Object} notification - Notification object
   */
  async sendToRole(role, notification) {
    try {
      // Validate role
      if (!this.roleRooms.has(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      // Get all users with this role
      const users = await User.find({ role });
      
      // Create notifications for all users
      const notifications = [];
      for (const user of users) {
        const newNotification = await Notification.create({
          recipient: user._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          priority: notification.priority || 'normal'
        });
        
        notifications.push(newNotification);
      }
      
      // Send to all users with this role
      const io = global.io;
      if (io) {
        io.to(`role:${role}`).emit('notification', {
          ...notification,
          createdAt: new Date()
        });
        
        logger.info(`Notification sent to role ${role}: ${notification.title}`);
      }
      
      return notifications;
    } catch (err) {
      logger.error(`Error sending notification to role: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Send a notification to all users
   * @param {Object} notification - Notification object
   */
  async sendToAll(notification) {
    try {
      // Create notifications for all users
      const users = await User.find({ active: true });
      
      // Create notifications for all users
      const notifications = [];
      for (const user of users) {
        const newNotification = await Notification.create({
          recipient: user._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          priority: notification.priority || 'normal'
        });
        
        notifications.push(newNotification);
      }
      
      // Send to all connected clients
      const io = global.io;
      if (io) {
        io.emit('notification', {
          ...notification,
          createdAt: new Date()
        });
        
        logger.info(`Notification sent to all users: ${notification.title}`);
      }
      
      return notifications;
    } catch (err) {
      logger.error(`Error sending notification to all users: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Get all notifications for a user
   * @param {String} userId - User ID
   * @returns {Array} Array of notifications
   */
  async getUserNotifications(userId) {
    try {
      const notifications = await Notification.find({ 
        recipient: userId,
        read: false
      }).sort({ createdAt: -1 });
      
      return notifications;
    } catch (err) {
      logger.error(`Error getting user notifications: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Mark a notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Check if user is the recipient
      if (notification.recipient.toString() !== userId) {
        throw new Error('Unauthorized');
      }
      
      notification.read = true;
      notification.readAt = new Date();
      
      await notification.save();
      
      logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
      
      return notification;
    } catch (err) {
      logger.error(`Error marking notification as read: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true, readAt: new Date() }
      );
      
      logger.info(`All notifications marked as read for user ${userId}`);
      
      return result.nModified;
    } catch (err) {
      logger.error(`Error marking all notifications as read: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Delete a notification
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Check if user is the recipient
      if (notification.recipient.toString() !== userId) {
        throw new Error('Unauthorized');
      }
      
      await notification.remove();
      
      logger.info(`Notification ${notificationId} deleted by user ${userId}`);
      
      return true;
    } catch (err) {
      logger.error(`Error deleting notification: ${err.message}`);
      throw err;
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

module.exports = notificationService; 