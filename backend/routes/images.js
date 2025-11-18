const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const router = express.Router();

// Mock image files - in a real app, these would be stored in a CDN or cloud storage
const imageFiles = {
  'forest-entrance.jpg': {
    path: path.join(__dirname, '../public/images/forest-entrance.jpg'),
    fallback: true
  },
  'placeholder.jpg': {
    path: path.join(__dirname, '../public/images/placeholder.jpg'),
    fallback: true
  },
  'storybook-bg.jpg': {
    path: path.join(__dirname, '../public/images/storybook-bg.jpg'),
    fallback: true
  },
  'adventure-scene.jpg': {
    path: path.join(__dirname, '../public/images/adventure-scene.jpg'),
    fallback: true
  }
};

// Image generation providers
const IMAGE_PROVIDERS = {
  STABILITY: 'stability-ai',
  DALLE: 'dall-e',
  MIDJOURNEY: 'midjourney',
  HUGGINGFACE: 'huggingface'
};

// GET /api/images/:filename - Serve image files
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Check if image file is requested
  if (!imageFiles[filename]) {
    return res.status(404).json({ 
      error: 'Image file not found',
      filename: filename 
    });
  }

  const imageFile = imageFiles[filename];
  const imagePath = imageFile.path;

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.log(`Image file not found: ${imagePath}, using fallback`);
    
    // For demo purposes, return a success response with a message
    // In a real app, you might serve a default image file
    return res.json({
      message: 'Image file not available in demo mode',
      filename: filename,
      fallback: true,
      // Generate a simple SVG placeholder image
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
        <rect width="400" height="300" fill="#e5e7eb"/>
        <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="20" fill="#6b7280">
          Image Placeholder
        </text>
        <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="#9ca3af">
          ${filename}
        </text>
      </svg>`
    });
  }

  // Set appropriate headers for image files
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000');

  // Create read stream and pipe to response
  const readStream = fs.createReadStream(imagePath);
  readStream.on('error', (err) => {
    console.error('Error reading image file:', err);
    res.status(500).json({ error: 'Error reading image file' });
  });

  readStream.pipe(res);
});

// GET /api/images/list - List available image files
router.get('/', (req, res) => {
  const availableFiles = Object.keys(imageFiles).map(filename => ({
    filename,
    available: fs.existsSync(imageFiles[filename].path)
  }));

  res.json({
    success: true,
    data: availableFiles
  });
});

// POST /api/images/generate - Generate images using AI
router.post('/generate', async (req, res) => {
  try {
    const {
      prompt,
      style = 'storybook',
      size = '1024x1024',
      provider = 'huggingface',
      storyId
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for image generation' });
    }

    console.log(`Generating image with prompt: "${prompt.substring(0, 50)}..."`);

    // For demo purposes, return a mock response
    // In production, integrate with actual image generation APIs
    const imageFilename = `generated-${Date.now()}.jpg`;
    const imagePath = path.join(__dirname, '../public/images', imageFilename);

    // Generate a placeholder SVG for demo
    const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(99,102,241);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(168,85,247);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#grad)"/>
      <text x="512" y="450" text-anchor="middle" font-family="Arial" font-size="32" fill="white" font-weight="bold">
        AI Generated Image
      </text>
      <text x="512" y="500" text-anchor="middle" font-family="Arial" font-size="20" fill="white">
        ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}
      </text>
      <text x="512" y="550" text-anchor="middle" font-family="Arial" font-size="16" fill="rgba(255,255,255,0.7)">
        Style: ${style} | Provider: ${provider}
      </text>
    </svg>`;

    res.json({
      success: true,
      message: 'Image generation simulated (demo mode)',
      data: {
        imageUrl: `/api/images/${imageFilename}`,
        filename: imageFilename,
        prompt: prompt,
        style: style,
        size: size,
        provider: provider,
        storyId: storyId,
        svg: placeholderSvg
      }
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error.message
    });
  }
});

// POST /api/images/generate-storybook - Generate multiple images for a storybook
router.post('/generate-storybook', async (req, res) => {
  try {
    const {
      storyId,
      scenes = [],
      style = 'children-book',
      characterDescriptions = {}
    } = req.body;

    if (!scenes || scenes.length === 0) {
      return res.status(400).json({ error: 'Scenes are required for storybook generation' });
    }

    console.log(`Generating ${scenes.length} images for storybook: ${storyId}`);

    // Generate images for each scene
    const generatedImages = scenes.map((scene, index) => {
      const imageFilename = `storybook-${storyId}-scene-${index + 1}.jpg`;
      
      // Create scene-specific placeholder
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:hsl(${index * 40}, 70%, 60%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(${index * 40 + 60}, 70%, 50%);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#grad${index})"/>
        <text x="400" y="280" text-anchor="middle" font-family="Arial" font-size="28" fill="white" font-weight="bold">
          Scene ${index + 1}
        </text>
        <text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="18" fill="white">
          ${scene.substring(0, 50)}${scene.length > 50 ? '...' : ''}
        </text>
        <text x="400" y="350" text-anchor="middle" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)">
          Style: ${style}
        </text>
      </svg>`;

      return {
        sceneIndex: index,
        sceneDescription: scene,
        imageUrl: `/api/images/${imageFilename}`,
        filename: imageFilename,
        svg: placeholderSvg
      };
    });

    res.json({
      success: true,
      message: `Generated ${scenes.length} storybook images (demo mode)`,
      data: {
        storyId: storyId,
        style: style,
        totalImages: scenes.length,
        images: generatedImages
      }
    });
  } catch (error) {
    console.error('Error generating storybook images:', error);
    res.status(500).json({
      error: 'Failed to generate storybook images',
      details: error.message
    });
  }
});

// POST /api/images/enhance - Enhance or upscale an existing image
router.post('/enhance', async (req, res) => {
  try {
    const { imageUrl, enhancement = 'upscale', factor = 2 } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log(`Enhancing image: ${imageUrl} with ${enhancement}`);

    const enhancedFilename = `enhanced-${Date.now()}.jpg`;

    res.json({
      success: true,
      message: 'Image enhancement simulated (demo mode)',
      data: {
        originalUrl: imageUrl,
        enhancedUrl: `/api/images/${enhancedFilename}`,
        filename: enhancedFilename,
        enhancement: enhancement,
        factor: factor
      }
    });
  } catch (error) {
    console.error('Error enhancing image:', error);
    res.status(500).json({
      error: 'Failed to enhance image',
      details: error.message
    });
  }
});

// POST /api/images/style-transfer - Apply artistic style to an image
router.post('/style-transfer', async (req, res) => {
  try {
    const { imageUrl, targetStyle = 'watercolor' } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log(`Applying ${targetStyle} style to image: ${imageUrl}`);

    const styledFilename = `styled-${targetStyle}-${Date.now()}.jpg`;

    res.json({
      success: true,
      message: 'Style transfer simulated (demo mode)',
      data: {
        originalUrl: imageUrl,
        styledUrl: `/api/images/${styledFilename}`,
        filename: styledFilename,
        style: targetStyle
      }
    });
  } catch (error) {
    console.error('Error applying style transfer:', error);
    res.status(500).json({
      error: 'Failed to apply style transfer',
      details: error.message
    });
  }
});

module.exports = router;