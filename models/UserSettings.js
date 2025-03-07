const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String },
    jobTitle: { type: String },
    profileImage: { type: String }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    dashboard: {
      showWeather: { type: Boolean, default: true },
      showUpcomingProjects: { type: Boolean, default: true },
      showInventoryAlerts: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
  }
}, { timestamps: true });

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

module.exports = UserSettings;