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
    if (includeImages) {
      try {
        const imageResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/images/generate-storybook`, {
          storyId,
          scenes: scenes.map(scene => scene.description),
          style,
          userId
        });

        if (imageResponse.data.success) {
          images = imageResponse.data.data.images;
          console.log(`Generated ${images.length} images for storybook`);
        }
      } catch (imageError) {
        console.error('Image generation failed:', imageError);
        // Continue without images
      }
    }

    // Step 3: Generate audio narration for the story
    let audioUrl = null;
    let audioFilename = null;
    if (includeAudio) {
      try {
        const audioResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/audio/narrate`, {
          storyId,
          storyText,
          voice: 'alloy',
          speed: 0.9
        });

        if (audioResponse.data.success) {
          audioUrl = audioResponse.data.data.audioUrl;
          audioFilename = audioResponse.data.data.filename;
          console.log(`Generated audio narration for storybook`);
        }
      } catch (audioError) {
        console.error('Audio generation failed:', audioError);
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
        imageUrl: image ? image.imageUrl : null,
        imageFilename: image ? image.filename : null,
        audioCue: scene.audioCue || null,
        animationElements: generateAnimationElements(scene, style),
        estimatedReadingTime: Math.ceil(scene.content.split(' ').length / 200) * 60, // seconds
      };
    });

    // Calculate total duration
    const totalDuration = pages.reduce((sum, page) => sum + page.estimatedReadingTime, 0);

    // Create the storybook
    const storybook = {
      id: `sb-${Date.now()}`,
      storyId,
      title: `${storyTitle} - Interactive Storybook`,
      subtitle: `A ${style.replace('-', ' ')} style storybook`,
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
        style: style,
        estimatedAgeGroup: getAgeGroupForStyle(style)
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
      message: error.message
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

// Helper function to break story into meaningful scenes
async function breakStoryIntoScenes(storyText, targetSceneCount) {
  // Split story into paragraphs
  const paragraphs = storyText.split('\n\n').filter(p => p.trim().length > 0);
  
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
}

// Create a descriptive summary for image generation
function createSceneDescription(content) {
  // Extract key elements from the content for image generation
  const sentences = content.split('.');
  const firstSentence = sentences[0].trim();
  
  // Generate a concise description for image generation
  let description = firstSentence;
  
  // Add context based on content keywords
  if (content.toLowerCase().includes('forest') || content.toLowerCase().includes('trees')) {
    description += ', in a mystical forest';
  } else if (content.toLowerCase().includes('castle') || content.toLowerCase().includes('palace')) {
    description += ', at a grand castle';
  } else if (content.toLowerCase().includes('village') || content.toLowerCase().includes('town')) {
    description += ', in a charming village';
  } else if (content.toLowerCase().includes('mountain') || content.toLowerCase().includes('hill')) {
    description += ', in mountainous terrain';
  }
  
  // Add character context if mentioned
  if (content.toLowerCase().includes('young') || content.toLowerCase().includes('child')) {
    description += ', featuring a young character';
  }
  
  return description;
}

// Generate animation elements for storybook pages
function generateAnimationElements(scene, style) {
  const elements = [];
  
  // Add magical sparkles for fantasy content
  if (scene.content.toLowerCase().includes('magic') || scene.content.toLowerCase().includes('enchanted')) {
    elements.push({
      id: `sparkle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'magical-element',
      x: Math.random() * 80 + 10, // 10-90% of width
      y: Math.random() * 80 + 10, // 10-90% of height
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
  if (scene.content.toLowerCase().includes('gentle') || scene.content.toLowerCase().includes('peaceful')) {
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
    const storyContent = await generateStoryWithAI(prompt, genre, length);
    const title = generateTitle(prompt, genre);

    // Step 2: Generate complete storybook
    const storybookResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/storybooks/generate`, {
      storyText: storyContent,
      storyTitle: title,
      genre,
      style,
      userId,
      sceneCount
    });

    if (storybookResponse.data.success) {
      res.json({
        success: true,
        message: 'Storybook created successfully from prompt',
        data: storybookResponse.data.data
      });
    } else {
      throw new Error(storybookResponse.data.error || 'Failed to create storybook');
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