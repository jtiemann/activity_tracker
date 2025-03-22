const Achievement = require('../models/achievement');

/**
 * Get all achievements for a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getUserAchievements = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user has permission to access achievements for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access achievements for this user' });
    }
    
    // Get achievements from database
    const achievements = await Achievement.getAllForUser(userId);
    
    res.json(achievements);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all achievement types
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getAchievementTypes = async (req, res, next) => {
  try {
    // Get achievement types from database
    const achievementTypes = await Achievement.getAchievementTypes();
    
    res.json(achievementTypes);
  } catch (err) {
    next(err);
  }
};

/**
 * Check for new achievements based on user activity
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.checkAchievements = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const activityTypeId = req.params.activityTypeId ? parseInt(req.params.activityTypeId) : null;
    
    // Check if user has permission to check achievements for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to check achievements for this user' });
    }
    
    // Check for new achievements
    const newAchievements = await Achievement.checkAchievements(userId, activityTypeId);
    
    res.json({
      newAchievements,
      count: newAchievements.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Share an achievement on social media
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.shareAchievement = async (req, res, next) => {
  try {
    const achievementId = parseInt(req.params.achievementId);
    const { platform } = req.body;
    
    // Get user achievements from database
    const userAchievements = await Achievement.getAllForUser(req.user.id);
    
    // Check if user has this achievement
    const achievement = userAchievements.find(a => a.user_achievement_id === achievementId);
    
    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found or does not belong to you' });
    }
    
    // Get achievement type info
    const achievementTypes = await Achievement.getAchievementTypes();
    const achievementType = achievementTypes.find(t => t.achievement_type_id === achievement.achievement_type_id);
    
    if (!achievementType) {
      return res.status(404).json({ error: 'Achievement type not found' });
    }
    
    // Generate sharing text
    const text = `I just earned the "${achievementType.name}" achievement in Activity Tracker! ${achievementType.description}`;
    
    // Generate sharing URL based on platform
    let shareUrl = '';
    
    switch (platform.toLowerCase()) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(req.headers.origin || 'https://activitytracker.app')}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(req.headers.origin || 'https://activitytracker.app')}&title=${encodeURIComponent('Activity Tracker Achievement')}&summary=${encodeURIComponent(text)}`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid platform. Supported platforms: twitter, facebook, linkedin' });
    }
    
    res.json({
      achievement: {
        ...achievement,
        name: achievementType.name,
        description: achievementType.description,
        icon: achievementType.icon
      },
      shareText: text,
      shareUrl
    });
  } catch (err) {
    next(err);
  }
};
