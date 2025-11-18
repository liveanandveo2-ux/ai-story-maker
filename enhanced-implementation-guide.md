# AI Story Generator - Enhanced Implementation Guide

## New Features Integration

### 1. Google Authentication Setup

#### Google Cloud Console Configuration
```bash
# Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create new project: "AI Story Maker"
3. Enable Google+ API
4. Enable Google Sign-In API

# Step 2: Configure OAuth 2.0
1. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized JavaScript origins: 
   - http://localhost:5173 (development)
   - https://your-domain.vercel.app (production)
4. Authorized redirect URIs:
   - http://localhost:5173/auth/callback
   - https://your-domain.vercel.app/auth/callback
```

#### Frontend Google Auth Implementation
```javascript
// frontend/src/services/authService.js
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

class AuthService {
  constructor() {
    this.provider = new GoogleAuthProvider();
    this.provider.addScope('profile');
    this.provider.addScope('email');
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.provider);
      const { user } = result;
      const token = await user.getIdToken();
      
      // Send token to backend for validation
      await this.sendTokenToBackend(token);
      return user;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  async signOut() {
    await signOut(auth);
    localStorage.removeItem('authToken');
  }

  async sendTokenToBackend(token) {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    localStorage.setItem('authToken', data.jwtToken);
    return data;
  }

  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export default new AuthService();
```

#### Backend Google Auth Middleware
```javascript
// backend/middleware/auth.js
const admin = require('firebase-admin');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture
    };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyFirebaseToken };
```

### 2. MongoDB Atlas Integration

#### Database Schema Design
```javascript
// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  preferences: {
    favoriteGenres: [String],
    defaultStoryLength: {
      type: String,
      enum: ['short', 'medium', 'long'],
      default: 'medium'
    },
    audioSettings: {
      voiceSpeed: {
        type: Number,
        default: 1.0
      },
      voiceType: {
        type: String,
        default: 'default'
      }
    }
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    storiesRemaining: {
      type: Number,
      default: 10 // Free tier limit
    }
  }
});

module.exports = mongoose.model('User', userSchema);

// backend/models/Story.js
const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  prompt: String,
  genre: {
    type: String,
    required: true,
    enum: ['fantasy', 'adventure', 'mystery', 'romance', 'sci-fi', 'horror', 'comedy', 'drama']
  },
  length: {
    type: String,
    enum: ['short', 'medium', 'long'],
    required: true
  },
  audioUrl: String, // TTS generated audio file
  audioDuration: Number,
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    audioPlays: {
      type: Number,
      default: 0
    }
  }
});

module.exports = mongoose.model('Story', storySchema);

// backend/models/Storybook.js
const storybookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  pages: [{
    content: String,
    imageUrl: String,
    audioUrl: String,
    pageNumber: Number
  }],
  pdfUrl: String,
  audioNarrationUrl: String,
  totalDuration: Number,
  theme: {
    type: String,
    default: 'default'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Storybook', storybookSchema);
```

#### MongoDB Atlas Connection
```javascript
// backend/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 3. Audio Playback System

#### Text-to-Speech Service
```javascript
// backend/services/audioService.js
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs').promises;
const path = require('path');

class AudioService {
  constructor() {
    this.ttsClient = new textToSpeech.TextToSpeechClient();
  }

  async generateSpeech(text, options = {}) {
    const {
      voice = 'en-US-Studio-O',
      audioEncoding = 'MP3',
      speakingRate = 1.0,
      pitch = 0.0
    } = options;

    try {
      const request = {
        input: { text: text },
        voice: {
          languageCode: 'en-US',
          name: voice
        },
        audioConfig: {
          audioEncoding: audioEncoding,
          speakingRate: speakingRate,
          pitch: pitch
        },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      // Save audio file
      const filename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
      const filepath = path.join(__dirname, '../uploads/audio', filename);
      
      await fs.writeFile(filepath, response.audioContent);
      
      return {
        filename,
        filepath,
        url: `/uploads/audio/${filename}`,
        duration: await this.getAudioDuration(filepath)
      };
    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    }
  }

  async getAudioDuration(filepath) {
    // Use a library like 'music-metadata' to get duration
    const mm = require('music-metadata');
    const metadata = await mm.parseFile(filepath);
    return metadata.format.duration;
  }

  async generateStoryAudio(story) {
    const chapters = this.splitIntoChapters(story.content);
    const audioPromises = chapters.map(chapter => 
      this.generateSpeech(chapter.content, {
        voice: this.getVoiceForGenre(story.genre),
        speakingRate: 0.9 // Slightly slower for stories
      })
    );

    const audioResults = await Promise.all(audioPromises);
    
    return {
      chapters: audioResults,
      totalDuration: audioResults.reduce((sum, audio) => sum + audio.duration, 0)
    };
  }

  splitIntoChapters(content) {
    // Split story into logical chunks (paragraphs or sections)
    const paragraphs = content.split('\n\n');
    const chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > 500) {
        chunks.push({ content: currentChunk.trim() });
        currentChunk = paragraph;
      } else {
        currentChunk += '\n\n' + paragraph;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push({ content: currentChunk.trim() });
    }

    return chunks;
  }

  getVoiceForGenre(genre) {
    const voiceMap = {
      'fantasy': 'en-US-Studio-O',
      'adventure': 'en-US-Studio-M',
      'mystery': 'en-US-Studio-O',
      'romance': 'en-US-Studio-A', // Female voice
      'sci-fi': 'en-US-Studio-D',
      'horror': 'en-US-Studio-Q', // Deeper voice
      'comedy': 'en-US-Studio-A',
      'drama': 'en-US-Studio-O'
    };
    return voiceMap[genre] || 'en-US-Studio-O';
  }
}

module.exports = new AudioService();
```

#### Audio Player Component
```javascript
// frontend/src/components/AudioPlayer/AudioPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

const AudioPlayer = ({ audioUrl, title, onPlay, onPause, onEnded }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded && onEnded();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      onPause && onPause();
    } else {
      audio.play();
      onPlay && onPlay();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max="100"
          value={duration ? (currentTime / duration) * 100 : 0}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6 ml-1" />
          )}
        </button>

        <div className="flex items-center space-x-2">
          <button onClick={toggleMute} className="text-gray-600 hover:text-gray-800">
            {isMuted ? (
              <SpeakerXMarkIcon className="w-5 h-5" />
            ) : (
              <SpeakerWaveIcon className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume * 100}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
```

### 4. Enhanced Story Display with Audio
```javascript
// frontend/src/components/Story/StoryDisplay.jsx
import React, { useState, useEffect } from 'react';
import AudioPlayer from '../AudioPlayer/AudioPlayer';

const StoryDisplay = ({ story }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    if (story && !story.audioUrl) {
      generateAudio();
    } else if (story?.audioUrl) {
      setAudioUrl(story.audioUrl);
    }
  }, [story]);

  const generateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const response = await fetch('/api/audio/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ storyId: story._id })
      });
      
      const data = await response.json();
      setAudioUrl(data.audioUrl);
    } catch (error) {
      console.error('Audio generation failed:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleAudioPlay = () => {
    // Track audio play analytics
    fetch(`/api/stories/${story._id}/analytics/audio-play`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{story.title}</h1>
        
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {story.genre}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {story.length}
          </span>
        </div>

        <div className="prose max-w-none mb-8">
          {story.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-gray-700 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Audio Narration</h3>
            <AudioPlayer
              audioUrl={audioUrl}
              title={`Listen to: ${story.title}`}
              onPlay={handleAudioPlay}
            />
          </div>
        )}

        {isGeneratingAudio && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Generating audio narration...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryDisplay;
```

### 5. Storybook with Audio Narration
```javascript
// frontend/src/components/Storybook/StorybookViewer.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';

const StorybookViewer = ({ storybook }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlayingPageAudio, setIsPlayingPageAudio] = useState(false);

  const nextPage = () => {
    if (currentPage < storybook.pages.length - 1) {
      setCurrentPage(currentPage + 1);
      stopCurrentAudio();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      stopCurrentAudio();
    }
  };

  const stopCurrentAudio = () => {
    // Stop any currently playing audio
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setIsPlayingPageAudio(false);
  };

  const playPageAudio = (pageIndex) => {
    const audioElement = document.getElementById(`page-audio-${pageIndex}`);
    if (audioElement) {
      stopCurrentAudio();
      audioElement.play();
      setIsPlayingPageAudio(true);
      
      audioElement.addEventListener('ended', () => {
        setIsPlayingPageAudio(false);
      });
    }
  };

  const currentPageData = storybook.pages[currentPage];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full">
        {/* Storybook Page */}
        <div className="relative">
          <img 
            src={currentPageData.imageUrl} 
            alt={`Page ${currentPage + 1}`}
            className="w-full h-96 object-cover rounded-t-lg"
          />
          
          {/* Audio Button for Page */}
          {currentPageData.audioUrl && (
            <button
              onClick={() => playPageAudio(currentPage)}
              className="absolute top-4 right-4 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              disabled={isPlayingPageAudio}
            >
              <SpeakerWaveIcon className="w-6 h-6" />
            </button>
          )}
          
          {/* Hidden Audio Element */}
          {currentPageData.audioUrl && (
            <audio 
              id={`page-audio-${currentPage}`}
              src={currentPageData.audioUrl}
              preload="metadata"
            />
          )}
        </div>

        {/* Page Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <span className="text-sm text-gray-500">
              Page {currentPage + 1} of {storybook.pages.length}
            </span>
          </div>
          
          <div className="text-lg text-gray-700 leading-relaxed text-center">
            {currentPageData.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center p-6 border-t">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="flex space-x-2">
            {storybook.pages.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentPage(index);
                  stopCurrentAudio();
                }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentPage ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === storybook.pages.length - 1}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRightIcon className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorybookViewer;
```

### 6. Environment Configuration
```bash
# .env file for backend
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-story-maker?retryWrites=true&w=majority
HUGGINGFACE_API_KEY=your_huggingface_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-cloud-credentials.json
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
NODE_ENV=development

# .env file for frontend
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### 7. Mobile-Specific Optimizations
```css
/* Mobile audio player optimizations */
@media (max-width: 768px) {
  .audio-player {
    @apply mx-4;
  }
  
  .audio-controls {
    @apply flex-col space-y-4;
  }
  
  .audio-progress {
    @apply w-full;
  }
  
  .audio-volume {
    @apply w-full max-w-none;
  }
}

/* Touch optimizations for storybook */
.storybook-page {
  @apply touch-pan-x touch-pinch-zoom;
  /* Prevent horizontal scroll */
  overflow-x: hidden;
}

/* Mobile-specific audio controls */
@media (max-width: 640px) {
  .audio-button {
    @apply w-14 h-14; /* Larger touch targets */
  }
  
  .audio-progress {
    @apply h-3; /* Thicker slider for touch */
  }
}
```

This enhanced implementation guide now includes:
- ✅ Google OAuth 2.0 authentication setup
- ✅ MongoDB Atlas integration with proper schemas
- ✅ Comprehensive audio playback system
- ✅ Mobile-optimized audio controls
- ✅ Storybook with synchronized audio narration
- ✅ Complete environment configuration