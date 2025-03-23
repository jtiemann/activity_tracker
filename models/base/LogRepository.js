/**
 * Log Repository for handling activity log data operations
 * Extends the base repository with log-specific methods
 */
const BaseRepository = require('./BaseRepository');

class LogRepository extends BaseRepository {
  constructor() {
    super('activity_logs', 'log_id');
  }

  /**
   * Get logs for a specific activity
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @param {number} limit - Maximum number of logs to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of log objects
   */
  async getForActivity(userId, activityTypeId, limit = 100, offset = 0) {
    return this.findAll(
      { user_id: userId, activity_type_id: activityTypeId },
      { limit, offset, orderBy: 'logged_at DESC' }
    );
  }

  /**
   * Create a new log entry
   * @param {number} activityTypeId - Activity Type ID
   * @param {number} userId - User ID
   * @param {number} count - Activity count
   * @param {Date} loggedAt - Date and time when activity was performed
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Created log object
   */
  async create(activityTypeId, userId, count, loggedAt, notes) {
    return super.create({
      activity_type_id: activityTypeId,
      user_id: userId,
      count,
      logged_at: loggedAt || new Date(),
      notes: notes || null,
      created_at: new Date()
    });
  }

  /**
   * Get activity stats
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @returns {Promise<Object>} Stats object with today, week, month, and year totals
   */
  async getStats(userId, activityTypeId) {
    // Get today's total
    const todayQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM ${this.tableName} 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= CURRENT_DATE 
        AND logged_at < CURRENT_DATE + INTERVAL '1 day'
    `;
    
    // Get this week's total
    const weekQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM ${this.tableName} 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= DATE_TRUNC('week', CURRENT_DATE) 
        AND logged_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
    `;
    
    // Get this month's total
    const monthQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM ${this.tableName} 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= DATE_TRUNC('month', CURRENT_DATE) 
        AND logged_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `;
    
    // Get this year's total
    const yearQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM ${this.tableName} 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= DATE_TRUNC('year', CURRENT_DATE) 
        AND logged_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
    `;
    
    // Get activity unit
    const unitQuery = `
      SELECT unit FROM activity_types WHERE activity_type_id = $1
    `;
    
    // Execute all queries in parallel for better performance
    const [todayResult, weekResult, monthResult, yearResult, unitResult] = await Promise.all([
      this.raw(todayQuery, [userId, activityTypeId]),
      this.raw(weekQuery, [userId, activityTypeId]),
      this.raw(monthQuery, [userId, activityTypeId]),
      this.raw(yearQuery, [userId, activityTypeId]),
      this.raw(unitQuery, [activityTypeId])
    ]);
    
    return {
      today: parseFloat(todayResult.rows[0].total),
      week: parseFloat(weekResult.rows[0].total),
      month: parseFloat(monthResult.rows[0].total),
      year: parseFloat(yearResult.rows[0].total),
      unit: unitResult.rows[0]?.unit || 'units'
    };
  }

  /**
   * Get weekly distribution data
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @returns {Promise<Array>} Array of counts for each day of the week
   */
  async getWeeklyDistribution(userId, activityTypeId) {
    const query = `
      SELECT 
        EXTRACT(DOW FROM logged_at) as day_of_week,
        SUM(count) as total
      FROM ${this.tableName}
      WHERE user_id = $1
        AND activity_type_id = $2
        AND logged_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY day_of_week
      ORDER BY day_of_week
    `;
    
    const result = await this.raw(query, [userId, activityTypeId]);
    
    // Initialize array with zeros for all days of the week (0 = Sunday, 6 = Saturday)
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    
    // Fill in the actual totals
    result.rows.forEach(row => {
      const dayIndex = parseInt(row.day_of_week);
      dayTotals[dayIndex] = parseFloat(row.total);
    });
    
    return dayTotals;
  }
}

module.exports = new LogRepository();
