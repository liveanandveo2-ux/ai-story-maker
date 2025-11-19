const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const OpenAI = require('openai');
const { validateOpenAIKey, validateHuggingFaceKey, isServiceConfigured, maskApiKey } = require('../utils/apiValidators');
const router = express.Router();

// Initialize OpenAI client
let openai = null;
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey && validateOpenAIKey(openaiKey)) {
  openai = new OpenAI({
    apiKey: openaiKey,
  });
  console.log('✅ OpenAI DALL-E client initialized successfully');
} else {
  console.log('⚠️  OpenAI API key invalid or not provided for DALL-E');
}

// Ensure images directory exists
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// GET /api/images/:filename - Serve image files
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  
  const imagePath = path.join(imagesDir, filename);

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ 
      error: 'Image file not found',
      filename: filename 
    });
  }

  // Set appropriate headers for image files
  const ext = path.extname(filename).toLowerCase();
  const contentType = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  }[ext] || 'image/jpeg';

  res.setHeader('Content-Type', contentType);
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
  try {
    const files = fs.readdirSync(imagesDir).filter(file => 
      /\.(jpg|jpeg|png|gif|svg)$/i.test(file)
    );
    const availableFiles = files.map(filename => ({
      filename,
      available: fs.existsSync(path.join(imagesDir, filename)),
      size: fs.statSync(path.join(imagesDir, filename)).size
    }));

    res.json({
      success: true,
      data: availableFiles
    });
  } catch (error) {
    console.error('Error listing image files:', error);
    res.status(500).json({
      error: 'Failed to list image files'
    });
  }
});

// POST /api/images/generate - Generate images using AI
router.post('/generate', async (req, res) => {
  try {
    const {
      prompt,
      style = 'storybook',
      size = '1024x1024',
      provider = 'openai',
      storyId,
      userId
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for image generation' });
    }

    console.log(`Generating image with prompt: "${prompt.substring(0, 50)}..."`);

    // Multi-provider image generation with failover
    let imageBuffer = null;
    let usedProvider = null;
    let error = null;

    // Try OpenAI DALL-E first
    if (openai && (provider === 'openai' || provider === 'auto')) {
      try {
        console.log('🔄 Attempting DALL-E image generation...');
        imageBuffer = await generateWithDALLE(prompt, style, size);
        usedProvider = 'dalle';
      } catch (err) {
        console.error('❌ DALL-E generation failed:', err.message);
        error = err;
      }
    }

    // Try Stability AI if OpenAI failed
    const stabilityStatus = isServiceConfigured('stability');
    if (!imageBuffer && stabilityStatus.configured) {
      try {
        console.log('🔄 Attempting Stability AI image generation...');
        imageBuffer = await generateWithStability(prompt, style);
        usedProvider = 'stability';
      } catch (err) {
        console.error('❌ Stability AI generation failed:', err.message);
        error = err;
      }
    } else if (!stabilityStatus.configured) {
      console.log('⏭️  Skipping Stability AI -', stabilityStatus.reason);
    }

    // Try Hugging Face if others failed
    const huggingfaceStatus = isServiceConfigured('huggingface');
    if (!imageBuffer && huggingfaceStatus.configured) {
      try {
        console.log('🔄 Attempting HuggingFace image generation...');
        imageBuffer = await generateWithHuggingFace(prompt, style);
        usedProvider = 'huggingface';
      } catch (err) {
        console.error('❌ Hugging Face generation failed:', err.message);
        error = err;
      }
    } else if (!huggingfaceStatus.configured) {
      console.log('⏭️  Skipping HuggingFace -', huggingfaceStatus.reason);
    }

    if (!imageBuffer) {
      throw new Error(`All image generation providers failed. Last error: ${error?.message}`);
    }

    // Save the image
    const imageFilename = `${usedProvider}-${Date.now()}.png`;
    const imagePath = path.join(imagesDir, imageFilename);
    fs.writeFileSync(imagePath, imageBuffer);

    res.json({
      success: true,
      message: `Image generated successfully using ${usedProvider}`,
      data: {
        imageUrl: `/api/images/${imageFilename}`,
        filename: imageFilename,
        prompt: prompt,
        style: style,
        size: size,
        provider: usedProvider,
        storyId: storyId,
        fileSize: imageBuffer.length,
        dimensions: size
      }
    });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message || 'Image generation service unavailable'
    });
  }
});

// DALL-E 3 integration
async function generateWithDALLE(prompt, style, size) {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  // Enhance prompt for better storybook-style images
  const enhancedPrompt = enhancePromptForStyle(prompt, style);
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: enhancedPrompt,
    n: 1,
    size: mapSizeToDALLE(size),
    quality: "standard",
    style: style === 'watercolor' ? 'natural' : 'vivid'
  });

  const imageUrl = response.data[0].url;
  
  // Download the image
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer'
  });

  return Buffer.from(imageResponse.data);
}

// Stability AI integration
async function generateWithStability(prompt, style) {
  const stylePrompts = {
    storybook: "illustrated children's book style, colorful, whimsical",
    watercolor: "watercolor painting style, soft, artistic",
    cartoon: "cartoon style, bright colors, animated",
    realistic: "photorealistic, detailed, professional photography"
  };

  const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.storybook}`;
  
  const response = await axios.post(
    "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
    {
      text_prompts: [
        {
          text: enhancedPrompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      width: 1024,
      height: 1024,
      samples: 1,
      steps: 30
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
      }
    }
  );

  const imageBase64 = response.data.artifacts[0].base64;
  return Buffer.from(imageBase64, 'base64');
}

// Hugging Face integration
async function generateWithHuggingFace(prompt, style) {
  if (!validateHuggingFaceKey(process.env.HUGGINGFACE_API_KEY)) {
    throw new Error('Invalid HuggingFace API key format');
  }

  const stylePrompts = {
    storybook: "children's book illustration, colorful, whimsical",
    watercolor: "watercolor painting, artistic, soft",
    cartoon: "cartoon style, bright, animated",
    realistic: "photorealistic, detailed"
  };

  const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.storybook}`;
  
  try {
    console.log('🔄 Using HuggingFace with model: runwayml/stable-diffusion-v1-5');
    const response = await axios.post(
      "https://router.huggingface.co/runwayml/stable-diffusion-v1-5",
      {
        inputs: enhancedPrompt,
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.5
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );

    console.log('✅ HuggingFace image generation successful');
    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ HuggingFace image generation error:', error.response?.data || error.message);
    throw new Error(`HuggingFace image generation failed: ${error.response?.status || 'Unknown error'}`);
  }
}

// POST /api/images/generate-storybook - Generate multiple images for a storybook
router.post('/generate-storybook', async (req, res) => {
  try {
    const {
      storyId,
      scenes = [],
      style = 'children-book',
      characterDescriptions = {},
      userId
    } = req.body;

    if (!scenes || scenes.length === 0) {
      return res.status(400).json({ error: 'Scenes are required for storybook generation' });
    }

    if (scenes.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 scenes allowed per storybook' });
    }

    console.log(`Generating ${scenes.length} images for storybook: ${storyId}`);

    const generatedImages = [];
    const errors = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      try {
        // Enhance scene description for storybook
        const enhancedPrompt = enhanceScenePrompt(scene, characterDescriptions, style);
        
        // Try to generate image
        let imageBuffer = null;
        let usedProvider = null;

        // Try DALL-E first
        if (openai) {
          try {
            imageBuffer = await generateWithDALLE(enhancedPrompt, style, '1024x1024');
            usedProvider = 'dalle';
          } catch (err) {
            console.error(`DALL-E failed for scene ${i + 1}:`, err);
          }
        }

        // Try Stability AI if DALL-E failed
        if (!imageBuffer && process.env.STABILITY_API_KEY) {
          try {
            imageBuffer = await generateWithStability(enhancedPrompt, style);
            usedProvider = 'stability';
          } catch (err) {
            console.error(`Stability AI failed for scene ${i + 1}:`, err);
          }
        }

        // Try Hugging Face if others failed
        if (!imageBuffer && process.env.HUGGINGFACE_API_KEY) {
          try {
            imageBuffer = await generateWithHuggingFace(enhancedPrompt, style);
            usedProvider = 'huggingface';
          } catch (err) {
            console.error(`Hugging Face failed for scene ${i + 1}:`, err);
          }
        }

        if (imageBuffer) {
          const imageFilename = `storybook-${storyId}-scene-${i + 1}-${usedProvider}.png`;
          const imagePath = path.join(imagesDir, imageFilename);
          fs.writeFileSync(imagePath, imageBuffer);

          generatedImages.push({
            sceneIndex: i,
            sceneDescription: scene,
            imageUrl: `/api/images/${imageFilename}`,
            filename: imageFilename,
            provider: usedProvider,
            fileSize: imageBuffer.length
          });
        } else {
          errors.push(`Scene ${i + 1}: All providers failed`);
          // Add placeholder for failed scenes
          generatedImages.push({
            sceneIndex: i,
            sceneDescription: scene,
            imageUrl: generatePlaceholderImage(scene, i, style),
            filename: `placeholder-scene-${i + 1}.svg`,
            provider: 'placeholder',
            error: 'Generation failed'
          });
        }

      } catch (sceneError) {
        console.error(`Error generating image for scene ${i + 1}:`, sceneError);
        errors.push(`Scene ${i + 1}: ${sceneError.message}`);
      }
    }

    res.json({
      success: true,
      message: `Generated ${generatedImages.length} storybook images (${errors.length} errors)`,
      data: {
        storyId: storyId,
        style: style,
        totalScenes: scenes.length,
        generatedImages: generatedImages.length,
        errors: errors,
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

// Enhance prompt for better storybook style
function enhancePromptForStyle(prompt, style) {
  const enhancements = {
    storybook: `Children's book illustration: ${prompt}, colorful, whimsical, friendly characters, bright colors, detailed background`,
    watercolor: `Watercolor painting: ${prompt}, soft brushstrokes, artistic, gentle colors, dreamy atmosphere`,
    cartoon: `Cartoon style: ${prompt}, bright colors, animated, fun, expressive characters`,
    realistic: `Photorealistic: ${prompt}, detailed, professional quality, cinematic lighting`
  };

  return enhancements[style] || enhancements.storybook;
}

// Enhance scene prompt for storybook generation
function enhanceScenePrompt(scene, characterDescriptions, style) {
  let enhancedPrompt = scene;

  // Add character descriptions if provided
  if (Object.keys(characterDescriptions).length > 0) {
    enhancedPrompt += ', ' + Object.values(characterDescriptions).join(', ');
  }

  // Add style-specific enhancements
  const styleEnhancements = {
    'children-book': 'children\'s book illustration, colorful, whimsical, friendly',
    'storybook': 'storybook illustration, detailed, magical, enchanting',
    'watercolor': 'watercolor painting, soft, artistic, gentle',
    'cartoon': 'cartoon style, bright, fun, animated'
  };

  const styleEnhancement = styleEnhancements[style] || styleEnhancements['children-book'];
  enhancedPrompt += `, ${styleEnhancement}`;

  return enhancedPrompt;
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
      <rect width="800" height="600" fill="${color}"/>
      <text x="400" y="280" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">
        Scene ${index + 1}
      </text>
      <text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="16" fill="white">
        ${sceneText}
      </text>
      <text x="400" y="350" text-anchor="middle" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)">
        Style: ${style}
      </text>
    </svg>
  `).toString('base64')}`;
}

// Map size to DALL-E format
function mapSizeToDALLE(size) {
  const sizeMap = {
    '256x256': '256x256',
    '512x512': '512x512',
    '1024x1024': '1024x1024',
    '1024x1792': '1024x1792',
    '1792x1024': '1792x1024'
  };

  return sizeMap[size] || '1024x1024';
}

// POST /api/images/enhance - Enhance or upscale an existing image
router.post('/enhance', async (req, res) => {
  try {
    const { imageUrl, enhancement = 'upscale', factor = 2, userId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log(`Enhancing image: ${imageUrl} with ${enhancement}`);

    // For now, return a placeholder response
    // In a full implementation, this would use image upscaling APIs
    const enhancedFilename = `enhanced-${enhancement}-${Date.now()}.jpg`;

    res.json({
      success: true,
      message: 'Image enhancement completed (demo mode)',
      data: {
        originalUrl: imageUrl,
        enhancedUrl: `/api/images/${enhancedFilename}`,
        filename: enhancedFilename,
        enhancement: enhancement,
        factor: factor,
        note: 'This is a demo response. Real enhancement requires additional APIs.'
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
    const { imageUrl, targetStyle = 'watercolor', userId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log(`Applying ${targetStyle} style to image: ${imageUrl}`);

    // For now, return a placeholder response
    // In a full implementation, this would use style transfer APIs
    const styledFilename = `styled-${targetStyle}-${Date.now()}.jpg`;

    res.json({
      success: true,
      message: 'Style transfer completed (demo mode)',
      data: {
        originalUrl: imageUrl,
        styledUrl: `/api/images/${styledFilename}`,
        filename: styledFilename,
        style: targetStyle,
        note: 'This is a demo response. Real style transfer requires additional APIs.'
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

// POST /api/images/cleanup - Clean up old image files
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge = 24 * 60 * 60 * 1000 } = req.body; // Default 24 hours
    
    const now = Date.now();
    const deletedFiles = [];
    
    const files = fs.readdirSync(imagesDir);
    
    for (const file of files) {
      if (/\.(jpg|jpeg|png|gif|svg)$/i.test(file)) {
        const filePath = path.join(imagesDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedFiles.length} old image files`,
      data: {
        deletedFiles,
        totalDeleted: deletedFiles.length
      }
    });

  } catch (error) {
    console.error('Error during image cleanup:', error);
    res.status(500).json({
      error: 'Failed to clean up image files',
      details: error.message
    });
  }
});

module.exports = router;