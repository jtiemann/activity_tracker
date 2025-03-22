const Goal = require('../models/goal');
const Activity = require('../models/activity');
const { clearUserCache, clearEndpointCache } = require('../middleware/cache');

/**
 * Get all goals for a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getAllGoals = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user has permission to access goals for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access goals for this user' });
    }
    
    // Get goals from database
    const goals = await Goal.getAllForUser(userId);
    
    res.json(goals);
  } catch (err) {
    next(err);
  }
};

/**
 * Get goals for a specific activity
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getActivityGoals = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const activityTypeId = parseInt(req.params.activityTypeId);
    
    // Check if user has permission to access goals for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access goals for this user' });
    }
    
    // Get goals from database
    const goals = await Goal.getForActivity(userId, activityTypeId);
    
    res.json(goals);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a goal by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getGoalById = async (req, res, next) => {
  try {
    const goalId = parseInt(req.params.goalId);
    
    // Get goal from database
    const goal = await Goal.getById(goalId);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if user has permission to access this goal
    if (goal.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access this goal' });
    }
    
    res.json(goal);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new goal
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.createGoal = async (req, res, next) => {
  try {
    const { userId, activityTypeId, targetCount, periodType, startDate, endDate } = req.body;
    
    // Check if user has permission to create goal for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to create goals for this user' });
    }
    
    // Check if activity exists and belongs to user
    const activity = await Activity.getById(activityTypeId);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    if (activity.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to create goals for this activity' });
    }
    
    // Create goal in database
    const goal = await Goal.create(
      userId, 
      activityTypeId, 
      targetCount, 
      periodType, 
      startDate ? new Date(startDate) : null, 
      endDate ? new Date(endDate) : null
    );
    
    // Clear cache
    clearUserCache(userId);
    clearEndpointCache(`/api/goals/${userId}`);
    clearEndpointCache(`/api/goals/${userId}/${activityTypeId}`);
    
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a goal
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.updateGoal = async (req, res, next) => {
  try {
    const goalId = parseInt(req.params.goalId);
    const { targetCount, periodType, startDate, endDate } = req.body;
    
    // Get existing goal
    const existingGoal = await Goal.getById(goalId);
    
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if user has permission to update this goal
    if (existingGoal.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this goal' });
    }
    
    // Update goal in database
    const goal = await Goal.update(
      goalId, 
      targetCount, 
      periodType, 
      startDate ? new Date(startDate) : null, 
      endDate ? new Date(endDate) : null
    );
    
    // Clear cache
    clearUserCache(existingGoal.user_id);
    clearEndpointCache(`/api/goals/${existingGoal.user_id}`);
    clearEndpointCache(`/api/goals/${existingGoal.user_id}/${existingGoal.activity_type_id}`);
    
    res.json(goal);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a goal
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.deleteGoal = async (req, res, next) => {
  try {
    const goalId = parseInt(req.params.goalId);
    
    // Get existing goal
    const existingGoal = await Goal.getById(goalId);
    
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if user has permission to delete this goal
    if (existingGoal.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this goal' });
    }
    
    // Delete goal from database
    await Goal.delete(goalId);
    
    // Clear cache
    clearUserCache(existingGoal.user_id);
    clearEndpointCache(`/api/goals/${existingGoal.user_id}`);
    clearEndpointCache(`/api/goals/${existingGoal.user_id}/${existingGoal.activity_type_id}`);
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Get progress for a goal
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getGoalProgress = async (req, res, next) => {
  try {
    const goalId = parseInt(req.params.goalId);
    
    // Get goal progress from database
    const progress = await Goal.getProgress(goalId);
    
    if (!progress) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if user has permission to access this goal
    if (progress.goal.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access this goal' });
    }
    
    res.json(progress);
  } catch (err) {
    next(err);
  }
};
