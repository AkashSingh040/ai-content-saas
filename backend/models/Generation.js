const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentType: {
    type: String,
    enum: ['blog-post', 'product-description', 'ad-copy', 'social-media'],
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  tokensUsed: {
    type: Number,
    required: true
  },
  model: {
    type: String,
    default: 'gpt-3.5-turbo'
  }
}, {
  timestamps: true
});

// Index for faster queries
generationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Generation', generationSchema);