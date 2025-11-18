const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MongoDB URI is set and not using local default
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri || mongoUri.includes('localhost:27017') || mongoUri.includes('127.0.0.1:27017')) {
      console.log('⚠️  MongoDB not configured, using mock data mode');
      console.log('💡 To enable real database: Set MONGODB_URI environment variable to MongoDB Atlas or local MongoDB');
      return;
    }

    const conn = await mongoose.connect(mongoUri, {
      // Removed deprecated options for newer mongoose versions
    });

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
      console.log('⚠️  Falling back to mock data mode');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, using mock data mode');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.log('⚠️  Falling back to mock data mode - application will continue with in-memory storage');
    console.log('💡 To fix: Set MONGODB_URI environment variable to a valid MongoDB connection string');
  }
};

// Check if database is connected
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Get connection state
const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = { connectDB, isConnected, getConnectionState };