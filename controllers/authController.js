const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const pool = require('../models/db');
require('dotenv').config({ path: './config.env' });

/**
 * Login controller
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Login attempt for user: ${username}`);
    
    // Get user from database
    const result = await pool.query(
      'SELECT user_id, username, email, password_hash FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Compare provided password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('Password matched, generating token');
    
    // Update last login time
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = $1',
      [user.user_id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, username: user.username },
      process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key',
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    console.log('Login successful, token generated');
    
    // Send user info and token
    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

/**
 * Check authentication status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.checkAuth = (req, res) => {
  // If middleware passes, user is authenticated
  res.json({ 
    authenticated: true,
    user: {
      id: req.user.id,
      username: req.user.username
    }
  });
};

/**
 * Refresh JWT token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.refreshToken = (req, res) => {
  // Generate new token
  const token = jwt.sign(
    { id: req.user.id, username: req.user.username },
    process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key',
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
  
  res.json({ token });
};