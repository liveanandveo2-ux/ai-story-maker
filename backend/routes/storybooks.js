const express = require('express');
const axios = require('axios');
const router = express.Router();

// Import AI generation function
const { generateStoryWithAI } = require('./ai');

// Storybook Generation Routes
router.get('/', async (req, res) => {
  try {
    // This would normally fetch from database
    // For now, return empty array as we're implementing real functionality
    res.json({ 
      success: true, 
      data: [],
      message: 'Storybooks functionality has been enhanced - use create endpoint to generate new storybooks'
    });
  } catch (error) {
    console.error('Error fetching storybooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storybooks'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // This would normally fetch from database
    res.status(404).json({
      success: false,
      error: 'Storybook not found - use POST /api/storybooks/generate to create new storybooks'
    });
  } catch (error) {
    console.error('Error fetching storybook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storybook'
    });
  }
});

// POST /api/storybooks/generate - Generate a complete storybook from a story
router.post('/generate', async (req, res) => {
  try {
    const { 
      storyId, 
      storyText, 
      storyTitle, 
      genre,
      style = 'children-book',
      userId,
      includeImages = true,
      includeAudio = true,
      sceneCount = 8
    } = req.body;

    if (!storyText || !storyTitle) {
      return res.status(400).json({
        error: 'Story text and title are required'
      });
    }

    if (sceneCount > 15) {
      return res.status(400).json({
        error: 'Maximum 15 scenes allowed for storybook generation'
      });
    }

    console.log(`Generating storybook for story: ${storyTitle}`);

    // Step 1: Break story into meaningful scenes
    const scenes = await breakStoryIntoScenes(storyText, sceneCount);
    
    if (scenes.length === 0) {
      throw new Error('Failed to break story into scenes');
    }

    console.log(`Created ${scenes.length} scenes from story`);

    // Step 2: Generate images for each scene
    let images = [];
    let imagesErrors = [];
    
    if (includeImages) {
      try {
        console.log('Starting image generation for storybook...');
        
        // Generate scene descriptions for image generation
        const sceneDescriptions = scenes.map(scene => createImagePrompt(scene.content, scene.description, style));
        
        const imageResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/images/generate-storybook`, {
          storyId,
          scenes: sceneDescriptions,
          style,
          userId
        });

        if (imageResponse.data.success) {
          images = imageResponse.data.data.images || [];
          imagesErrors = imageResponse.data.data.errors || [];
          console.log(`Generated ${images.length} images for storybook (${imagesErrors.length} errors)`);
        } else {
          throw new Error(imageResponse.data.error || 'Image generation failed');
        }
      } catch (imageError) {
        console.error('Image generation failed:', imageError.message);
        imagesErrors.push(`Image generation failed: ${imageError.message}`);
        // Continue without images
      }
    }

    // Step 3: Generate audio narration for the story
    let audioUrl = null;
    let audioFilename = null;
    let audioError = null;
    
    if (includeAudio) {
      try {
        console.log('Starting audio generation for storybook...');
        
        const audioResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/audio/narrate`, {
          storyId,
          storyText: createNarrationText(storyText, scenes),
          voice: 'alloy',
          speed: 0.9
        });

        if (audioResponse.data.success) {
          audioUrl = audioResponse.data.data.audioUrl;
          audioFilename = audioResponse.data.data.filename;
          console.log(`Generated audio narration for storybook: ${audioFilename}`);
        } else {
          throw new Error(audioResponse.data.error || 'Audio generation failed');
        }
      } catch (audioErr) {
        console.error('Audio generation failed:', audioErr.message);
        audioError = audioErr.message;
        // Continue without audio
      }
    }

    // Step 4: Create storybook pages
    const pages = scenes.map((scene, index) => {
      const image = images.find(img => img.sceneIndex === index);
      return {
        id: `page-${index + 1}`,
        pageNumber: index + 1,
        content: scene.content,
        sceneDescription: scene.description,
        imageUrl: image ? image.imageUrl : generatePlaceholderImage(scene.description, index, style),
        imageFilename: image ? image.filename : `placeholder-scene-${index + 1}.svg`,
        audioCue: scene.audioCue || null,
        animationElements: generateAnimationElements(scene, style),
        estimatedReadingTime: Math.ceil(scene.content.split(' ').length / 200) * 60, // seconds
        backgroundMusic: index === 0 ? selectBackgroundMusic(genre, style) : null
      };
    });

    // Calculate total duration
    const totalDuration = pages.reduce((sum, page) => sum + page.estimatedReadingTime, 0);

    // Create the storybook
    const storybook = {
      id: `sb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      storyId,
      title: `${storyTitle} - Interactive Storybook`,
      subtitle: `A ${style.replace('-', ' ')} style storybook in ${genre} genre`,
      genre,
      style,
      creatorId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalPages: pages.length,
      totalDuration,
      hasImages: images.length > 0,
      hasAudio: !!audioUrl,
      pages,
      metadata: {
        scenesGenerated: scenes.length,
        imagesGenerated: images.length,
        audioGenerated: !!audioUrl,
        imagesErrors,
        audioError,
        style: style,
        estimatedAgeGroup: getAgeGroupForStyle(style),
        generationStats: {
          scenesCount: scenes.length,
          imagesCount: images.length,
          audioSize: audioFilename ? 'generated' : 'none'
        }
      }
    };

    console.log(`Storybook generation completed: ${pages.length} pages, ${images.length} images, audio: ${!!audioUrl}`);

    res.json({
      success: true,
      message: 'Storybook generated successfully',
      data: storybook
    });

  } catch (error) {
    console.error('Storybook generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate storybook',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/storybooks/enhance - Enhance an existing storybook
router.post('/enhance', async (req, res) => {
  try {
    const { storybookId, enhancement, userId } = req.body;

    // This would normally fetch and enhance an existing storybook
    res.json({
      success: true,
      message: 'Storybook enhancement completed (demo mode)',
      data: {
        storybookId,
        enhancement,
        enhanced: true
      }
    });
  } catch (error) {
    console.error('Storybook enhancement failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance storybook'
    });
  }
});

// POST /api/storybooks/create-from-prompt - Create storybook directly from prompt
router.post('/create-from-prompt', async (req, res) => {
  try {
    const { 
      prompt, 
      genre = 'fantasy', 
      length = 'medium',
      style = 'children-book',
      userId,
      sceneCount = 8
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required for storybook creation'
      });
    }

    console.log(`Creating storybook from prompt: "${prompt.substring(0, 50)}..."`);

    // Step 1: Generate story using AI
    console.log('Generating story with AI...');
    const storyContent = await generateStoryWithAI(prompt, genre, length);
    const title = generateTitle(prompt, genre);

    if (!storyContent || storyContent.length < 100) {
      throw new Error('AI story generation produced insufficient content');
    }

    console.log(`Generated story: ${title} (${storyContent.length} chars)`);

    // Step 2: Generate complete storybook
    console.log('Generating storybook from story...');
    
    try {
      const storybookResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/storybooks/generate`, {
        storyText: storyContent,
        storyTitle: title,
        genre,
        style,
        userId,
        sceneCount,
        includeImages: true,
        includeAudio: true
      });

      if (storybookResponse.data.success) {
        console.log('Storybook generated successfully!');
        res.json({
          success: true,
          message: 'Storybook created successfully from prompt',
          data: storybookResponse.data.data
        });
      } else {
        throw new Error(storybookResponse.data.error || 'Failed to create storybook');
      }
    } catch (storybookError) {
      console.error('Storybook generation error:', storybookError.message);
      
      // Create fallback storybook with basic structure
      const fallbackStorybook = createFallbackStorybook(storyContent, title, genre, style, sceneCount);
      
      res.json({
        success: true,
        message: 'Storybook created with fallback content',
        data: fallbackStorybook,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Storybook creation from prompt failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create storybook from prompt',
      message: error.message
    });
  }
});

// Enhanced function to break story into meaningful scenes
async function breakStoryIntoScenes(storyText, targetSceneCount) {
  try {
    // Split story into paragraphs
    const paragraphs = storyText.split('\n\n').filter(p => p.trim().length > 20);
    
    if (paragraphs.length === 0) {
      // If no paragraphs found, split by sentences
      const sentences = storyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length === 0) {
        throw new Error('Unable to parse story content');
      }
      
      // Group sentences into scenes
      const sentencesPerScene = Math.ceil(sentences.length / targetSceneCount);
      const scenes = [];
      
      for (let i = 0; i < sentences.length; i += sentencesPerScene) {
        const sceneSentences = sentences.slice(i, i + sentencesPerScene);
        const content = sceneSentences.join('. ') + '.';
        
        scenes.push({
          index: scenes.length,
          content: content.trim(),
          description: createSceneDescription(content.trim()),
          audioCue: `scene-${scenes.length + 1}`
        });
      }
      
      return scenes.slice(0, targetSceneCount);
    }

    if (paragraphs.length <= targetSceneCount) {
      // Each paragraph is a scene
      return paragraphs.map((paragraph, index) => ({
        index,
        content: paragraph.trim(),
        description: createSceneDescription(paragraph.trim()),
        audioCue: `scene-${index + 1}`
      }));
    }

    // Combine paragraphs to create desired number of scenes
    const scenes = [];
    const paragraphsPerScene = Math.ceil(paragraphs.length / targetSceneCount);
    
    for (let i = 0; i < paragraphs.length; i += paragraphsPerScene) {
      const sceneParagraphs = paragraphs.slice(i, i + paragraphsPerScene);
      const content = sceneParagraphs.join('\n\n');
      
      scenes.push({
        index: scenes.length,
        content: content.trim(),
        description: createSceneDescription(content.trim()),
        audioCue: `scene-${scenes.length + 1}`
      });
    }

    return scenes.slice(0, targetSceneCount);
  } catch (error) {
    console.error('Error breaking story into scenes:', error);
    throw new Error(`Failed to parse story: ${error.message}`);
  }
}

// Create enhanced scene description for image generation
function createSceneDescription(content) {
  // Extract key elements from the content for image generation
  const sentences = content.split(/[.!?]+/);
  const firstSentence = sentences[0]?.trim() || content.substring(0, 100);
  
  // Generate a concise description for image generation
  let description = firstSentence;
  
  // Add context based on content keywords
  const keywords = {
    forest: ['in a mystical forest', 'surrounded by ancient trees'],
    castle: ['at a grand castle', 'in a medieval fortress'],
    village: ['in a charming village', 'in a cozy town'],
    mountain: ['in mountainous terrain', 'among snow-capped peaks'],
    ocean: ['by the vast ocean', 'on a beautiful beach'],
    garden: ['in a magical garden', 'among blooming flowers'],
    library: ['in an ancient library', 'surrounded by books']
  };
  
  const contentLower = content.toLowerCase();
  for (const [key, variants] of Object.entries(keywords)) {
    if (contentLower.includes(key)) {
      description += ` ${variants[0]}`;
      break;
    }
  }
  
  // Add character context if mentioned
  if (contentLower.includes('young') || contentLower.includes('child') || contentLower.includes('boy') || contentLower.includes('girl')) {
    description += ', featuring a young protagonist';
  }
  
  // Add magical elements if fantasy
  if (contentLower.includes('magic') || contentLower.includes('spell') || contentLower.includes('enchanted')) {
    description += ', with magical elements';
  }
  
  return description;
}

// Create image prompt for better generation
function createImagePrompt(content, description, style) {
  const stylePrompts = {
    'children-book': 'colorful children\'s book illustration, bright colors, friendly characters, whimsical style',
    'storybook': 'detailed storybook illustration, rich colors, magical atmosphere',
    'watercolor': 'soft watercolor painting, gentle brushstrokes, artistic style',
    'cartoon': 'cartoon style, vibrant colors, expressive characters',
    'realistic': 'realistic illustration, detailed, professional quality'
  };
  
  const stylePrompt = stylePrompts[style] || stylePrompts['children-book'];
  
  return `${description}, ${stylePrompt}, suitable for children`;
}

// Create narration text for audio generation
function createNarrationText(storyText, scenes) {
  // Create a narration-friendly version of the story
  let narrationText = `Welcome to this interactive storybook. `;
  
  scenes.forEach((scene, index) => {
    narrationText += `Page ${index + 1}. ${scene.content} `;
    
    if (index < scenes.length - 1) {
      narrationText += `Let's turn the page and continue our adventure. `;
    }
  });
  
  narrationText += `The End. Thank you for joining us on this magical journey!`;
  
  return narrationText;
}

// Generate animation elements for storybook pages
function generateAnimationElements(scene, style) {
  const elements = [];
  
  // Add magical sparkles for fantasy content
  if (scene.content.toLowerCase().includes('magic') || scene.content.toLowerCase().includes('enchanted') || scene.content.toLowerCase().includes('spell')) {
    elements.push({
      id: `sparkle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'magical-element',
      x: 20 + Math.random() * 60, // 20-80% of width
      y: 20 + Math.random() * 60, // 20-80% of height
      width: 20 + Math.random() * 20, // 20-40px
      height: 20 + Math.random() * 20,
      animation: {
        element: `sparkle-${Date.now()}`,
        type: 'twinkle',
        duration: 2000 + Math.random() * 3000, // 2-5 seconds
        delay: Math.random() * 1000,
        properties: {
          from: { opacity: 0, scale: 0 },
          to: { opacity: 1, scale: 1 }
        }
      }
    });
  }
  
  // Add gentle floating animation for peaceful scenes
  if (scene.content.toLowerCase().includes('gentle') || scene.content.toLowerCase().includes('peaceful') || scene.content.toLowerCase().includes('calm')) {
    elements.push({
      id: `float-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'floating-element',
      x: Math.random() * 70 + 15,
      y: Math.random() * 70 + 15,
      width: 30 + Math.random() * 20,
      height: 30 + Math.random() * 20,
      animation: {
        element: `float-${Date.now()}`,
        type: 'float',
        duration: 4000 + Math.random() * 2000,
        delay: 500,
        properties: {
          from: { y: 0 },
          to: { y: -20 }
        }
      }
    });
  }
  
  return elements;
}

// Select background music for genre and style
function selectBackgroundMusic(genre, style) {
  const musicMap = {
    fantasy: 'magical-ambient',
    adventure: 'epic-orchestral',
    mystery: 'suspenseful-ambient',
    romance: 'gentle-piano',
    'sci-fi': 'futuristic-synth',
    horror: 'dark-ambient',
    comedy: 'playful-upbeat',
    drama: 'emotional-strings',
    thriller: 'tense-orchestral'
  };
  
  return musicMap[genre] || 'gentle-ambient';
}

// Get age group recommendation based on style
function getAgeGroupForStyle(style) {
  const ageGroups = {
    'children-book': '3-8 years',
    'storybook': '6-12 years',
    'watercolor': '4-10 years',
    'cartoon': '3-12 years',
    'realistic': '8+ years'
  };
  
  return ageGroups[style] || '6-12 years';
}

// Generate placeholder image for failed generations
function generatePlaceholderImage(scene, index, style) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const color = colors[index % colors.length];
  const sceneText = scene.substring(0, 30) + (scene.length > 30 ? '...' : '');

  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#grad)"/>
      <text x="400" y="280" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">
        Scene ${index + 1}
      </text>
      <text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="16" fill="white">
        ${sceneText}
      </text>
      <text x="400" y="350" text-anchor="middle" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)">
        Style: ${style.replace('-', ' ')}
      </text>
      <circle cx="400" cy="450" r="40" fill="rgba(255,255,255,0.2)" />
      <text x="400" cy="455" text-anchor="middle" font-family="Arial" font-size="16" fill="white">
        🎨
      </text>
    </svg>
  `).toString('base64')}`;
}

// Create fallback storybook when main generation fails
function createFallbackStorybook(storyContent, title, genre, style, sceneCount) {
  const paragraphs = storyContent.split('\n\n').filter(p => p.trim().length > 10);
  const scenes = paragraphs.slice(0, sceneCount).map((content, index) => ({
    index,
    content: content.trim(),
    description: `Scene ${index + 1} of the story`,
    audioCue: `scene-${index + 1}`
  }));

  const pages = scenes.map((scene, index) => ({
    id: `page-${index + 1}`,
    pageNumber: index + 1,
    content: scene.content,
    sceneDescription: scene.description,
    imageUrl: generatePlaceholderImage(scene.description, index, style),
    imageFilename: `placeholder-scene-${index + 1}.svg`,
    audioCue: scene.audioCue,
    animationElements: [],
    estimatedReadingTime: Math.ceil(scene.content.split(' ').length / 200) * 60
  }));

  return {
    id: `sb-fallback-${Date.now()}`,
    title: `${title} - Storybook (Fallback)`,
    subtitle: `A ${style.replace('-', ' ')} style storybook in ${genre} genre`,
    genre,
    style,
    creatorId: 'system',
    createdAt: new Date(),
    totalPages: pages.length,
    totalDuration: pages.reduce((sum, page) => sum + page.estimatedReadingTime, 0),
    hasImages: true,
    hasAudio: false,
    pages,
    metadata: {
      fallback: true,
      reason: 'Main generation failed, created basic structure',
      scenesGenerated: scenes.length,
      imagesGenerated: 0,
      audioGenerated: false,
      style: style,
      estimatedAgeGroup: getAgeGroupForStyle(style)
    }
  };
}

// GET /api/storybooks/styles - Available storybook styles
router.get('/info/styles', (req, res) => {
  const styles = [
    {
      id: 'children-book',
      name: 'Children\'s Book',
      description: 'Bright, colorful illustrations perfect for young readers',
      ageGroup: '3-8 years',
      features: ['Large text', 'Simple illustrations', 'Bold colors'],
      recommended: true
    },
    {
      id: 'storybook',
      name: 'Classic Storybook',
      description: 'Detailed illustrations with rich storytelling elements',
      ageGroup: '6-12 years',
      features: ['Detailed art', 'Complex scenes', 'Rich colors'],
      recommended: false
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      description: 'Soft, artistic watercolor paintings',
      ageGroup: '4-10 years',
      features: ['Soft edges', 'Gentle colors', 'Artistic style'],
      recommended: false
    },
    {
      id: 'cartoon',
      name: 'Cartoon Style',
      description: 'Fun, animated cartoon illustrations',
      ageGroup: '3-12 years',
      features: ['Expressive characters', 'Bright colors', 'Playful style'],
      recommended: false
    },
    {
      id: 'realistic',
      name: 'Realistic',
      description: 'Photorealistic illustrations for older readers',
      ageGroup: '8+ years',
      features: ['Realistic details', 'Professional quality', 'Complex scenes'],
      recommended: false
    }
  ];
  
  res.json({
    success: true,
    data: styles
  });
});

// Helper function to generate title (copied from ai.js)
function generateTitle(prompt, genre) {
  const adjectives = {
    fantasy: ['Enchanted', 'Mystical', 'Magical', 'Legendary', 'Ancient', 'Secret', 'Hidden'],
    adventure: ['Epic', 'Incredible', 'Thrilling', 'Daring', 'Brave', 'Bold', 'Fearless'],
    mystery: ['Secret', 'Hidden', 'Mysterious', 'Puzzling', 'Intriguing', 'Strange', 'Unknown'],
    romance: ['Love', 'Heart', 'Passionate', 'Sweet', 'Tender', 'Beautiful', 'Romantic'],
    'sci-fi': ['Future', 'Cosmic', 'Digital', 'Cyber', 'Stellar', 'Galactic', 'Advanced'],
    horror: ['Dark', 'Shadow', 'Nightmare', 'Haunted', 'Twisted', 'Creepy', 'Eerie'],
    comedy: ['Funny', 'Hilarious', 'Silly', 'Amusing', 'Playful', 'Cheerful', 'Joyful'],
    drama: ['Deep', 'Emotional', 'Powerful', 'Touching', 'Moving', 'Profound', 'Intense'],
    thriller: ['Dangerous', 'Edge', 'Suspenseful', 'Tense', 'Thrilling', 'Urgent', 'Critical']
  };
  
  const subjects = ['Journey', 'Quest', 'Story', 'Tale', 'Adventure', 'Experience', 'Legend', 'Mystery'];
  const randomAdj = adjectives[genre] ? adjectives[genre][Math.floor(Math.random() * adjectives[genre].length)] : 'Amazing';
  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
  
  return `${randomAdj} ${randomSubject}`;
}

module.exports = router;