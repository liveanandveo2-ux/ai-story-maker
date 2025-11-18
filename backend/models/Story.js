const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  content: {
    type: String,
    required: true,
    minLength: 100
  },
  genre: {
    type: String,
    required: true,
    enum: ['fantasy', 'adventure', 'mystery', 'romance', 'sci-fi', 'horror', 'comedy', 'drama', 'thriller']
  },
  length: {
    type: String,
    required: true,
    enum: ['short', 'medium', 'long', 'very long']
  },
  prompt: {
    type: String,
    required: true,
    maxLength: 1000
  },
  creatorId: {
    type: String,
    required: true,
    index: true
  },
  creatorName: {
    type: String,
    required: true
  },
  creatorEmail: {
    type: String,
    sparse: true
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  wordCount: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedReadingTime: {
    type: Number,
    required: true,
    min: 1
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  hasAudio: {
    type: Boolean,
    default: false
  },
  audioUrl: {
    type: String,
    sparse: true
  },
  hasStorybook: {
    type: Boolean,
    default: false
  },
  storybookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Storybook',
    sparse: true
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 50
  }],
  metadata: {
    aiProvider: {
      type: String,
      enum: ['huggingface', 'openai', 'google', 'template'],
      default: 'template'
    },
    generationTime: {
      type: Number, // milliseconds
      min: 0
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
storySchema.index({ creatorId: 1, createdAt: -1 });
storySchema.index({ genre: 1, isPublic: 1 });
storySchema.index({ views: -1 });
storySchema.index({ likes: -1 });
storySchema.index({ createdAt: -1 });
storySchema.index({ title: 'text', content: 'text', prompt: 'text' });

// Virtual for like-to-view ratio
storySchema.virtual('engagementRate').get(function() {
  return this.views > 0 ? (this.likes / this.views) : 0;
});

// Virtual for estimated reading time in minutes
storySchema.virtual('readingTimeMinutes').get(function() {
  return Math.ceil(this.estimatedReadingTime);
});

// Methods
storySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

storySchema.methods.toggleLike = function() {
  this.likes = this.likes > 0 ? this.likes - 1 : this.likes + 1;
  return this.save();
};

storySchema.methods.canEdit = function(userId) {
  return this.creatorId === userId;
};

// Static methods
storySchema.statics.findByGenre = function(genre, options = {}) {
  const query = { genre, isPublic: true };
  return this.find(query, null, options);
};

storySchema.statics.searchStories = function(searchTerm, options = {}) {
  return this.find(
    { $text: { $search: searchTerm }, isPublic: true },
    { score: { $meta: 'textScore' } },
    options
  ).sort({ score: { $meta: 'textScore' } });
};

storySchema.statics.getPopularStories = function(limit = 10) {
  return this.find({ isPublic: true })
    .sort({ views: -1, likes: -1 })
    .limit(limit);
};

storySchema.statics.getRecentStories = function(limit = 10) {
  return this.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Story', storySchema);