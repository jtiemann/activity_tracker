const pool = require('./db');

/**
 * Achievement model for badges and milestones
 */
class Achievement {
  /**
   * Get all achievements for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of achievement objects
   */
  static async getAllForUser(userId) {
    const query = `
      SELECT a.*, at.name as activity_name, at.unit 
      FROM user_achievements a
      LEFT JOIN activity_types at ON a.activity_type_id = at.activity_type_id
      WHERE a.user_id = $1
      ORDER BY a.earned_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
  
  /**
   * Get all available achievement types
   * @returns {Promise<Array>} Array of achievement type objects
   */
  static async getAchievementTypes() {
    const query = `
      SELECT * FROM achievement_types
      ORDER BY category, threshold
    `;
    
    const result = await pool.query(query);
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
  static async awardAchievement(userId, achievementTypeId, activityTypeId = null, customMessage = null) {
    const query = `
      INSERT INTO user_achievements (user_id, achievement_type_id, activity_type_id, earned_at, custom_message) 
      VALUES ($1, $2, $3, NOW(), $4) 
      RETURNING *
    `;
    
    const result = await pool.query(
      query, 
      [userId, achievementTypeId, activityTypeId, customMessage]
    );
    
    return result.rows[0];
  }
  
  /**
   * Check for new achievements based on user activity
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @returns {Promise<Array>} Array of new achievements earned
   */
  static async checkAchievements(userId, activityTypeId) {
    // Get achievement types
    const achievementTypes = await Achievement.getAchievementTypes();
    
    // Get user's current achievements
    const userAchievements = await Achievement.getAllForUser(userId);
    
    // Get activity totals
    const activityQuery = `
      SELECT 
        activity_type_id,
        COALESCE(SUM(count), 0) as total
      FROM activity_logs 
      WHERE user_id = $1
      GROUP BY activity_type_id
    `;
    
    const activityResult = await pool.query(activityQuery, [userId]);
    const activityTotals = activityResult.rows.reduce((acc, row) => {
      acc[row.activity_type_id] = parseFloat(row.total);
      return acc;
    }, {});
    
    // Get streak information
    // Fixed the date operation error
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
    
    const streakResult = await pool.query(streakQuery, [userId]);
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
      
      let awarded = false;
      let message = null;
      
      // Check achievement conditions based on category
      switch (type.category) {
        case 'total_count':
          // Achievement based on total count for any activity
          const totalAllActivities = Object.values(activityTotals).reduce((sum, val) => sum + val, 0);
          if (totalAllActivities >= type.threshold) {
            awarded = true;
            message = `Total of ${totalAllActivities} across all activities`;
          }
          break;
          
        case 'activity_specific':
          // Achievement based on total count for a specific activity
          if (activityTypeId && activityTotals[activityTypeId] >= type.threshold) {
            awarded = true;
            message = `Reached ${activityTotals[activityTypeId]} for this activity`;
          }
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
        const achievement = await Achievement.awardAchievement(
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
}

module.exports = Achievement;