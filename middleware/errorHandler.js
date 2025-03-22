const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create error log file
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

/**
 * Error logging middleware
 * Logs errors to a file and console
 * @param {Object} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorMessage = `${timestamp} - ${err.stack || err}\n`;
  
  // Log to file
  errorLogStream.write(errorMessage);
  
  // Log to console
  console.error(`Error: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  
  // Pass error to next middleware
  next(err);
};

/**
 * Error handler middleware
 * Sends appropriate error response to client
 * @param {Object} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  errorLogger,
  errorHandler
};
