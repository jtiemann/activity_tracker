const pool = require('./db');

/**
 * Goal model
 */
class Goal {
  /**
   * Get all goals for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of goal objects
   */
  static async getAllForUser(userId) {
    const query = `
      SELECT g.*, a.name as activity_name, a.unit 
      FROM activity_goals g
      JOIN activity_types a ON g.activity_type_id = a.activity_type_id
      WHERE g.user_id = $1
      ORDER BY g.start_date DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
  
  /**
   * Get goals for a specific activity
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @returns {Promise<Array>} Array of goal objects
   */
  static async getForActivity(userId, activityTypeId) {
    const query = `
      SELECT g.*, a.name as activity_name, a.unit 
      FROM activity_goals g
      JOIN activity_types a ON g.activity_type_id = a.activity_type_id
      WHERE g.user_id = $1 AND g.activity_type_id = $2
      ORDER BY g.start_date DESC
    `;
    
    const result = await pool.query(query, [userId, activityTypeId]);
    return result.rows;
  }
  
  /**
   * Get a goal by ID
   * @param {number} id - Goal ID
   * @returns {Promise<Object>} Goal object
   */
  static async getById(id) {
    const query = `
      SELECT g.*, a.name as activity_name, a.unit 
      FROM activity_goals g
      JOIN activity_types a ON g.activity_type_id = a.activity_type_id
      WHERE g.goal_id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
  /**
   * Create a new goal
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @param {number} targetCount - Target count
   * @param {string} periodType - Period type (daily, weekly, monthly, yearly)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Created goal object
   */
  static async create(userId, activityTypeId, targetCount, periodType, startDate, endDate) {
    const query = `
      INSERT INTO activity_goals (user_id, activity_type_id, target_count, period_type, start_date, end_date) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    
    const result = await pool.query(
      query, 
      [userId, activityTypeId, targetCount, periodType, startDate, endDate]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update a goal
   * @param {number} id - Goal ID
   * @param {number} targetCount - Target count
   * @param {string} periodType - Period type (daily, weekly, monthly, yearly)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Updated goal object
   */
  static async update(id, targetCount, periodType, startDate, endDate) {
    const query = `
      UPDATE activity_goals 
      SET target_count = $2, period_type = $3, start_date = $4, end_date = $5 
      WHERE goal_id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(
      query, 
      [id, targetCount, periodType, startDate, endDate]
    );
    
    return result.rows[0];
  }
  
  /**
   * Delete a goal
   * @param {number} id - Goal ID
   * @returns {Promise<boolean>} True if goal was deleted
   */
  static async delete(id) {
    const query = 'DELETE FROM activity_goals WHERE goal_id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Get progress for a goal
   * @param {number} goalId - Goal ID
   * @returns {Promise<Object>} Goal progress object
   */
  static async getProgress(goalId) {
    // First get the goal details
    const goal = await Goal.getById(goalId);
    
    if (!goal) {
      return null;
    }
    
    // Calculate date range based on period type
    let startDate, endDate;
    if (goal.start_date && goal.end_date) {
      startDate = goal.start_date;
      endDate = goal.end_date;
    } else {
      startDate = new Date();
      endDate = new Date();
      
      switch (goal.period_type.toLowerCase()) {
        case 'daily':
          // Current day
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          // Current week (Sunday to Saturday)
          const day = startDate.getDay();
          startDate.setDate(startDate.getDate() - day);
          startDate.setHours(0, 0, 0, 0);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          // Current month
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setMonth(endDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'yearly':
          // Current year
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setMonth(11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }
    
    // Get sum of activities in the date range
    const query = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM activity_logs 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= $3 
        AND logged_at <= $4
    `;
    
    const result = await pool.query(
      query, 
      [goal.user_id, goal.activity_type_id, startDate, endDate]
    );
    
    const currentCount = parseFloat(result.rows[0].total);
    const targetCount = parseFloat(goal.target_count);
    
    // Calculate progress percentage
    const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));
    
    return {
      goal,
      currentCount,
      targetCount,
      progressPercent,
      remaining: Math.max(0, targetCount - currentCount),
      startDate,
      endDate,
      completed: currentCount >= targetCount
    };
  }
}

module.exports = Goal;
