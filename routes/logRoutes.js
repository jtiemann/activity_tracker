const express = require('express');
const logController = require('../controllers/logController');
const { 
  validateLog, 
  validateUserId, 
  validateActivityTypeId,
  validateLogId 
} = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get logs for a specific activity
router.get(
  '/:userId/:activityTypeId', 
  validateUserId,
  validateActivityTypeId,
  authorize,
  cacheMiddleware(30), // Cache for 30 seconds
  logController.getActivityLogs
);

// Create a new log entry
router.post(
  '/', 
  validateLog, 
  logController.createLog
);

// Update a log entry
router.put(
  '/:logId', 
  validateLogId, 
  logController.updateLog
);

// Delete a log entry
router.delete(
  '/:logId', 
  validateLogId, 
  logController.deleteLog
);

// Get activity stats
router.get(
  '/stats/:userId/:activityTypeId', 
  validateUserId,
  validateActivityTypeId,
  authorize,
  cacheMiddleware(30), // Cache for 30 seconds
  logController.getStats
);

// Export logs to CSV
router.get(
  '/export/:userId/:activityTypeId?', 
  validateUserId,
  authorize,
  logController.exportLogs
);

// Export logs to PDF
router.get(
  '/export-pdf/:userId/:activityTypeId?', 
  validateUserId,
  authorize,
  logController.exportLogsPDF
);

module.exports = router;
