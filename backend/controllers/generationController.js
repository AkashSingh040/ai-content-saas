const Generation = require('../models/Generation');
const User = require('../models/User');
const { generateContent } = require('../services/openaiService');

/**
 * Generic generation handler
 * Used by all content type endpoints
 */
const handleGeneration = async (req, res, contentType) => {
  try {
    const { prompt, model = 'gemini-2.5-flash' } = req.body;

    // Validation
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a prompt'
      });
    }

    // Generate content using OpenAI
    const { content, tokensUsed } = await generateContent(contentType, prompt, model);

    // Check if user has enough tokens
    if (req.user.tokensRemaining < tokensUsed) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient tokens. Please upgrade your plan.',
        tokensRemaining: req.user.tokensRemaining,
        tokensRequired: tokensUsed
      });
    }

    // Deduct tokens from user
    req.user.tokensRemaining -= tokensUsed;
    await req.user.save();

    // Save generation to database
    const generation = await Generation.create({
      user: req.user._id,
      contentType,
      prompt,
      output: content,
      tokensUsed,
      model
    });

    res.status(201).json({
      success: true,
      data: {
        generation,
        tokensRemaining: req.user.tokensRemaining
      }
    });
  } catch (error) {
    console.error(`${contentType} generation error:`, error);
    res.status(500).json({
      success: false,
      message: 'Content generation failed',
      error: error.message
    });
  }
};

// @desc    Generate blog post
// @route   POST /api/generate/blog-post
// @access  Private
exports.generateBlogPost = async (req, res) => {
  await handleGeneration(req, res, 'blog-post');
};

// @desc    Generate product description
// @route   POST /api/generate/product-description
// @access  Private
exports.generateProductDescription = async (req, res) => {
  await handleGeneration(req, res, 'product-description');
};

// @desc    Generate ad copy
// @route   POST /api/generate/ad-copy
// @access  Private
exports.generateAdCopy = async (req, res) => {
  await handleGeneration(req, res, 'ad-copy');
};

// @desc    Generate social media post
// @route   POST /api/generate/social-media
// @access  Private
exports.generateSocialMedia = async (req, res) => {
  await handleGeneration(req, res, 'social-media');
};

// @desc    Get user's generation history
// @route   GET /api/generate/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const generations = await Generation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Generation.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        generations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch generation history',
      error: error.message
    });
  }
};

// @desc    Get single generation by ID
// @route   GET /api/generate/:id
// @access  Private
exports.getGeneration = async (req, res) => {
  try {
    const generation = await Generation.findById(req.params.id);

    if (!generation) {
      return res.status(404).json({
        success: false,
        message: 'Generation not found'
      });
    }

    // Check if generation belongs to user
    if (generation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this generation'
      });
    }

    res.status(200).json({
      success: true,
      data: generation
    });
  } catch (error) {
    console.error('Get generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch generation',
      error: error.message
    });
  }
};

// @desc    Delete generation
// @route   DELETE /api/generate/:id
// @access  Private
exports.deleteGeneration = async (req, res) => {
  try {
    const generation = await Generation.findById(req.params.id);

    if (!generation) {
      return res.status(404).json({
        success: false,
        message: 'Generation not found'
      });
    }

    // Check if generation belongs to user
    if (generation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this generation'
      });
    }

    await generation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Generation deleted successfully'
    });
  } catch (error) {
    console.error('Delete generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete generation',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/generate/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const totalGenerations = await Generation.countDocuments({ user: req.user._id });
    
    const totalTokensUsed = await Generation.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$tokensUsed' } } }
    ]);

    const generationsByType = await Generation.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$contentType', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalGenerations,
        totalTokensUsed: totalTokensUsed[0]?.total || 0,
        tokensRemaining: req.user.tokensRemaining,
        subscriptionTier: req.user.subscriptionTier,
        generationsByType
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};