/**
 * Goal Repository for handling goal data operations
 * Extends the base repository with goal-specific methods
 */
const BaseRepository = require('./BaseRepository');
const pool = require('../db');

class GoalRepository extends BaseRepository {
  constructor() {
    super('activity_goals', 'goal_id');
  }

  /**
   * Get all goals for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of goal objects
   */
  async getAllForUser(userId) {
    const query = `
      SELECT g.*, a.name as activity_name, a.unit 
      FROM ${this.tableName} g
      JOIN activity_types a ON g.activity_type_id = a.activity_type_id
      WHERE g.user_id = $1
      ORDER BY g.start_date DESC
    `;
    
    const result = await this.raw(query, [userId]);
    return result.rows;
  }

  /**
   * Get goals for a specific activity
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @returns {Promise<Array>} Array of goal objects
   */
  async getForActivity(userId, activityTypeId) {
    const query = `
      SELECT g.*, a.name as activity_name, a.unit 
      FROM ${this.tableName} g
      JOIN activity_types a ON g.activity_type_id = a.activity_type_id
      WHERE g.user_id = $1 AND g.activity_type_id = $2
      ORDER BY g.start_date DESC
    `;
    
    const result = await this.raw(query, [userId, activityTypeId]);
    return result.rows;
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
  async create(userId, activityTypeId, targetCount, periodType, startDate, endDate) {
    return super.create({
      user_id: userId,
      activity_type_id: activityTypeId,
      target_count: targetCount,
      period_type: periodType,
      start_date: startDate,
      end_date: endDate
    });
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
  async update(id, targetCount, periodType, startDate, endDate) {
    return super.update(id, {
      target_count: targetCount,
      period_type: periodType,
      start_date: startDate,
      end_date: endDate
    });
  }

  /**
   * Get progress for a goal
   * @param {number} goalId - Goal ID
   * @returns {Promise<Object>} Goal progress object
   */
  async getProgress(goalId) {
    // First get the goal details with activity information
    const goalQuery = `
      SELECT g.*, a.name as activity_name, a.unit 
      FROM ${this.tableName} g
      JOIN activity_types a ON g.activity_type_id = a.activity_type_id
      WHERE g.goal_id = $1
    `;
    
    const goalResult = await this.raw(goalQuery, [goalId]);
    const goal = goalResult.rows[0];
    
    if (!goal) {
      return null;
    }
    
    // Calculate date range based on period type
    let startDate, endDate;
    if (goal.start_date && goal.end_date) {
      startDate = new Date(goal.start_date);
      endDate = new Date(goal.end_date);
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
    const countQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM activity_logs 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= $3 
        AND logged_at <= $4
    `;
    
    const countResult = await this.raw(
      countQuery, 
      [goal.user_id, goal.activity_type_id, startDate, endDate]
    );
    
    const currentCount = parseFloat(countResult.rows[0].total);
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

  /**
   * Get active goals for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of active goal objects
   */
  async getActiveGoals(userId) {
    const query = `
      SELECT g.*, a.name as activity_name, a.unit 
      FROM ${this.tableName} g
      JOIN activity_types a ON g.activity_type_id = a.activity_type_id
      WHERE g.user_id = $1
        AND g.start_date <= CURRENT_DATE
        AND g.end_date >= CURRENT_DATE
      ORDER BY g.period_type, a.name
    `;
    
    const result = await this.raw(query, [userId]);
    return result.rows;
  }
}

module.exports = new GoalRepository();
