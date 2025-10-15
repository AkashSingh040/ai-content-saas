
// Middleware to check if user has enough tokens
exports.checkTokenBalance = (requiredTokens = 100) => {
  return (req, res, next) => {
    if (req.user.tokensRemaining < requiredTokens) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient tokens. Please upgrade your plan.',
        tokensRemaining: req.user.tokensRemaining,
        tokensRequired: requiredTokens
      });
    }
    next();
  };
};