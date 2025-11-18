const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const router = express.Router();

// Mock audio files - in a real app, these would be stored in a CDN or cloud storage
const audioFiles = {
  'story-1.mp3': {
    path: path.join(__dirname, '../public/audio/story-1.mp3'),
    fallback: true // Use fallback audio if file doesn't exist
  },
  'story-2.mp3': {
    path: path.join(__dirname, '../public/audio/story-2.mp3'),
    fallback: true
  }
};

// Text-to-Speech API configuration
const TTS_PROVIDERS = {
  ELEVENLABS: 'elevenlabs',
  GOOGLE: 'google',
  OPENAI: 'openai'
};

// GET /api/audio/:filename - Serve audio files
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Check if audio file is requested
  if (!audioFiles[filename]) {
    return res.status(404).json({ 
      error: 'Audio file not found',
      filename: filename 
    });
  }

  const audioFile = audioFiles[filename];
  const audioPath = audioFile.path;

  // Check if file exists
  if (!fs.existsSync(audioPath)) {
    console.log(`Audio file not found: ${audioPath}, using fallback`);
    
    // For demo purposes, return a success response with a message
    // In a real app, you might serve a default audio file or generate one
    return res.json({
      message: 'Audio file not available in demo mode',
      filename: filename,
      fallback: true
    });
  }

  // Set appropriate headers for audio files
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('Accept-Ranges', 'bytes');

  // Create read stream and pipe to response
  const readStream = fs.createReadStream(audioPath);
  readStream.on('error', (err) => {
    console.error('Error reading audio file:', err);
    res.status(500).json({ error: 'Error reading audio file' });
  });

  readStream.pipe(res);
});

// GET /api/audio/list - List available audio files
router.get('/', (req, res) => {
  const availableFiles = Object.keys(audioFiles).map(filename => ({
    filename,
    available: fs.existsSync(audioFiles[filename].path)
  }));

  res.json({
    success: true,
    data: availableFiles
  });
});

// POST /api/audio/generate - Generate audio from text using TTS
router.post('/generate', async (req, res) => {
  try {
    const { text, voice = 'default', provider = 'openai' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for audio generation' });
    }

    // For demo purposes, return a mock response
    // In production, integrate with actual TTS services
    console.log(`Generating audio for text: "${text.substring(0, 50)}..."`);

    // Simulate TTS generation
    const audioFilename = `generated-${Date.now()}.mp3`;
    const audioPath = path.join(__dirname, '../public/audio', audioFilename);

    // In a real implementation, you would:
    // 1. Call the TTS API (OpenAI, ElevenLabs, Google Cloud TTS, etc.)
    // 2. Save the audio file to storage
    // 3. Return the URL to the audio file

    res.json({
      success: true,
      message: 'Audio generation simulated (demo mode)',
      data: {
        audioUrl: `/api/audio/${audioFilename}`,
        filename: audioFilename,
        provider: provider,
        voice: voice,
        textLength: text.length,
        estimatedDuration: Math.ceil(text.length / 150) // Rough estimate: 150 chars per minute
      }
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({
      error: 'Failed to generate audio',
      details: error.message
    });
  }
});

// POST /api/audio/narrate - Generate narration for a story
router.post('/narrate', async (req, res) => {
  try {
    const { storyId, storyText, voice = 'alloy', speed = 1.0 } = req.body;

    if (!storyText) {
      return res.status(400).json({ error: 'Story text is required' });
    }

    console.log(`Generating narration for story: ${storyId || 'unnamed'}`);

    // Demo response - in production, integrate with OpenAI TTS or similar
    const audioFilename = `narration-${storyId || Date.now()}.mp3`;

    res.json({
      success: true,
      message: 'Story narration generated (demo mode)',
      data: {
        audioUrl: `/api/audio/${audioFilename}`,
        filename: audioFilename,
        storyId: storyId,
        voice: voice,
        speed: speed,
        duration: Math.ceil(storyText.length / 150) * 60 // Estimate in seconds
      }
    });
  } catch (error) {
    console.error('Error generating narration:', error);
    res.status(500).json({
      error: 'Failed to generate narration',
      details: error.message
    });
  }
});

// POST /api/audio/background-music - Get background music for a story
router.post('/background-music', async (req, res) => {
  try {
    const { mood = 'calm', genre = 'ambient', duration = 180 } = req.body;

    console.log(`Selecting background music: mood=${mood}, genre=${genre}`);

    // Mock background music library
    const musicLibrary = {
      calm: ['peaceful-piano.mp3', 'gentle-waves.mp3', 'soft-rain.mp3'],
      adventure: ['epic-journey.mp3', 'brave-explorer.mp3', 'quest-theme.mp3'],
      mysterious: ['enigma.mp3', 'whispers.mp3', 'shadows.mp3'],
      happy: ['joyful-day.mp3', 'sunshine.mp3', 'playful-melody.mp3']
    };

    const selectedMusic = musicLibrary[mood] || musicLibrary.calm;
    const randomTrack = selectedMusic[Math.floor(Math.random() * selectedMusic.length)];

    res.json({
      success: true,
      data: {
        audioUrl: `/api/audio/${randomTrack}`,
        filename: randomTrack,
        mood: mood,
        genre: genre,
        duration: duration,
        loop: true
      }
    });
  } catch (error) {
    console.error('Error selecting background music:', error);
    res.status(500).json({
      error: 'Failed to select background music',
      details: error.message
    });
  }
});

// POST /api/audio/sound-effects - Get sound effects for story scenes
router.post('/sound-effects', async (req, res) => {
  try {
    const { scene, effects = [] } = req.body;

    console.log(`Selecting sound effects for scene: ${scene}`);

    // Mock sound effects library
    const effectsLibrary = {
      forest: ['birds-chirping.mp3', 'rustling-leaves.mp3', 'wind-through-trees.mp3'],
      ocean: ['waves-crashing.mp3', 'seagulls.mp3', 'water-splash.mp3'],
      city: ['traffic.mp3', 'crowd-chatter.mp3', 'car-horn.mp3'],
      magic: ['sparkle.mp3', 'whoosh.mp3', 'magical-chime.mp3'],
      action: ['footsteps.mp3', 'door-slam.mp3', 'explosion.mp3']
    };

    const sceneEffects = effectsLibrary[scene] || effectsLibrary.forest;
    const selectedEffects = effects.length > 0
      ? effects.map(effect => `${effect}.mp3`)
      : sceneEffects;

    res.json({
      success: true,
      data: {
        scene: scene,
        effects: selectedEffects.map(filename => ({
          audioUrl: `/api/audio/${filename}`,
          filename: filename,
          type: 'sound-effect'
        }))
      }
    });
  } catch (error) {
    console.error('Error selecting sound effects:', error);
    res.status(500).json({
      error: 'Failed to select sound effects',
      details: error.message
    });
  }
});

module.exports = router;