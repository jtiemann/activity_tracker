const express = require('express');
const goalController = require('../controllers/goalController');
const { 
  validateUserId, 
  validateActivityTypeId 
} = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all goals for a user
router.get(
  '/:userId', 
  validateUserId,
  authorize,
  cacheMiddleware(60), // Cache for 1 minute
  goalController.getAllGoals
);

// Get goals for a specific activity
router.get(
  '/:userId/:activityTypeId', 
  validateUserId,
  validateActivityTypeId,
  authorize,
  cacheMiddleware(60), // Cache for 1 minute
  goalController.getActivityGoals
);

// Get a goal by ID
router.get(
  '/details/:goalId', 
  goalController.getGoalById
);

// Create a new goal
router.post(
  '/', 
  goalController.createGoal
);

// Update a goal
router.put(
  '/:goalId', 
  goalController.updateGoal
);

// Delete a goal
router.delete(
  '/:goalId', 
  goalController.deleteGoal
);

// Get progress for a goal
router.get(
  '/progress/:goalId', 
  goalController.getGoalProgress
);

module.exports = router;
