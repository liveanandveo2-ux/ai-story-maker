const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Initialize Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Verify Google ID token
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    return {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      uid: user.uid, 
      email: user.email,
      name: user.name 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    // Find user in database
    let user = await User.findOne({ uid: decoded.uid });
    
    // If user doesn't exist, create them (for first login)
    if (!user && decoded.email) {
      user = new User({
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name || 'User',
        photoURL: decoded.picture || null,
        emailVerified: decoded.emailVerified || false,
        stats: {
          joinedDate: new Date()
        }
      });
      
      await user.save();
      console.log('New user created:', user.email);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token;

    if (token) {
      const decoded = verifyToken(token);
      let user = await User.findOne({ uid: decoded.uid });
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Generate refresh token (optional for future use)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { uid: user.uid },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticate,
  optionalAuth,
  verifyGoogleToken,
  generateToken,
  verifyToken,
  generateRefreshToken
};