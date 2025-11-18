const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Firebase/Google OAuth fields
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  photoURL: {
    type: String,
    trim: true,
    maxLength: 500
  },
  
  // Profile information
  bio: {
    type: String,
    maxLength: 500,
    default: ''
  },
  username: {
    type: String,
    trim: true,
    maxLength: 50,
    sparse: true,
    unique: true
  },
  
  // Preferences
  preferences: {
    genre: [{
      type: String,
      enum: ['fantasy', 'adventure', 'mystery', 'romance', 'sci-fi', 'horror', 'comedy', 'drama', 'thriller']
    }],
    defaultStoryLength: {
      type: String,
      enum: ['short', 'medium', 'long', 'very long'],
      default: 'medium'
    },
    autoSaveStories: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en',
      maxLength: 5
    }
  },
  
  // Stats and achievements
  stats: {
    storiesCreated: {
      type: Number,
      default: 0,
      min: 0
    },
    storybooksCreated: {
      type: Number,
      default: 0,
      min: 0
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0
    },
    totalLikes: {
      type: Number,
      default: 0,
      min: 0
    },
    streakDays: {
      type: Number,
      default: 0,
      min: 0
    },
    joinedDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Account settings
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  
  // Security
  lastLoginIP: {
    type: String,
    maxLength: 45
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ uid: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'stats.storiesCreated': -1 });
userSchema.index({ 'stats.totalViews': -1 });
userSchema.index({ createdAt: -1 });

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.displayName;
});

// Virtual for stories count
userSchema.virtual('storyCount').get(function() {
  return this.stats.storiesCreated;
});

// Virtual for storybooks count
userSchema.virtual('storybookCount').get(function() {
  return this.stats.storybooksCreated;
});

// Methods
userSchema.methods.updateLoginStats = async function(ip) {
  this.lastLoginAt = new Date();
  this.lastLoginIP = ip;
  this.loginAttempts = 0;
  await this.save();
};

userSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $unset: {
        lockUntil: 1
      },
      $set: {
        loginAttempts: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

userSchema.methods.incrementStoryCount = function() {
  this.stats.storiesCreated += 1;
  return this.save();
};

userSchema.methods.incrementStorybookCount = function() {
  this.stats.storybooksCreated += 1;
  return this.save();
};

userSchema.methods.updateStats = function(stats) {
  this.stats = { ...this.stats, ...stats };
  return this.save();
};

userSchema.methods.canCreateStories = function() {
  return this.isActive && this.emailVerified;
};

userSchema.methods.canModerate = function() {
  return ['admin', 'moderator'].includes(this.role);
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUid = function(uid) {
  return this.findOne({ uid });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

userSchema.statics.getTopCreators = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.storiesCreated': -1, 'stats.totalViews': -1 })
    .limit(limit)
    .select('displayName username photoURL stats bio');
};

userSchema.statics.searchUsers = function(searchTerm, options = {}) {
  return this.find(
    { 
      $text: { $search: searchTerm },
      isActive: true 
    },
    { score: { $meta: 'textScore' } },
    options
  )
  .select('displayName username photoURL bio stats')
  .sort({ score: { $meta: 'textScore' } });
};

// Middleware to hash password (if needed for local auth)
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);