const express = require('express');
const router = express.Router();
const {
  generateBlogPost,
  generateProductDescription,
  generateAdCopy,
  generateSocialMedia,
  getHistory,
  getGeneration,
  deleteGeneration,
  getStats
} = require('../controllers/generationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Generation endpoints
router.post('/blog-post', generateBlogPost);
router.post('/product-description', generateProductDescription);
router.post('/ad-copy', generateAdCopy);
router.post('/social-media', generateSocialMedia);

// History and stats
router.get('/history', getHistory);
router.get('/stats', getStats);

// Single generation operations
router.get('/:id', getGeneration);
router.delete('/:id', deleteGeneration);

module.exports = router;