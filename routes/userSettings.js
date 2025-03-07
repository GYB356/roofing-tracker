const express = require('express');
const router = express.Router();
const UserSettings = require('../models/UserSettings');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profile-images/');
  },
  filename: function(req, file, cb) {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get user settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user.id });
    
    if (!settings) {
      // Create default settings if not found
      const user = await User.findById(req.user.id);
      settings = new UserSettings({
        userId: req.user.id,
        profile: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phoneNumber: user.phoneNumber || '',
          jobTitle: user.jobTitle || '',
          profileImage: ''
        }
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile information
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, jobTitle } = req.body;
    
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { 
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'profile.phoneNumber': phoneNumber,
        'profile.jobTitle': jobTitle
      },
      { new: true, upsert: true }
    );
    
    // Also update user model with basic info
    await User.findByIdAndUpdate(req.user.id, { firstName, lastName, phoneNumber });
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile image
router.post('/profile-image', [auth, upload.single('profileImage')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/profile-images/${req.file.filename}`;
    
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { 'profile.profileImage': imageUrl },
      { new: true, upsert: true }
    );
    
    res.json({ imageUrl, settings });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { preferences: req.body },
      { new: true, upsert: true }
    );
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;