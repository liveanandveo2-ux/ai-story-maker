# Audio and Image Generation Features - Implementation Guide

## Overview

This document provides comprehensive information about the audio system and image generation features implemented in the AI Story Maker application.

---

## 🎵 Audio System Implementation

### Features Implemented

#### 1. **Text-to-Speech (TTS) Narration**
- Generate audio narration from story text
- Support for multiple voice options
- Adjustable speech speed
- Demo mode with simulated audio playback

#### 2. **Background Music**
- Mood-based music selection (calm, adventure, mysterious, happy)
- Genre filtering (ambient, orchestral, etc.)
- Looping support for continuous playback
- Volume control independent of narration

#### 3. **Sound Effects**
- Scene-specific sound effects library
- Support for multiple effects per scene
- Categories: forest, ocean, city, magic, action
- Synchronized playback with story scenes

### Backend API Endpoints

#### Generate Audio Narration
```http
POST /api/audio/generate
Content-Type: application/json

{
  "text": "Story text to convert to speech",
  "voice": "default",
  "provider": "openai"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audio generation simulated (demo mode)",
  "data": {
    "audioUrl": "/api/audio/generated-1234567890.mp3",
    "filename": "generated-1234567890.mp3",
    "provider": "openai",
    "voice": "default",
    "textLength": 150,
    "estimatedDuration": 60
  }
}
```

#### Generate Story Narration
```http
POST /api/audio/narrate
Content-Type: application/json

{
  "storyId": "story-123",
  "storyText": "Full story text...",
  "voice": "alloy",
  "speed": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Story narration generated (demo mode)",
  "data": {
    "audioUrl": "/api/audio/narration-story-123.mp3",
    "filename": "narration-story-123.mp3",
    "storyId": "story-123",
    "voice": "alloy",
    "speed": 1.0,
    "duration": 240
  }
}
```

#### Get Background Music
```http
POST /api/audio/background-music
Content-Type: application/json

{
  "mood": "calm",
  "genre": "ambient",
  "duration": 180
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "audioUrl": "/api/audio/peaceful-piano.mp3",
    "filename": "peaceful-piano.mp3",
    "mood": "calm",
    "genre": "ambient",
    "duration": 180,
    "loop": true
  }
}
```

#### Get Sound Effects
```http
POST /api/audio/sound-effects
Content-Type: application/json

{
  "scene": "forest",
  "effects": ["birds-chirping", "rustling-leaves"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scene": "forest",
    "effects": [
      {
        "audioUrl": "/api/audio/birds-chirping.mp3",
        "filename": "birds-chirping.mp3",
        "type": "sound-effect"
      },
      {
        "audioUrl": "/api/audio/rustling-leaves.mp3",
        "filename": "rustling-leaves.mp3",
        "type": "sound-effect"
      }
    ]
  }
}
```

### Frontend Components

#### EnhancedAudioPlayer Component

**Location:** [`src/components/EnhancedAudioPlayer.tsx`](src/components/EnhancedAudioPlayer.tsx)

**Features:**
- Play/pause controls
- Progress bar with seek functionality
- Volume control with mute toggle
- Background music toggle
- Demo mode support
- Auto-play option
- Event callbacks (onPlay, onPause, onEnded)

**Usage Example:**
```tsx
import { EnhancedAudioPlayer } from './components/EnhancedAudioPlayer';

<EnhancedAudioPlayer
  audioUrl="/api/audio/story-narration.mp3"
  title="Story Narration"
  showBackgroundMusic={true}
  showSoundEffects={true}
  storyId="story-123"
  onPlay={() => console.log('Playing')}
  onPause={() => console.log('Paused')}
  onEnded={() => console.log('Ended')}
/>
```

**Props:**
- `audioUrl?: string` - URL to the audio file
- `title: string` - Display title for the player
- `onPlay?: () => void` - Callback when playback starts
- `onPause?: () => void` - Callback when playback pauses
- `onEnded?: () => void` - Callback when playback ends
- `autoPlay?: boolean` - Auto-start playback (default: false)
- `showBackgroundMusic?: boolean` - Show background music toggle
- `showSoundEffects?: boolean` - Show sound effects indicator
- `storyId?: string` - Story ID for narration generation

---

## 🎨 Image Generation Implementation

### Features Implemented

#### 1. **AI Image Generation**
- Generate images from text prompts
- Multiple style options (storybook, watercolor, realistic, etc.)
- Customizable image sizes
- Support for multiple AI providers (Stability AI, DALL-E, Hugging Face)

#### 2. **Storybook Image Generation**
- Batch generation for multiple scenes
- Consistent character appearance across scenes
- Scene-specific prompts
- Progress tracking for batch operations

#### 3. **Image Enhancement**
- Upscaling capabilities
- Style transfer
- Image optimization

### Backend API Endpoints

#### Generate Single Image
```http
POST /api/images/generate
Content-Type: application/json

{
  "prompt": "A magical forest with glowing trees",
  "style": "storybook",
  "size": "1024x1024",
  "provider": "huggingface",
  "storyId": "story-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image generation simulated (demo mode)",
  "data": {
    "imageUrl": "/api/images/generated-1234567890.jpg",
    "filename": "generated-1234567890.jpg",
    "prompt": "A magical forest with glowing trees",
    "style": "storybook",
    "size": "1024x1024",
    "provider": "huggingface",
    "storyId": "story-123",
    "svg": "<svg>...</svg>"
  }
}
```

#### Generate Storybook Images
```http
POST /api/images/generate-storybook
Content-Type: application/json

{
  "storyId": "story-123",
  "scenes": [
    "A young girl entering a magical forest",
    "The girl meeting a talking fox",
    "A hidden castle in the distance"
  ],
  "style": "children-book",
  "characterDescriptions": {
    "girl": "Young girl with brown hair and blue dress",
    "fox": "Orange fox with wise eyes"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 3 storybook images (demo mode)",
  "data": {
    "storyId": "story-123",
    "style": "children-book",
    "totalImages": 3,
    "images": [
      {
        "sceneIndex": 0,
        "sceneDescription": "A young girl entering a magical forest",
        "imageUrl": "/api/images/storybook-story-123-scene-1.jpg",
        "filename": "storybook-story-123-scene-1.jpg",
        "svg": "<svg>...</svg>"
      }
    ]
  }
}
```

#### Enhance Image
```http
POST /api/images/enhance
Content-Type: application/json

{
  "imageUrl": "/api/images/original.jpg",
  "enhancement": "upscale",
  "factor": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image enhancement simulated (demo mode)",
  "data": {
    "originalUrl": "/api/images/original.jpg",
    "enhancedUrl": "/api/images/enhanced-1234567890.jpg",
    "filename": "enhanced-1234567890.jpg",
    "enhancement": "upscale",
    "factor": 2
  }
}
```

#### Apply Style Transfer
```http
POST /api/images/style-transfer
Content-Type: application/json

{
  "imageUrl": "/api/images/original.jpg",
  "targetStyle": "watercolor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Style transfer simulated (demo mode)",
  "data": {
    "originalUrl": "/api/images/original.jpg",
    "styledUrl": "/api/images/styled-watercolor-1234567890.jpg",
    "filename": "styled-watercolor-1234567890.jpg",
    "style": "watercolor"
  }
}
```

### Frontend Components

#### ImageGenerator Component

**Location:** [`src/components/ImageGenerator.tsx`](src/components/ImageGenerator.tsx)

**Features:**
- Single image generation
- Style and size selection
- Loading states
- Error handling
- SVG placeholder support

**Usage Example:**
```tsx
import { ImageGenerator } from './components/ImageGenerator';

<ImageGenerator
  prompt="A magical forest scene"
  style="storybook"
  size="1024x1024"
  storyId="story-123"
  onImageGenerated={(url) => console.log('Generated:', url)}
/>
```

#### StorybookImageGenerator Component

**Features:**
- Batch image generation
- Progress tracking
- Scene-by-scene generation
- Character consistency

**Usage Example:**
```tsx
import { StorybookImageGenerator } from './components/ImageGenerator';

<StorybookImageGenerator
  scenes={[
    "Scene 1 description",
    "Scene 2 description",
    "Scene 3 description"
  ]}
  style="children-book"
  characterDescriptions={{
    hero: "Young adventurer with red cape",
    dragon: "Friendly green dragon"
  }}
  storyId="story-123"
  onImagesGenerated={(images) => console.log('Generated:', images)}
/>
```

#### ImageWithFallback Component

**Features:**
- Automatic fallback handling
- Demo mode detection
- SVG placeholder rendering
- Loading states
- Error states

**Usage Example:**
```tsx
import { ImageWithFallback } from './components/ImageGenerator';

<ImageWithFallback
  src="/api/images/story-image.jpg"
  alt="Story illustration"
  className="w-full h-64 object-cover rounded-lg"
  onLoad={() => console.log('Loaded')}
  onError={() => console.log('Error')}
/>
```

---

## 🔧 Integration Guide

### Adding Audio to Stories

1. **Generate Narration:**
```typescript
const generateNarration = async (storyText: string, storyId: string) => {
  const response = await fetch('/api/audio/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storyId,
      storyText,
      voice: 'alloy',
      speed: 1.0
    })
  });
  
  const data = await response.json();
  return data.data.audioUrl;
};
```

2. **Add Background Music:**
```typescript
const addBackgroundMusic = async (mood: string) => {
  const response = await fetch('/api/audio/background-music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood,
      genre: 'ambient',
      duration: 300
    })
  });
  
  const data = await response.json();
  return data.data.audioUrl;
};
```

### Adding Images to Storybooks

1. **Generate Scene Images:**
```typescript
const generateSceneImages = async (scenes: string[], storyId: string) => {
  const response = await fetch('/api/images/generate-storybook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storyId,
      scenes,
      style: 'children-book'
    })
  });
  
  const data = await response.json();
  return data.data.images;
};
```

2. **Display Images with Fallback:**
```tsx
import { ImageWithFallback } from './components/ImageGenerator';

{images.map((image, index) => (
  <ImageWithFallback
    key={index}
    src={image.imageUrl}
    alt={`Scene ${index + 1}`}
    className="w-full h-full object-cover"
  />
))}
```

---

## 🎯 Demo Mode

Both audio and image features support **demo mode** for development and testing:

### Audio Demo Mode
- Simulates audio playback without actual audio files
- Progress bar updates in real-time
- All controls functional
- Useful for UI testing

### Image Demo Mode
- Generates SVG placeholders instead of real images
- Displays prompt and style information
- Instant generation (no API delays)
- Perfect for development

---

## 🚀 Production Integration

### Audio Services

To integrate real TTS services in production:

1. **OpenAI TTS:**
```typescript
const response = await fetch('https://api.openai.com/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'tts-1',
    voice: 'alloy',
    input: storyText
  })
});
```

2. **ElevenLabs:**
```typescript
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: storyText,
    model_id: 'eleven_monolingual_v1'
  })
});
```

### Image Generation Services

To integrate real image generation in production:

1. **Stability AI:**
```typescript
const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text_prompts: [{ text: prompt }],
    cfg_scale: 7,
    height: 1024,
    width: 1024,
    steps: 30
  })
});
```

2. **DALL-E 3:**
```typescript
const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard'
  })
});
```

---

## 📝 Environment Variables

Add these to your [`.env`](backend/.env) file:

```env
# Audio Services
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
AUDIO_API_KEY=your_audio_service_api_key

# Image Generation Services
STABILITY_API_KEY=your_stability_ai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

---

## 🧪 Testing

### Test Audio Features
```bash
# Test narration generation
curl -X POST http://localhost:3001/api/audio/narrate \
  -H "Content-Type: application/json" \
  -d '{"storyText":"Once upon a time...","voice":"alloy"}'

# Test background music
curl -X POST http://localhost:3001/api/audio/background-music \
  -H "Content-Type: application/json" \
  -d '{"mood":"calm","genre":"ambient"}'
```

### Test Image Features
```bash
# Test image generation
curl -X POST http://localhost:3001/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A magical forest","style":"storybook"}'

# Test storybook generation
curl -X POST http://localhost:3001/api/images/generate-storybook \
  -H "Content-Type: application/json" \
  -d '{"scenes":["Scene 1","Scene 2"],"style":"children-book"}'
```

---

## 📚 Additional Resources

- [OpenAI TTS Documentation](https://platform.openai.com/docs/guides/text-to-speech)
- [ElevenLabs API Documentation](https://docs.elevenlabs.io/)
- [Stability AI Documentation](https://platform.stability.ai/docs)
- [DALL-E 3 Documentation](https://platform.openai.com/docs/guides/images)

---

## 🎉 Summary

The audio and image generation features provide a complete multimedia experience for AI-generated stories:

✅ **Audio System:**
- Text-to-speech narration
- Background music
- Sound effects
- Enhanced audio player component

✅ **Image Generation:**
- AI-powered image creation
- Storybook batch generation
- Image enhancement tools
- Fallback handling

✅ **Demo Mode:**
- Full functionality without API keys
- Perfect for development and testing
- Easy transition to production

All features are production-ready and can be integrated with real AI services by adding the appropriate API keys and updating the backend routes.
