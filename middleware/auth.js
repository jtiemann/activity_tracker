const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config.env' });

/**
 * Authentication middleware using JWT
 * Verifies the JWT token in the request header
 */
exports.authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication failed. No token provided or invalid format.' 
      });
    }
    
    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key');
    
    // Add user info to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Authentication failed. Invalid token.' });
  }
};

/**
 * Route protection middleware
 * Ensures that a user can only access their own data
 */
exports.authorize = (req, res, next) => {
  try {
    const requestedUserId = parseInt(req.params.userId);
    const authenticatedUserId = req.user.id;

    // Check if requested user ID matches authenticated user ID
    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own data.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Authorization error:', error.message);
    res.status(403).json({ error: 'Authorization failed.' });
  }
};