/**
 * User Model
 * 
 * This model represents a user in the system, including:
 * - Authentication information
 * - Profile information
 * - Role-based access control
 * - HIPAA consent tracking
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'nurse', 'admin', 'receptionist', 'lab_tech', 'manager'],
    default: 'patient'
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v) || /^\d{3}-\d{3}-\d{4}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  profileImage: String,
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  hipaaConsent: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    date: Date,
    version: String
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    },
    appointmentReminders: {
      type: Boolean,
      default: true
    },
    labResults: {
      type: Boolean,
      default: true
    },
    prescriptionRefills: {
      type: Boolean,
      default: true
    },
    newsletters: {
      type: Boolean,
      default: false
    }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String,
    email: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual property for age
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();
  
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  // Update passwordChangedAt if not a new user
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to account for delay
  }
  
  next();
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-find middleware to exclude inactive users
userSchema.pre(/^find/, function(next) {
  // 'this' points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// Method to check if password is correct
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to check if password was changed after a certain time
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  
  // False means NOT changed
  return false;
};

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // Increment login attempts
  this.loginAttempts += 1;
  
  // Lock account if too many attempts
  if (this.loginAttempts >= 5) {
    // Lock for 15 minutes
    this.lockedUntil = Date.now() + 15 * 60 * 1000;
  }
  
  await this.save();
  
  return this.loginAttempts;
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockedUntil = undefined;
  this.lastLogin = Date.now();
  
  await this.save();
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

// Method to accept HIPAA consent
userSchema.methods.acceptHipaaConsent = async function(version) {
  this.hipaaConsent = {
    status: 'accepted',
    date: Date.now(),
    version: version || '1.0'
  };
  
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 