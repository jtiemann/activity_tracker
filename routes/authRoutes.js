const express = require('express');
const authController = require('../controllers/authController');
const { validateLogin } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Login route
router.post('/login', validateLogin, authController.login);

// Check authentication status
router.get('/check-auth', authenticate, authController.checkAuth);

// Refresh token
router.get('/refresh-token', authenticate, authController.refreshToken);

// Route for debugging
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Auth routes are working!' });
});

module.exports = router;
