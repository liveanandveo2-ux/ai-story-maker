# 🚀 AI Story Maker - Local Setup Guide

## ✅ **APPLICATION IS ALREADY RUNNING!**

Currently active in your environment:
- **Frontend**: http://localhost:5173/ ✅ RUNNING
- **Backend API**: http://localhost:3001/ ✅ RUNNING

## 🌐 **Access the Application**

1. **Open your web browser** and go to: **http://localhost:5173/**
2. The application will load with the beautiful login screen
3. You can explore all features without any setup required!

## 🛠️ **How to Run It Yourself (Fresh Setup)**

### **Prerequisites**
```bash
Node.js 18+ (Download from nodejs.org)
npm (comes with Node.js)
```

### **Step 1: Clone/Navigate to Project**
```bash
# If you have the project files
cd ai-story-maker

# If you need to create from scratch, all files are already in:
# c:/Anand/Web-APPS/AI-Story-Maker
```

### **Step 2: Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm install --prefix backend
```

### **Step 3: Configure Environment**
```bash
# Frontend environment (.env)
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Backend environment (backend/.env)
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key
```

### **Step 4: Start the Application**

#### **Option A: Run Both Servers Separately**
```bash
# Terminal 1 - Start Frontend
npm run dev

# Terminal 2 - Start Backend
npm run backend
```

#### **Option B: Run Both Simultaneously**
```bash
npm run dev:full
```

### **Step 5: Access the Application**
- **Frontend**: http://localhost:5173/
- **Backend Health Check**: http://localhost:3001/api/health

## 🎯 **What You'll See**

1. **Login Screen** - Beautiful gradient background with animated elements
2. **Dashboard** - Story management interface with sample stories
3. **Story Creator** - AI-powered story generation form
4. **Story Viewer** - Reading interface with audio support
5. **Storybook** - Interactive animated storybook experience

## 🧪 **Testing Features**

### **Without Authentication (Demo Mode)**
The application includes mock authentication that works immediately:
- Click "Continue with Google" to enter demo mode
- Explore all features with sample data

### **Story Creation**
- Fill in any story prompt (e.g., "A brave knight discovers a magical sword")
- Select genre (Fantasy, Adventure, Mystery, etc.)
- Choose story length (Short, Medium, Long, Very Long)
- Configure audio settings (optional)
- Click "Generate My Story" to see AI generation in action

### **Audio Features**
- All stories include audio narration support
- Universal audio player with play/pause, volume, and seeking controls
- Multiple voice types (Male, Female, Child, Elderly)

### **Interactive Storybook**
- Navigate page by page with smooth animations
- Auto-play functionality
- Progress tracking and sidebar navigation

## 🔧 **Troubleshooting**

### **Port Already in Use**
If you get "Port 5173 already in use":
```bash
# Kill existing process
npx kill-port 5173

# Or use a different port
npm run dev -- --port 3000
```

### **Backend Connection Issues**
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# If backend fails to start, check:
# 1. Backend dependencies installed
# 2. .env file configured
# 3. Port 3001 available
```

### **Frontend Build Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Or use npm ci for clean install
npm ci
```

## 📱 **Mobile Testing**

The application is fully responsive:
- Test on mobile by accessing http://localhost:5173/ from your phone
- Use browser dev tools to simulate mobile devices
- All features work seamlessly on touch devices

## 🎨 **Development Features**

### **Hot Reload**
- Frontend changes reload automatically
- Backend requires manual restart with `rs` command

### **Error Handling**
- Comprehensive error messages
- Toast notifications for user feedback
- Loading states and spinners

### **Performance**
- Vite for lightning-fast builds
- Code splitting for optimal loading
- Bundle size optimization

## 🚀 **Production Deployment**

### **Build for Production**
```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

### **Deploy Options**
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Railway, Heroku, or any Node.js hosting
- **Database**: MongoDB Atlas for cloud database

## 📞 **Need Help?**

If you encounter any issues:
1. Check that both servers are running (ports 5173 and 3001)
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check browser console for any JavaScript errors

**The application is ready to use right now at: http://localhost:5173/** 🎉