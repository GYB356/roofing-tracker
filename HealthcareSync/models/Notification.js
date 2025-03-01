/**
 * Notification Model
 * 
 * This model represents a notification in the system, including:
 * - Recipient information
 * - Notification content
 * - Notification type
 * - Read status
 * - Priority
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  type: {
    type: String,
    enum: [
      'appointment', 
      'prescription', 
      'lab_result', 
      'message', 
      'emergency', 
      'system', 
      'billing',
      'telemedicine',
      'health_metric',
      'device'
    ],
    required: [true, 'Type is required']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Virtual property for age of notification
notificationSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / 1000);
});

// Virtual property for whether notification is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Pre-find middleware to exclude expired notifications
notificationSchema.pre(/^find/, function(next) {
  // 'this' points to the current query
  this.find({ 
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  next();
});

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, read: false });
};

// Static method to get notifications by type for a user
notificationSchema.statics.getByType = async function(userId, type) {
  return await this.find({ recipient: userId, type }).sort({ createdAt: -1 });
};

// Static method to get recent notifications for a user
notificationSchema.statics.getRecent = async function(userId, limit = 10) {
  return await this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
  return result.nModified;
};

// Static method to delete old notifications
notificationSchema.statics.deleteOld = async function(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoff }
  });
  
  return result.deletedCount;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 