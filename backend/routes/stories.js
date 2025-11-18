const express = require('express');
const { authenticate } = require('../middleware/auth');
const Story = require('../models/Story');
const User = require('../models/User');
const router = express.Router();

// Get all stories with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      genre, 
      sort = 'newest', 
      page = 1, 
      limit = 20,
      creator 
    } = req.query;

    let query = { isPublic: true };

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Genre filter
    if (genre && genre !== 'all') {
      query.genre = genre;
    }

    // Creator filter
    if (creator) {
      query.creatorId = creator;
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1, likes: -1 };
        break;
      case 'liked':
        sortOption = { likes: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      Story.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v')
        .lean(),
      Story.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Failed to fetch stories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stories'
    });
  }
});

// Get single story
router.get('/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('storybookId', 'title pages')
      .lean();

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Increment view count
    await Story.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: story
    });

  } catch (error) {
    console.error('Failed to fetch story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch story'
    });
  }
});

// Create new story
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, genre, length, prompt, hasAudio, audioUrl } = req.body;

    // Validate required fields
    if (!title || !content || !genre || !length || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const wordCount = content.split(' ').length;
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    const story = new Story({
      title,
      content,
      genre,
      length,
      prompt,
      creatorId: req.user.uid,
      creatorName: req.user.displayName,
      creatorEmail: req.user.email,
      wordCount,
      estimatedReadingTime,
      hasAudio: !!hasAudio,
      audioUrl: audioUrl || null
    });

    await story.save();

    // Update user stats
    await req.user.incrementStoryCount();

    res.status(201).json({
      success: true,
      data: story,
      message: 'Story created successfully'
    });

  } catch (error) {
    console.error('Failed to create story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create story'
    });
  }
});

// Update story
router.put('/:id', authenticate, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Check if user owns the story
    if (story.creatorId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own stories'
      });
    }

    const updates = req.body;
    
    // Recalculate word count if content changed
    if (updates.content) {
      updates.wordCount = updates.content.split(' ').length;
      updates.estimatedReadingTime = Math.ceil(updates.wordCount / 200);
    }

    const updatedStory = await Story.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedStory,
      message: 'Story updated successfully'
    });

  } catch (error) {
    console.error('Failed to update story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update story'
    });
  }
});

// Delete story
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Check if user owns the story
    if (story.creatorId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own stories'
      });
    }

    // Delete associated storybook first
    if (story.storybookId) {
      await require('../models/Storybook').findByIdAndDelete(story.storybookId);
    }

    await Story.findByIdAndDelete(req.params.id);

    // Update user stats
    await req.user.updateStats({ storiesCreated: req.user.stats.storiesCreated - 1 });

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete story'
    });
  }
});

// Like/Unlike story
router.post('/:id/like', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Toggle like
    story.likes = story.likes > 0 ? story.likes - 1 : story.likes + 1;
    await story.save();

    res.json({
      success: true,
      data: { likes: story.likes },
      message: story.likes > 0 ? 'Story liked' : 'Story unliked'
    });

  } catch (error) {
    console.error('Failed to toggle like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
});

// Get user's stories
router.get('/user/:creatorId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      Story.find({ creatorId: req.params.creatorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Story.countDocuments({ creatorId: req.params.creatorId })
    ]);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Failed to fetch user stories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stories'
    });
  }
});

// Get current user's stories (authenticated)
router.get('/my/stories', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      Story.find({ creatorId: req.user.uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Story.countDocuments({ creatorId: req.user.uid })
    ]);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Failed to fetch user stories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your stories'
    });
  }
});

// Get story statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .select('views likes wordCount estimatedReadingTime createdAt')
      .lean();

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    res.json({
      success: true,
      data: story
    });

  } catch (error) {
    console.error('Failed to fetch story stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch story statistics'
    });
  }
});

module.exports = router;