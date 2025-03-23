/**
 * Optimized authentication middleware
 * Provides more robust authentication and authorization
 */
const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
require('dotenv').config({ path: './config.env' });

// JWT Secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Generate a JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiry time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = JWT_EXPIRY) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Authentication middleware
 * Verifies the JWT token in the request header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. No token provided or invalid format.', 401);
    }
    
    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Add user info to request object
      req.user = decoded;
      
      // Check if token is about to expire (less than 5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = decoded.exp;
      
      // Set a refreshed token header if within 5 minutes of expiry
      if (expiryTime - currentTime < 300) {
        const newToken = generateToken({ 
          id: decoded.id, 
          username: decoded.username 
        });
        
        res.setHeader('X-Refresh-Token', newToken);
      }
      
      next();
    } catch (jwtError) {
      // Handle specific JWT errors with appropriate messages
      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError('Authentication failed. Token has expired.', 401);
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new AppError('Authentication failed. Invalid token.', 401);
      } else {
        throw new AppError('Authentication failed. ' + jwtError.message, 401);
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware
 * Ensures that a user can only access their own data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authorize = (req, res, next) => {
  try {
    const requestedUserId = parseInt(req.params.userId);
    const authenticatedUserId = req.user.id;

    // Check if requested user ID matches authenticated user ID
    if (requestedUserId !== authenticatedUserId) {
      throw new AppError('Access denied. You can only access your own data.', 403);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Ensures that a user has the required role
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }
      
      // Convert roles to array if not already
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user has any of the required roles
      const userRole = req.user.role || 'user';
      
      if (!requiredRoles.includes(userRole)) {
        throw new AppError('Access denied. Insufficient privileges.', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  hasRole,
  generateToken,
  verifyToken
};
