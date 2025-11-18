# 📚 AI Story Maker

> **Create magical, AI-powered stories with beautiful narration and interactive experiences**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)

## ✨ Features

- 🤖 **AI-Powered Story Generation**: Create unique, personalized stories with advanced AI
- 🎨 **Beautiful UI**: Modern, responsive design with stunning animations
- 🎵 **Audio Narration**: Professional voice synthesis with customizable settings
- 🌍 **Multi-language Support**: Generate stories in English and Hindi
- 📱 **Fully Responsive**: Perfect experience on desktop, tablet, and mobile
- 🔐 **Secure Authentication**: Google OAuth integration ready
- ☁️ **Cloud-Ready**: Easily deployable to Vercel, Netlify, Railway, or Render

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- (Optional) Google Cloud account for OAuth

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-story-maker.git
   cd ai-story-maker
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev:full  # Runs both frontend and backend
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Zustand** for state management

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **CORS** enabled for cross-origin requests
- **Multer** for file uploads

### Deployment Ready
- **Vercel** (Frontend)
- **Railway/Render** (Backend)
- **MongoDB Atlas** (Database)
- **GitHub Actions** (CI/CD)

## 📖 Usage

1. **Create an Account**: Sign up with email or Google OAuth
2. **Choose Your Story**: Select genre, length, and language preferences
3. **Write a Prompt**: Describe your story idea or use "Surprise Me" for AI inspiration
4. **Enhance with AI**: Use "Enhance with AI" to expand your prompt
5. **Generate Story**: Let AI create your personalized story
6. **Enjoy Audio**: Listen to professional narration with customizable voice settings

## 🎨 Story Generes

- 🧙‍♂️ **Fantasy**: Magical worlds and enchanted adventures
- 🏔️ **Adventure**: Exciting journeys and daring escapades
- 🔍 **Mystery**: Intriguing puzzles and suspenseful tales
- 💕 **Romance**: Love stories and heartwarming relationships
- 🚀 **Sci-Fi**: Future technology and space exploration
- 👻 **Horror**: Scary stories that keep you on edge
- 😂 **Comedy**: Humorous and light-hearted tales
- 🎭 **Drama**: Emotional stories with deep character development
- ⚡ **Thriller**: Suspenseful and action-packed stories

## 🎵 Audio Features

- **Multiple Voice Types**: Male, Female, Child, Elderly
- **Customizable Settings**: Pitch, speed, and volume control
- **High-Quality Synthesis**: Professional audio narration
- **Playback Controls**: Play, pause, and seek functionality

## 🌐 Deployment

### Easy Deploy Options

#### Option 1: Vercel + Railway (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
vercel --prod

# Deploy backend to Railway
# (See DEPLOYMENT_GUIDE.md for detailed instructions)
```

#### Option 2: Netlify + Render
- Frontend: Drag & drop `dist` folder to Netlify
- Backend: Connect GitHub repo to Render

#### Option 3: GitHub Pages + Heroku
- Frontend: Use GitHub Pages with custom domain
- Backend: Deploy to Heroku with MongoDB Atlas

**Full deployment guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 📱 Screenshots

| Home Screen | Story Creation | Audio Player |
|-------------|----------------|--------------|
| ![Home](./docs/home-screenshot.png) | ![Creator](./docs/creator-screenshot.png) | ![Audio](./docs/audio-screenshot.png) |

## 🤝 Contributing

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features

## 📋 Scripts

```bash
# Development
npm run dev              # Frontend development server
npm run backend          # Backend development server
npm run dev:full         # Both frontend and backend

# Building
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Backend
cd backend && npm run dev
cd backend && npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ✅ |
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ |

### Customization

- **Themes**: Modify `tailwind.config.js` for custom colors
- **Stories**: Update story prompts in `src/data/storyPrompts.ts`
- **Audio**: Configure voice settings in `src/components/AudioPlayer.tsx`

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **MongoDB connection fails**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format

3. **Build errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version (18+)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for AI-powered story generation
- **Tailwind CSS** for beautiful styling
- **Framer Motion** for smooth animations
- **Heroicons** for beautiful icons
- **Howler.js** for audio functionality

## 📞 Support

- 📧 **Email**: your-email@example.com
- 💬 **Discord**: [Join our community](https://discord.gg/your-server)
- 🐛 **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/ai-story-maker/issues)

---

<div align="center">

**Made with ❤️ by [Your Name]**

[⭐ Star this repo](https://github.com/YOUR_USERNAME/ai-story-maker) if you find it helpful!

</div>