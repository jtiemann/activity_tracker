// Simple validation middleware for now - we'll add the full express-validator implementation later
// This is just to ensure the routes work

/**
 * Validation middleware for user login
 */
exports.validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  next();
};

/**
 * Validation middleware for activity creation
 */
exports.validateActivity = (req, res, next) => {
  const { userId, name, unit } = req.body;
  
  if (!userId || !name || !unit) {
    return res.status(400).json({ error: 'User ID, name, and unit are required' });
  }
  
  next();
};

/**
 * Validation middleware for activity logging
 */
exports.validateLog = (req, res, next) => {
  const { activityTypeId, userId, count } = req.body;
  
  if (!activityTypeId || !userId || !count) {
    return res.status(400).json({ error: 'Activity type ID, user ID, and count are required' });
  }
  
  next();
};

/**
 * Validation middleware for user ID parameter
 */
exports.validateUserId = (req, res, next) => {
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Valid user ID is required' });
  }
  
  next();
};

/**
 * Validation middleware for activity type ID parameter
 */
exports.validateActivityTypeId = (req, res, next) => {
  const activityTypeId = parseInt(req.params.activityTypeId || req.params.activityId);
  
  if (isNaN(activityTypeId) || activityTypeId <= 0) {
    return res.status(400).json({ error: 'Valid activity type ID is required' });
  }
  
  next();
};

/**
 * Validation middleware for log ID parameter
 */
exports.validateLogId = (req, res, next) => {
  const logId = parseInt(req.params.logId);
  
  if (isNaN(logId) || logId <= 0) {
    return res.status(400).json({ error: 'Valid log ID is required' });
  }
  
  next();
};

/**
 * Validation error handler - placeholder for express-validator integration
 */
exports.validateResults = (req, res, next) => {
  next();
};
