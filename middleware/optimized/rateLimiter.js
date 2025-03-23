/**
 * Advanced rate limiting middleware
 * Provides more flexible and robust rate limiting
 */
const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');
require('dotenv').config({ path: './config.env' });

// Get rate limit settings from environment variables
const defaultWindow = parseInt(process.env.RATE_LIMIT_WINDOW) || 15; // minutes
const defaultMax = parseInt(process.env.RATE_LIMIT_MAX) || 100; // requests per window

/**
 * Create a rate limiter with the specified options
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = defaultWindow * 60 * 1000, // Convert minutes to milliseconds
    max = defaultMax,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    skip = () => false,
    keyGenerator = (req) => req.ip,
    handler = null
  } = options;
  
  // Default handler that uses our AppError class
  const defaultHandler = (req, res, next) => {
    next(new AppError(message, statusCode));
  };
  
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip,
    keyGenerator,
    handler: handler || defaultHandler
  });
}

// Create standard rate limiters for different endpoints
const standardApiLimiter = createRateLimiter();

// More restrictive limiter for authentication endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.'
});

// Less restrictive limiter for public endpoints
const publicLimiter = createRateLimiter({
  max: 200 // 200 requests per default window
});

// More restrictive limiter for sensitive operations
const sensitiveOpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many sensitive operations, please try again later.'
});

// Skip rate limiting for certain users (e.g., admins)
const adminSkipFn = (req) => {
  // Skip if user is an admin
  return req.user && req.user.role === 'admin';
};

// Admin rate limiter with higher limits and skip function
const adminLimiter = createRateLimiter({
  max: 1000, // 1000 requests per default window
  skip: adminSkipFn
});

module.exports = {
  standardApiLimiter,
  authLimiter,
  publicLimiter,
  sensitiveOpLimiter,
  adminLimiter,
  createRateLimiter // Export for custom limiters
};
