const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true,
    min: 1
  },
  content: {
    type: String,
    required: true,
    maxLength: 2000
  },
  imageUrl: {
    type: String,
    required: true,
    maxLength: 500
  },
  animationElements: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['magical-element', 'sparkle', 'fade', 'slide', 'text-reveal']
    },
    x: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    y: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    width: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    height: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    animation: {
      element: String,
      type: {
        type: String,
        enum: ['fadeIn', 'fadeOut', 'slideIn', 'slideOut', 'scale', 'bounce', 'pulse', 'rotate']
      },
      duration: {
        type: Number,
        min: 100,
        max: 10000
      },
      delay: {
        type: Number,
        min: 0,
        max: 5000
      },
      properties: {
        from: {
          opacity: Number,
          scale: Number,
          x: Number,
          y: Number,
          rotation: Number
        },
        to: {
          opacity: Number,
          scale: Number,
          x: Number,
          y: Number,
          rotation: Number
        }
      }
    },
    audioCue: {
      type: String,
      maxLength: 200
    }
  }],
  audioUrl: {
    type: String,
    maxLength: 500
  },
  duration: {
    type: Number, // seconds
    min: 1,
    max: 300
  }
});

const storybookSchema = new mongoose.Schema({
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
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
  description: {
    type: String,
    maxLength: 500,
    default: ''
  },
  totalDuration: {
    type: Number, // seconds
    required: true,
    min: 1
  },
  pages: [pageSchema],
  isPublic: {
    type: Boolean,
    default: true,
    index: true
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
  settings: {
    autoPlay: {
      type: Boolean,
      default: false
    },
    autoPlayDelay: {
      type: Number,
      default: 3, // seconds
      min: 1,
      max: 30
    },
    backgroundMusic: {
      type: String,
      maxLength: 500
    },
    theme: {
      type: String,
      enum: ['default', 'magical', 'nature', 'space', 'ocean', 'forest'],
      default: 'default'
    }
  },
  thumbnail: {
    type: String,
    maxLength: 500
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 50
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
storybookSchema.index({ creatorId: 1, createdAt: -1 });
storybookSchema.index({ storyId: 1 });
storybookSchema.index({ isPublic: 1, createdAt: -1 });
storybookSchema.index({ views: -1 });
storybookSchema.index({ likes: -1 });
storybookSchema.index({ title: 'text', description: 'text' });

// Virtuals
storybookSchema.virtual('pageCount').get(function() {
  return this.pages ? this.pages.length : 0;
});

storybookSchema.virtual('avgPageDuration').get(function() {
  return this.pages && this.pages.length > 0 
    ? Math.round(this.totalDuration / this.pages.length) 
    : 0;
});

storybookSchema.virtual('engagementRate').get(function() {
  return this.views > 0 ? (this.likes / this.views) : 0;
});

// Methods
storybookSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

storybookSchema.methods.toggleLike = function() {
  this.likes = this.likes > 0 ? this.likes - 1 : this.likes + 1;
  return this.save();
};

storybookSchema.methods.canEdit = function(userId) {
  return this.creatorId === userId;
};

storybookSchema.methods.addPage = function(pageData) {
  pageData.pageNumber = this.pages.length + 1;
  this.pages.push(pageData);
  return this.save();
};

storybookSchema.methods.removePage = function(pageNumber) {
  this.pages = this.pages.filter(page => page.pageNumber !== pageNumber);
  // Re-number pages
  this.pages.forEach((page, index) => {
    page.pageNumber = index + 1;
  });
  return this.save();
};

// Static methods
storybookSchema.statics.findByStory = function(storyId) {
  return this.findOne({ storyId });
};

storybookSchema.statics.findByCreator = function(creatorId, options = {}) {
  return this.find({ creatorId }, null, options);
};

storybookSchema.statics.searchStorybooks = function(searchTerm, options = {}) {
  return this.find(
    { $text: { $search: searchTerm }, isPublic: true },
    { score: { $meta: 'textScore' } },
    options
  ).sort({ score: { $meta: 'textScore' } });
};

storybookSchema.statics.getPopularStorybooks = function(limit = 10) {
  return this.find({ isPublic: true })
    .sort({ views: -1, likes: -1 })
    .limit(limit);
};

storybookSchema.statics.getRecentStorybooks = function(limit = 10) {
  return this.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Middleware to update total duration when pages change
storybookSchema.pre('save', function(next) {
  if (this.pages && this.pages.length > 0) {
    this.totalDuration = this.pages.reduce((total, page) => {
      return total + (page.duration || 5); // Default 5 seconds per page
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Storybook', storybookSchema);