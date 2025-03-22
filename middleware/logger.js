const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create api log file
const apiLogStream = fs.createWriteStream(
  path.join(logsDir, 'api.log'),
  { flags: 'a' }
);

/**
 * API request logging middleware
 * Logs API requests to a file and console
 */
const apiLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const contentType = req.get('Content-Type') || '';
  
  // Log basic request info
  const logMessage = `${timestamp} - ${method} ${url} - Content-Type: ${contentType}\n`;
  apiLogStream.write(logMessage);
  
  // For debugging, log body of POST/PUT requests
  if ((method === 'POST' || method === 'PUT') && contentType.includes('application/json')) {
    const bodyLog = `${timestamp} - Request Body: ${JSON.stringify(req.body)}\n`;
    apiLogStream.write(bodyLog);
  }
  
  // Capture and log the response
  const originalSend = res.send;
  res.send = function(body) {
    const responseLog = `${timestamp} - Response ${res.statusCode} to ${method} ${url}\n`;
    apiLogStream.write(responseLog);
    
    // Call original send
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = apiLogger;