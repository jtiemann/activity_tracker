const express = require('express');
const activityController = require('../controllers/activityController');
const { 
  validateActivity, 
  validateUserId, 
  validateActivityTypeId 
} = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all activities for a user
router.get(
  '/:userId', 
  validateUserId, 
  authorize, 
  cacheMiddleware(60), // Cache for 1 minute
  activityController.getAllActivities
);

// Get activity by ID
router.get(
  '/details/:activityId', 
  validateActivityTypeId, 
  activityController.getActivityById
);

// Create a new activity
router.post(
  '/', 
  validateActivity, 
  activityController.createActivity
);

// Update an activity
router.put(
  '/:activityId', 
  validateActivityTypeId, 
  activityController.updateActivity
);

// Delete an activity
router.delete(
  '/:activityId', 
  validateActivityTypeId, 
  activityController.deleteActivity
);

// Get activity categories for a user
router.get(
  '/categories/:userId', 
  validateUserId, 
  authorize, 
  cacheMiddleware(60), // Cache for 1 minute
  activityController.getCategories
);

module.exports = router;
