/**
 * Middleware Optimization Integration
 * This file provides integration between old middleware and optimized versions
 */

// Import optimized middleware
const { cacheMiddleware, clearUserCache, clearEndpointCache } = require('./optimized/advancedCache');
const { authenticate, authorize, hasRole } = require('./optimized/auth');
const { AppError, errorLogger, errorHandler, notFoundHandler } = require('./optimized/errorHandler');
const { standardApiLimiter, authLimiter, publicLimiter } = require('./optimized/rateLimiter');

// Export for backwards compatibility
module.exports = {
  // Cache middleware
  cacheMiddleware,
  clearUserCache,
  clearEndpointCache,
  
  // Auth middleware
  authenticate,
  authorize,
  hasRole,
  
  // Error middleware
  AppError,
  errorLogger,
  errorHandler,
  notFoundHandler,
  
  // Rate limiting
  apiRateLimiter: standardApiLimiter,
  authLimiter,
  publicLimiter
};
