/**
 * Improved error handling middleware
 * Provides standardized error handling for the API
 */
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create error log file
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

/**
 * Custom application error class
 * Extends the built-in Error class with additional properties
 */
class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether the error is operational or programming
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error logging middleware
 * Logs errors to a file and console
 * @param {Object} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorLogger = (err, req, res, next) => {
  // Format error for logging
  const errorInfo = {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : 'anonymous',
    statusCode: err.statusCode || 500,
    isOperational: err.isOperational !== undefined ? err.isOperational : true
  };
  
  // Log to file
  errorLogStream.write(JSON.stringify(errorInfo) + '\n');
  
  // Log to console with different formatting based on environment
  if (process.env.NODE_ENV === 'development') {
    console.error('========== ERROR ==========');
    console.error(`${errorInfo.timestamp} - ${errorInfo.method} ${errorInfo.url}`);
    console.error(`User: ${errorInfo.userId}, IP: ${errorInfo.ip}`);
    console.error(`Status: ${errorInfo.statusCode}, Operational: ${errorInfo.isOperational}`);
    console.error(`Message: ${errorInfo.message}`);
    console.error(`Stack: ${errorInfo.stack}`);
    console.error('===========================');
  } else {
    // Simpler logging for production
    console.error(`ERROR [${errorInfo.statusCode}]: ${errorInfo.message}`);
  }
  
  // Pass error to next middleware
  next(err);
};

/**
 * Error response middleware
 * Sends appropriate error response to client
 * @param {Object} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Set default status code and operational status
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational !== undefined ? err.isOperational : true;
  
  // Different response format based on environment
  if (process.env.NODE_ENV === 'development') {
    // Detailed error response for development
    res.status(statusCode).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
      isOperational: isOperational,
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  } else {
    // More concise response for production
    // Don't expose error details for non-operational errors
    res.status(statusCode).json({
      status: 'error',
      message: isOperational ? err.message : 'Something went wrong. Please try again.'
    });
  }
};

/**
 * Route not found middleware
 * Handles 404 errors for routes that don't exist
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const notFoundHandler = (req, res, next) => {
  // Create a 404 error
  const err = new AppError(`Not found: ${req.originalUrl}`, 404);
  next(err);
};

/**
 * Unhandled error handler
 * Sets up global handlers for unhandled errors
 */
const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
    // Log the error but don't crash the app
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    // For uncaught exceptions, it's often better to exit the process
    // since the app may be in an unstable state
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
};

// Setup global error handlers
setupGlobalErrorHandlers();

module.exports = {
  AppError,
  errorLogger,
  errorHandler,
  notFoundHandler
};
