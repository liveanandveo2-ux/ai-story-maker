const express = require('express');
const { authenticate, verifyGoogleToken, generateToken, optionalAuth } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Google OAuth authentication
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Google ID token is required'
      });
    }

    // Verify Google ID token
    const googleUser = await verifyGoogleToken(idToken);

    // Check if user exists in our database
    let user = await User.findOne({ uid: googleUser.uid });

    if (!user) {
      // Create new user
      user = new User({
        uid: googleUser.uid,
        email: googleUser.email,
        displayName: googleUser.name,
        photoURL: googleUser.picture,
        emailVerified: googleUser.emailVerified,
        stats: {
          joinedDate: new Date(),
          storiesCreated: 0,
          storybooksCreated: 0,
          totalViews: 0,
          totalLikes: 0,
          streakDays: 0
        }
      });

      await user.save();
      console.log('New Google user created:', user.email);
    } else {
      // Update existing user's info
      user.displayName = googleUser.name;
      user.photoURL = googleUser.picture;
      user.emailVerified = googleUser.emailVerified;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user);

    // Update user's last login
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip || req.connection.remoteAddress;
    await user.save();

    res.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        picture: user.photoURL,
        bio: user.bio,
        username: user.username,
        stats: user.stats,
        createdAt: user.createdAt
      },
      message: 'Successfully authenticated with Google'
    });

  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Google authentication failed'
    });
  }
});

// Regular email/password login (for future use)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // For demo purposes - in production, implement proper email/password auth
    if (process.env.NODE_ENV === 'development' && password === 'demo123') {
      // Create or find demo user
      let user = await User.findOne({ email });
      
      if (!user) {
        user = new User({
          uid: 'demo_' + Date.now(),
          email,
          displayName: 'Demo User',
          emailVerified: true,
          stats: {
            joinedDate: new Date()
          }
        });
        await user.save();
      }

      const token = generateToken(user);

      res.json({
        success: true,
        token,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          picture: user.photoURL,
          bio: user.bio,
          username: user.username,
          stats: user.stats,
          createdAt: user.createdAt
        },
        message: 'Demo login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        picture: user.photoURL,
        bio: user.bio,
        username: user.username,
        preferences: user.preferences,
        stats: user.stats,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { bio, username, preferences } = req.body;
    const user = req.user;

    // Validate username uniqueness
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        username, 
        uid: { $ne: user.uid } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken'
        });
      }
      
      user.username = username;
    }

    // Update bio
    if (bio !== undefined) {
      user.bio = bio.substring(0, 500); // Limit bio length
    }

    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      data: {
        bio: user.bio,
        username: user.username,
        preferences: user.preferences
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Logout (mainly for client-side token cleanup)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Refresh token
router.post('/refresh', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    const token = generateToken(req.user);

    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

// Verify token endpoint
router.get('/verify', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      valid: true,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.displayName,
        picture: req.user.photoURL
      }
    });
  } else {
    res.json({
      success: true,
      valid: false
    });
  }
});

module.exports = router;