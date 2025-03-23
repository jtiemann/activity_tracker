/**
 * Achievement Repository for handling achievement data operations
 * Extends the base repository with achievement-specific methods
 */
const BaseRepository = require('./BaseRepository');

class AchievementRepository extends BaseRepository {
  constructor() {
    super('user_achievements', 'user_achievement_id');
    this.achievementTypesTable = 'achievement_types';
  }

  /**
   * Get all achievements for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of achievement objects
   */
  async getAllForUser(userId) {
    const query = `
      SELECT a.*, at.name as activity_name, at.unit 
      FROM ${this.tableName} a
      LEFT JOIN activity_types at ON a.activity_type_id = at.activity_type_id
      WHERE a.user_id = $1
      ORDER BY a.earned_at DESC
    `;
    
    const result = await this.raw(query, [userId]);
    return result.rows;
  }

  /**
   * Get all achievement types
   * @returns {Promise<Array>} Array of achievement type objects
   */
  async getAchievementTypes() {
    const query = `
      SELECT * FROM ${this.achievementTypesTable}
      ORDER BY category, threshold
    `;
    
    const result = await this.raw(query);
    return result.rows;
  }

  /**
   * Award an achievement to a user
   * @param {number} userId - User ID
   * @param {number} achievementTypeId - Achievement Type ID
   * @param {number} activityTypeId - Activity Type ID (optional)
   * @param {string} customMessage - Custom message (optional)
   * @returns {Promise<Object>} Created user achievement object
   */
  async awardAchievement(userId, achievementTypeId, activityTypeId = null, customMessage = null) {
    return super.create({
      user_id: userId,
      achievement_type_id: achievementTypeId,
      activity_type_id: activityTypeId,
      earned_at: new Date(),
      custom_message: customMessage
    });
  }

  /**
   * Check for new achievements based on user activity
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID (optional)
   * @returns {Promise<Array>} Array of new achievements earned
   */
  async checkAchievements(userId, activityTypeId = null) {
    // Get achievement types
    const achievementTypes = await this.getAchievementTypes();
    
    // Get user's current achievements
    const userAchievements = await this.getAllForUser(userId);
    
    // Get activity totals
    const activityQuery = `
      SELECT 
        activity_type_id,
        COALESCE(SUM(count), 0) as total
      FROM activity_logs 
      WHERE user_id = $1
      GROUP BY activity_type_id
    `;
    
    const activityResult = await this.raw(activityQuery, [userId]);
    const activityTotals = activityResult.rows.reduce((acc, row) => {
      acc[row.activity_type_id] = parseFloat(row.total);
      return acc;
    }, {});
    
    // Get streak information with a fixed date operation
    const streakQuery = `
      WITH daily_activity AS (
        SELECT 
          user_id,
          activity_type_id,
          DATE(logged_at) AS activity_date
        FROM activity_logs
        WHERE user_id = $1
        GROUP BY user_id, activity_type_id, DATE(logged_at)
      ),
      streaks AS (
        SELECT 
          user_id,
          activity_type_id,
          activity_date,
          activity_date - (ROW_NUMBER() OVER (PARTITION BY user_id, activity_type_id ORDER BY activity_date))::integer AS streak_group
        FROM daily_activity
      )
      SELECT 
        activity_type_id,
        MAX(COUNT(*)) OVER (PARTITION BY activity_type_id) as max_streak
      FROM streaks
      GROUP BY activity_type_id, streak_group
    `;
    
    const streakResult = await this.raw(streakQuery, [userId]);
    const streaks = streakResult.rows.reduce((acc, row) => {
      acc[row.activity_type_id] = parseInt(row.max_streak);
      return acc;
    }, {});
    
    // Check for new achievements
    const newAchievements = [];
    
    for (const type of achievementTypes) {
      // Skip if user already has this achievement
      const hasAchievement = userAchievements.some(a => 
        a.achievement_type_id === type.achievement_type_id &&
        (type.category !== 'activity_specific' || a.activity_type_id === activityTypeId)
      );
      
      if (hasAchievement) continue;
      
      // Skip activity-specific achievements if activityTypeId is provided and doesn't match
      if (type.category === 'activity_specific' && 
          activityTypeId !== null && 
          activityTypeId !== undefined) {
        // Only check for this specific activity
        if (!this.checkActivitySpecificAchievement(type, activityTypeId, activityTotals)) {
          continue;
        }
      } else if (type.category === 'activity_specific') {
        // Skip activity-specific achievements if we're not checking for a specific activity
        continue;
      }
      
      let awarded = false;
      let message = null;
      
      // Check achievement conditions based on category
      switch (type.category) {
        case 'total_count':
          // Achievement based on total count for any activity
          const totalAllActivities = Object.values(activityTotals).reduce((sum, val) => sum + val, 0);
          if (totalAllActivities >= type.threshold) {
            awarded = true;
            message = `Total of ${totalAllActivities.toFixed(1)} across all activities`;
          }
          break;
          
        case 'activity_specific':
          // Already checked above, if we got here then it's awarded
          awarded = true;
          message = `Reached ${activityTotals[activityTypeId].toFixed(1)} for this activity`;
          break;
          
        case 'streak':
          // Achievement based on activity streak
          const maxStreak = Object.values(streaks).reduce((max, val) => Math.max(max, val), 0);
          if (maxStreak >= type.threshold) {
            awarded = true;
            message = `Maintained a streak of ${maxStreak} consecutive days`;
          }
          break;
          
        case 'activity_variety':
          // Achievement based on number of different activities tracked
          if (Object.keys(activityTotals).length >= type.threshold) {
            awarded = true;
            message = `Tracking ${Object.keys(activityTotals).length} different activities`;
          }
          break;
      }
      
      // Award achievement if conditions met
      if (awarded) {
        const achievement = await this.awardAchievement(
          userId, 
          type.achievement_type_id, 
          type.category === 'activity_specific' ? activityTypeId : null,
          message
        );
        
        // Add achievement type information
        achievement.name = type.name;
        achievement.description = type.description;
        achievement.icon = type.icon;
        
        newAchievements.push(achievement);
      }
    }
    
    return newAchievements;
  }

  /**
   * Check if an activity-specific achievement should be awarded
   * @param {Object} achievementType - Achievement type object
   * @param {number} activityTypeId - Activity Type ID
   * @param {Object} activityTotals - Activity totals object
   * @returns {boolean} True if achievement should be awarded
   * @private
   */
  checkActivitySpecificAchievement(achievementType, activityTypeId, activityTotals) {
    if (!activityTotals[activityTypeId]) {
      return false;
    }
    
    return activityTotals[activityTypeId] >= achievementType.threshold;
  }
}

module.exports = new AchievementRepository();
