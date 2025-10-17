const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompts for different content types
const SYSTEM_PROMPTS = {
  'blog-post': 'You are an expert blog writer. Create engaging, SEO-optimized blog content that is informative and well-structured.',
  'product-description': 'You are an expert e-commerce copywriter. Create compelling product descriptions that highlight benefits and drive conversions.',
  'ad-copy': 'You are an expert advertising copywriter. Create persuasive, attention-grabbing ad copy that drives action.',
  'social-media': 'You are a social media expert. Create engaging, viral-worthy social media posts that encourage interaction.'
};

/**
 * Generate content using Gemini AI
 * @param {string} contentType - Type of content to generate
 * @param {string} prompt - User's prompt/input
 * @param {string} model - Gemini model to use (default: gemini-pro)
 * @returns {Promise<{content: string, tokensUsed: number}>}
 */
exports.generateContent = async (contentType, prompt, model = 'gemini-2.5-flash') => {
  try {
    const systemPrompt = SYSTEM_PROMPTS[contentType] || 'You are a helpful AI assistant.';
    
    // Get the generative model
    const genModel = genAI.getGenerativeModel({ model: model });

    // Combine system prompt with user prompt
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

    // Generate content
    const result = await genModel.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    // Estimate tokens used (Gemini doesn't provide exact count in free tier)
    // Rough estimate: 1 token ≈ 4 characters
    const tokensUsed = Math.ceil((fullPrompt.length + content.length) / 4);

    return {
      content,
      tokensUsed
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Handle rate limiting
    if (error.message && error.message.includes('RATE_LIMIT')) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

/**
 * Estimate tokens for a given text (rough estimation)
 * Rule of thumb: 1 token ≈ 4 characters or 0.75 words
 */
exports.estimateTokens = (text) => {
  return Math.ceil(text.length / 4);
};