const Activity = require('../models/activity');
const { clearUserCache, clearEndpointCache } = require('../middleware/cache');

/**
 * Get all activities for a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getAllActivities = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Get activities from database
    const activities = await Activity.getAllForUser(userId);
    
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

/**
 * Get activity by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getActivityById = async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.activityId);
    
    // Get activity from database
    const activity = await Activity.getById(activityId);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Check if user has permission to access this activity
    if (activity.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access this activity' });
    }
    
    res.json(activity);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new activity
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.createActivity = async (req, res, next) => {
  try {
    const { userId, name, unit } = req.body;
    
    // Check if user has permission to create activity for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to create activities for this user' });
    }
    
    // Create activity in database
    const activity = await Activity.create(userId, name, unit);
    
    // Clear cache
    clearUserCache(userId);
    clearEndpointCache(`/api/activities/${userId}`);
    
    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
};

/**
 * Update an activity
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.updateActivity = async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.activityId);
    const { name, unit, isPublic } = req.body;
    
    // Get existing activity
    const existingActivity = await Activity.getById(activityId);
    
    if (!existingActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Check if user has permission to update this activity
    if (existingActivity.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this activity' });
    }
    
    // Update activity in database
    const activity = await Activity.update(activityId, name, unit, isPublic);
    
    // Clear cache
    clearUserCache(existingActivity.user_id);
    clearEndpointCache(`/api/activities/${existingActivity.user_id}`);
    
    res.json(activity);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an activity
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.deleteActivity = async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.activityId);
    
    // Get existing activity
    const existingActivity = await Activity.getById(activityId);
    
    if (!existingActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Check if user has permission to delete this activity
    if (existingActivity.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this activity' });
    }
    
    // Delete activity from database
    await Activity.delete(activityId);
    
    // Clear cache
    clearUserCache(existingActivity.user_id);
    clearEndpointCache(`/api/activities/${existingActivity.user_id}`);
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Get activity categories for a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getCategories = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user has permission to access categories for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access categories for this user' });
    }
    
    // Get categories from database
    const categories = await Activity.getCategories(userId);
    
    res.json(categories);
  } catch (err) {
    next(err);
  }
};
