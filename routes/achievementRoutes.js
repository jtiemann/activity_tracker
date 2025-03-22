const express = require('express');
const achievementController = require('../controllers/achievementController');
const { validateUserId } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all achievements for a user
router.get(
  '/:userId', 
  validateUserId,
  authorize,
  cacheMiddleware(60), // Cache for 1 minute
  achievementController.getUserAchievements
);

// Get all achievement types
router.get(
  '/types', 
  cacheMiddleware(3600), // Cache for 1 hour (rarely changes)
  achievementController.getAchievementTypes
);

// Check for new achievements
router.get(
  '/check/:userId/:activityTypeId?', 
  validateUserId,
  authorize,
  achievementController.checkAchievements
);

// Share an achievement
router.post(
  '/share/:achievementId', 
  achievementController.shareAchievement
);

module.exports = router;
