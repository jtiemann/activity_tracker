const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

/**
 * Rate limiting middleware
 * Limits the number of requests a user can make in a specified time window
 */
const apiRateLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000, // Convert minutes to milliseconds
  max: process.env.RATE_LIMIT_MAX, // Maximum number of requests per window
  message: {
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Store for keeping track of requests (defaults to memory)
  // For production, consider using a more robust store like redis
});

module.exports = apiRateLimiter;
