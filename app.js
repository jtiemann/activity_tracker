const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const routes = require('./routes');
const { errorLogger, errorHandler } = require('./middleware/errorHandler');
const apiRateLimiter = require('./middleware/rateLimiter');
require('dotenv').config({ path: './config.env' });

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create access log stream
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// CORS middleware
app.use(cors());

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Apply rate limiting to all API routes except auth
app.use('/api', (req, res, next) => {
  if (!req.path.startsWith('/auth')) {
    apiRateLimiter(req, res, next);
  } else {
    next();
  }
});

// Use all routes
app.use(routes);

// Debug endpoint to verify routes
app.get('/debug/routes', (req, res) => {
  const routePaths = [];
  
  // Helper function to print routes
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path + layer.route.path));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + (layer.regexp ? layer.regexp.source.replace('\\/?(?=\\/|$)', '') : '')));
    } else if (layer.method) {
      routePaths.push(`${layer.method.toUpperCase()} ${path}`);
    }
  }
  
  app._router.stack.forEach(print.bind(null, ''));
  
  res.json(routePaths);
});

// Error handling middleware
app.use(errorLogger);
app.use(errorHandler);

// Serve the main page for any other routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server, but log the error
});

module.exports = app; // Export for testing
