const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const OpenAI = require('openai');
const { validateOpenAIKey, isServiceConfigured, maskApiKey, cleanApiKey } = require('../utils/apiValidators');
const router = express.Router();

// Initialize OpenAI client with cleaned API key
let openai = null;
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey) {
  const cleanedKey = cleanApiKey(openaiKey);
  if (validateOpenAIKey(cleanedKey)) {
    openai = new OpenAI({
      apiKey: cleanedKey,
    });
    console.log('✅ OpenAI TTS client initialized successfully');
  } else {
    console.log('⚠️  OpenAI API key invalid or not provided for TTS');
  }
} else {
  console.log('⚠️  OpenAI API key not provided for TTS');
}

// Ensure audio directory exists
const audioDir = path.join(__dirname, '../public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// GET /api/audio/:filename - Serve audio files
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  
  const audioPath = path.join(audioDir, filename);

  // Check if file exists
  if (!fs.existsSync(audioPath)) {
    return res.status(404).json({ 
      error: 'Audio file not found',
      filename: filename 
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
  try {
    const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
    const availableFiles = files.map(filename => ({
      filename,
      available: fs.existsSync(path.join(audioDir, filename)),
      size: fs.statSync(path.join(audioDir, filename)).size
    }));

    res.json({
      success: true,
      data: availableFiles
    });
  } catch (error) {
    console.error('Error listing audio files:', error);
    res.status(500).json({
      error: 'Failed to list audio files'
    });
  }
});

// POST /api/audio/generate - Generate audio from text using TTS with enhanced error handling
router.post('/generate', async (req, res) => {
  try {
    const { text, voice = 'alloy', speed = 1.0, provider = 'openai' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for audio generation' });
    }

    if (text.length > 4096) {
      return res.status(400).json({ 
        error: 'Text too long for audio generation',
        maxLength: 4096,
        currentLength: text.length
      });
    }

    console.log(`Generating audio for text: "${text.substring(0, 50)}..." (${text.length} chars)`);

    // Multi-provider TTS with robust failover
    const providers = [
      { name: 'openai', priority: 1, enabled: !!openai },
      { name: 'elevenlabs', priority: 2, enabled: !!process.env.ELEVENLABS_API_KEY }
    ].filter(p => p.enabled);

    if (providers.length === 0) {
      return res.status(503).json({
        error: 'No text-to-speech service configured',
        message: 'Please configure either OpenAI or ElevenLabs API keys in your environment',
        providers: {
          openai: !!openai,
          elevenlabs: !!process.env.ELEVENLABS_API_KEY
        },
        suggestion: 'Set OPENAI_API_KEY or ELEVENLABS_API_KEY in your environment variables'
      });
    }

    let lastError = null;
    let usedProvider = null;
    let result = null;

    for (const provider of providers) {
      try {
        console.log(`🔄 Attempting TTS with ${provider.name}...`);
        
        switch (provider.name) {
          case 'openai':
            result = await generateWithOpenAI(text, voice, speed);
            break;
          case 'elevenlabs':
            result = await generateWithElevenLabs(text, voice);
            break;
          default:
            continue;
        }

        if (result && result.success) {
          usedProvider = provider.name;
          console.log(`✅ TTS successful with ${provider.name}`);
          break;
        }
      } catch (error) {
        console.error(`❌ ${provider.name} TTS failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (result && result.success) {
      return res.json({
        success: true,
        message: `Audio generated successfully using ${usedProvider}`,
        data: result.data
      });
    }

    // All providers failed
    throw new Error(`All TTS providers failed. Last error: ${lastError?.message || 'Unknown error'}`);

  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({
      error: 'Failed to generate audio',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        stack: error.stack,
        providers: {
          openai: !!openai,
          elevenlabs: !!process.env.ELEVENLABS_API_KEY
        }
      } : undefined
    });
  }
});

// OpenAI TTS implementation with enhanced error handling
async function generateWithOpenAI(text, voice, speed) {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  try {
    console.log('Using OpenAI TTS with model: tts-1');
    
    const audioResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: mapVoiceType(voice),
      input: text,
      speed: Math.max(0.25, Math.min(4.0, speed)) // Clamp speed to valid range
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioFilename = `openai-${Date.now()}.mp3`;
    const audioPath = path.join(audioDir, audioFilename);

    // Save the audio file
    fs.writeFileSync(audioPath, audioBuffer);

    // Calculate estimated duration (rough estimate: 150 chars per minute)
    const estimatedDuration = Math.ceil(text.length / 150);

    return {
      success: true,
      data: {
        audioUrl: `/api/audio/${audioFilename}`,
        filename: audioFilename,
        provider: 'openai',
        voice: voice,
        textLength: text.length,
        estimatedDuration: estimatedDuration,
        fileSize: audioBuffer.length,
        quality: 'standard'
      }
    };

  } catch (error) {
    console.error('OpenAI TTS error:', error);
    
    // Provide specific error messages based on error type
    if (error.response?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 401) {
      throw new Error('OpenAI API key invalid or expired.');
    } else if (error.message?.includes('quota')) {
      throw new Error('OpenAI API quota exceeded.');
    } else {
      throw new Error(`OpenAI TTS failed: ${error.message}`);
    }
  }
}

// ElevenLabs TTS implementation with enhanced error handling
async function generateWithElevenLabs(text, voice) {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Clean the API key using the utility function
  const cleanedKey = cleanApiKey(process.env.ELEVENLABS_API_KEY);

  if (!cleanedKey) {
    throw new Error('ElevenLabs API key is empty after cleaning');
  }

  const voiceMap = {
    'male': '21m00Tcm4TlvDq8ikWAM',    // Rachel (female as fallback)
    'female': '21m00Tcm4TlvDq8ikWAM',  // Rachel
    'child': 'pNInz6obpgDQGcFmaJgB',   // Adam (male as child alternative)
    'elderly': 'AZnzlk1XvdvUeBnXmlld'  // Domi (elderly voice)
  };

  const voiceId = voiceMap[voice] || voiceMap.female;

  try {
    console.log('Using ElevenLabs TTS');
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': cleanedKey
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    if (response.status !== 200) {
      throw new Error(`ElevenLabs API returned status ${response.status}`);
    }

    const audioBuffer = Buffer.from(response.data);
    const audioFilename = `elevenlabs-${Date.now()}.mp3`;
    const audioPath = path.join(audioDir, audioFilename);

    fs.writeFileSync(audioPath, audioBuffer);

    return {
      success: true,
      message: 'Audio generated successfully using ElevenLabs TTS',
      data: {
        audioUrl: `/api/audio/${audioFilename}`,
        filename: audioFilename,
        provider: 'elevenlabs',
        voice: voice,
        textLength: text.length,
        estimatedDuration: Math.ceil(text.length / 150),
        fileSize: audioBuffer.length,
        quality: 'premium'
      }
    };

  } catch (error) {
    console.error('ElevenLabs API error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('ElevenLabs API key invalid or expired.');
    } else if (error.response?.status === 429) {
      throw new Error('ElevenLabs API rate limit exceeded.');
    } else if (error.message?.includes('quota')) {
      throw new Error('ElevenLabs API quota exceeded.');
    } else {
      throw new Error(`ElevenLabs TTS failed: ${error.message}`);
    }
  }
}

// Map voice types to OpenAI voice names
function mapVoiceType(voiceType) {
  const voiceMap = {
    'male': 'onyx',
    'female': 'alloy',
    'child': 'nova',
    'elderly': 'echo'
  };
  
  return voiceMap[voiceType] || 'alloy';
}

// POST /api/audio/narrate - Generate narration for a story with enhanced error handling
router.post('/narrate', async (req, res) => {
  try {
    const { storyId, storyText, voice = 'alloy', speed = 1.0 } = req.body;

    if (!storyText) {
      return res.status(400).json({ error: 'Story text is required' });
    }

    if (storyText.length > 16000) {
      return res.status(400).json({ 
        error: 'Story text too long for narration',
        maxLength: 16000,
        currentLength: storyText.length,
        suggestion: 'Consider breaking the story into smaller segments'
      });
    }

    console.log(`Generating narration for story: ${storyId || 'unnamed'} (${storyText.length} chars)`);

    // Clean and prepare story text for narration
    const cleanText = cleanTextForNarration(storyText);

    try {
      // Generate audio using OpenAI TTS (preferred for narration)
      if (openai) {
        const audioResponse = await openai.audio.speech.create({
          model: 'tts-1-hd', // Use HD model for better narration quality
          voice: mapVoiceType(voice),
          input: cleanText,
          speed: Math.max(0.25, Math.min(4.0, speed))
        });

        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const audioFilename = `narration-${storyId || Date.now()}.mp3`;
        const audioPath = path.join(audioDir, audioFilename);

        // Save the audio file
        fs.writeFileSync(audioPath, audioBuffer);

        const estimatedDuration = Math.ceil(cleanText.length / 150);

        return res.json({
          success: true,
          message: 'Story narration generated successfully using OpenAI TTS HD',
          data: {
            audioUrl: `/api/audio/${audioFilename}`,
            filename: audioFilename,
            storyId: storyId,
            voice: voice,
            speed: speed,
            estimatedDuration: estimatedDuration,
            fileSize: audioBuffer.length,
            characterCount: cleanText.length,
            quality: 'hd'
          }
        });
      }

      // Fallback to ElevenLabs if OpenAI not available
      if (process.env.ELEVENLABS_API_KEY) {
        const result = await generateWithElevenLabs(cleanText, voice);
        return res.json({
          success: true,
          message: 'Story narration generated successfully using ElevenLabs TTS',
          data: {
            ...result.data,
            storyId: storyId
          }
        });
      }

      throw new Error('No TTS service available for narration');

    } catch (ttsError) {
      console.error('TTS narration error:', ttsError);
      throw new Error(`Failed to generate narration: ${ttsError.message}`);
    }

  } catch (error) {
    console.error('Error generating narration:', error);
    res.status(500).json({
      error: 'Failed to generate narration',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Clean text for better narration with enhanced processing
function cleanTextForNarration(text) {
  return text
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Clean up excessive whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\.{3,}/g, '...')
    // Add natural pauses for better flow
    .replace(/\.\s/g, '. ... ')
    .replace(/!\s/g, '! ... ')
    .replace(/\?\s/g, '? ... ')
    .replace(/:\s/g, ': ... ')
    // Fix common narration issues
    .replace(/\bMr\./g, 'Mister')
    .replace(/\bMrs\./g, 'Missus')
    .replace(/\bDr\./g, 'Doctor')
    .replace(/\bProf\./g, 'Professor')
    .trim();
}

// POST /api/audio/background-music - Generate or select background music
router.post('/background-music', async (req, res) => {
  try {
    const { mood = 'calm', genre = 'ambient', duration = 180, storyId } = req.body;

    console.log(`Selecting/generating background music: mood=${mood}, genre=${genre}`);

    // For now, return a selection of pre-made tracks
    // In a full implementation, this could integrate with music generation APIs
    const musicLibrary = {
      calm: {
        ambient: ['peaceful-ambient.mp3', 'gentle-waves.mp3', 'soft-rain.mp3'],
        classical: ['bach-air.mp3', 'debussy-clair.mp3'],
        nature: ['forest-sounds.mp3', 'ocean-waves.mp3']
      },
      adventure: {
        orchestral: ['epic-journey.mp3', 'brave-explorer.mp3', 'quest-theme.mp3'],
        folk: ['wanderer.mp3', 'adventure-theme.mp3'],
        rock: ['action-rock.mp3', 'heroic-riff.mp3']
      },
      mysterious: {
        dark: ['enigma.mp3', 'whispers.mp3', 'shadows.mp3'],
        suspenseful: ['tension-build.mp3', 'mystery-theme.mp3'],
        eerie: ['haunted.mp3', 'ghostly.mp3']
      },
      happy: {
        upbeat: ['joyful-day.mp3', 'sunshine.mp3', 'playful-melody.mp3'],
        folk: ['happy-folk.mp3', 'cheerful-tune.mp3'],
        jazz: ['swing-time.mp3', 'jazz-vibes.mp3']
      }
    };

    const moodMusic = musicLibrary[mood] || musicLibrary.calm;
    const genreMusic = moodMusic[genre] || Object.values(moodMusic)[0];
    const selectedTrack = genreMusic[Math.floor(Math.random() * genreMusic.length)];

    res.json({
      success: true,
      message: 'Background music selected successfully',
      data: {
        audioUrl: `/api/audio/${selectedTrack}`,
        filename: selectedTrack,
        mood: mood,
        genre: genre,
        duration: duration,
        loop: true,
        storyId: storyId
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

// POST /api/audio/sound-effects - Generate or select sound effects
router.post('/sound-effects', async (req, res) => {
  try {
    const { scene, effects = [], storyId } = req.body;

    console.log(`Generating/selecting sound effects for scene: ${scene}`);

    // Sound effects library
    const effectsLibrary = {
      forest: ['birds-chirping.mp3', 'rustling-leaves.mp3', 'wind-through-trees.mp3', 'footsteps-dirt.mp3'],
      ocean: ['waves-crashing.mp3', 'seagulls.mp3', 'water-splash.mp3', 'ship-bell.mp3'],
      city: ['traffic.mp3', 'crowd-chatter.mp3', 'car-horn.mp3', 'siren.mp3'],
      magic: ['sparkle.mp3', 'whoosh.mp3', 'magical-chime.mp3', 'teleport.mp3'],
      action: ['footsteps.mp3', 'door-slam.mp3', 'explosion.mp3', 'sword-clash.mp3'],
      horror: ['creaking.mp3', 'whisper.mp3', 'heartbeat.mp3', 'chains.mp3'],
      fantasy: ['magic-spell.mp3', 'enchant.mp3', 'transformation.mp3', 'portal.mp3']
    };

    const sceneEffects = effectsLibrary[scene] || effectsLibrary.forest;
    const selectedEffects = effects.length > 0
      ? effects.filter(effect => sceneEffects.includes(`${effect}.mp3`))
      : sceneEffects.slice(0, 3); // Limit to 3 effects

    if (selectedEffects.length === 0) {
      selectedEffects.push('ambient.mp3'); // Fallback
    }

    res.json({
      success: true,
      message: 'Sound effects selected successfully',
      data: {
        scene: scene,
        storyId: storyId,
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

// POST /api/audio/cleanup - Clean up old audio files
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge = 24 * 60 * 60 * 1000 } = req.body; // Default 24 hours
    
    const now = Date.now();
    const deletedFiles = [];
    
    const files = fs.readdirSync(audioDir);
    
    for (const file of files) {
      if (file.endsWith('.mp3')) {
        const filePath = path.join(audioDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedFiles.length} old audio files`,
      data: {
        deletedFiles,
        totalDeleted: deletedFiles.length
      }
    });

  } catch (error) {
    console.error('Error during audio cleanup:', error);
    res.status(500).json({
      error: 'Failed to clean up audio files',
      details: error.message
    });
  }
});

module.exports = router;