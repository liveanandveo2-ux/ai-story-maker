# 🚀 AI Story Maker - Complete Deployment Guide

## Table of Contents
1. [GitHub Repository Setup](#github-repository-setup)
2. [Environment Variables Configuration](#environment-variables-configuration)
3. [MongoDB Atlas Setup](#mongodb-atlas-setup)
4. [Google Services Setup (Optional)](#google-services-setup-optional)
5. [Deployment Platforms](#deployment-platforms)
6. [Local Development](#local-development)

---

## GitHub Repository Setup

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `ai-story-maker` (or your preferred name)
   - **Description**: "AI-powered storytelling application with interactive narratives"
   - **Visibility**: Choose Public or Private
   - **Do NOT** initialize with README (we already have code)
5. Click "Create repository"

### Step 2: Initialize Git in Your Project
```bash
# In your project directory
git init
git add .
git commit -m "Initial commit: AI Story Maker application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-story-maker.git
git push -u origin main
```

### Step 3: Set Up GitHub Secrets (for CI/CD)
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"
4. Add these secrets:

**For Frontend (Vercel/Netlify):**
- `VITE_API_URL`: Your backend API URL
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID

**For Backend (Render/Railway):**
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Your JWT secret key
- `PORT`: 3001

---

## Environment Variables Configuration

### Step 1: Create Environment Files

Create these files in your project root:

#### `.env.local` (for local development)
```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend Environment Variables
MONGODB_URI=mongodb://localhost:27017/ai-story-maker
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
PORT=3001
NODE_ENV=development
```

#### `.env.production` (for production)
```env
# Frontend Environment Variables
VITE_API_URL=https://your-backend-url.railway.app
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend Environment Variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-story-maker
JWT_SECRET=your_super_secret_production_jwt_key_here
PORT=3001
NODE_ENV=production
```

### Step 2: Update Configuration Files

#### Update `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          audio: ['howler'],
          animation: ['framer-motion'],
        },
      },
    },
  },
})
```

#### Update `backend/server.js`
```javascript
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/stories');
const audioRoutes = require('./routes/audio');
const imageRoutes = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🚀 MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/images', imageRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 AI Story Maker Backend running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
```

---

## MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up with your email
3. Verify your email address

### Step 2: Create a New Cluster
1. Click "Create a New Cluster"
2. Choose the **free tier** (M0)
3. Select your preferred cloud provider and region
4. Click "Create Cluster"

### Step 3: Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password
5. Assign "Atlas admin" role (or specific read/write roles)

### Step 4: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0)
   - **Note**: In production, use specific IP ranges

### Step 5: Get Connection String
1. Go back to your cluster
2. Click "Connect" button
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password

**Your connection string will look like:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ai-story-maker?retryWrites=true&w=majority
```

---

## Google Services Setup (Optional)

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable required APIs:
   - Google OAuth API
   - Google Drive API (for file uploads)
   - Google Text-to-Speech API (for enhanced audio)

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://your-domain.com` (for production)
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback`
   - `https://your-domain.com/auth/callback`
6. Copy the Client ID

### Step 3: Enable Firebase (Optional Alternative)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication with Google provider
4. Get Firebase config object

---

## Deployment Platforms

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

#### Frontend Deployment (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. In project root: `vercel --prod`
4. Follow the prompts
5. Set environment variables in Vercel dashboard

**Environment Variables for Vercel:**
```
VITE_API_URL=https://your-railway-backend-url.up.railway.app
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

#### Backend Deployment (Railway)
1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Choose the `backend` folder as root
6. Add environment variables:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_production_jwt_secret
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```

### Option 2: Netlify (Frontend) + Render (Backend)

#### Frontend Deployment (Netlify)
1. Go to [Netlify](https://netlify.com/)
2. Drag and drop your `dist` folder or connect GitHub
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables

#### Backend Deployment (Render)
1. Go to [Render](https://render.com/)
2. Connect your GitHub repository
3. Choose "Web Service"
4. Set root directory to `backend`
5. Add environment variables

### Option 3: Single Platform (Vercel/Netlify with Serverless Functions)

#### Vercel with Serverless Functions
```javascript
// api/stories.js (in root directory)
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Your story generation logic
    res.json({ success: true, story: generatedStory });
  }
}
```

---

## Local Development

### Step 1: Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-story-maker.git
cd ai-story-maker
npm install
```

### Step 2: Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
```

### Step 3: Set Up Environment
1. Copy `.env.example` to `.env`
2. Fill in your environment variables
3. Set up local MongoDB (optional) or use MongoDB Atlas

### Step 4: Run Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev

# Or run both concurrently
npm run dev:full
```

---

## Production Checklist

### Before Deployment
- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Google OAuth working
- [ ] Audio features tested
- [ ] Error handling implemented
- [ ] Performance optimized

### After Deployment
- [ ] Test all features in production
- [ ] Check console for errors
- [ ] Verify database connections
- [ ] Test authentication flow
- [ ] Monitor performance and logs

---

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure proper CORS configuration
2. **Environment Variables**: Check variable names (VITE_ prefix for frontend)
3. **Database Connection**: Verify MongoDB Atlas IP whitelist
4. **Build Errors**: Check Node.js version compatibility
5. **OAuth Issues**: Verify redirect URIs in Google Console

### Useful Commands
```bash
# Check environment variables
echo $MONGODB_URI

# Test database connection
npm run test:db

# Build for production
npm run build

# Check bundle size
npm run build:analyze
```

---

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

---

**Need help?** Create an issue in your GitHub repository or contact support.