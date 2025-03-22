const pool = require('./db');

/**
 * Activity Log model
 */
class Log {
  /**
   * Get logs for a specific activity and user
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @param {number} limit - Maximum number of logs to return (for pagination)
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of log objects
   */
  static async getForActivity(userId, activityTypeId, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM activity_logs 
      WHERE user_id = $1 AND activity_type_id = $2 
      ORDER BY logged_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await pool.query(query, [userId, activityTypeId, limit, offset]);
    return result.rows;
  }
  
  /**
   * Get log by ID
   * @param {number} id - Log ID
   * @returns {Promise<Object>} Log object
   */
  static async getById(id) {
    const query = 'SELECT * FROM activity_logs WHERE log_id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
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
  static async create(activityTypeId, userId, count, loggedAt, notes) {
    const query = `
      INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at, notes) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    
    const result = await pool.query(
      query, 
      [activityTypeId, userId, count, loggedAt || new Date(), notes || null]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update a log entry
   * @param {number} id - Log ID
   * @param {number} count - Activity count
   * @param {Date} loggedAt - Date and time when activity was performed
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated log object
   */
  static async update(id, count, loggedAt, notes) {
    const query = `
      UPDATE activity_logs 
      SET count = $2, logged_at = $3, notes = $4 
      WHERE log_id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, count, loggedAt, notes]);
    return result.rows[0];
  }
  
  /**
   * Delete a log entry
   * @param {number} id - Log ID
   * @returns {Promise<boolean>} True if log was deleted
   */
  static async delete(id) {
    const query = 'DELETE FROM activity_logs WHERE log_id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Get activity stats
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @returns {Promise<Object>} Stats object with today, week, month, and year totals
   */
  static async getStats(userId, activityTypeId) {
    // Get today's total
    const todayQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM activity_logs 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= CURRENT_DATE 
        AND logged_at < CURRENT_DATE + INTERVAL '1 day'
    `;
    
    // Get this week's total
    const weekQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM activity_logs 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= DATE_TRUNC('week', CURRENT_DATE) 
        AND logged_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
    `;
    
    // Get this month's total
    const monthQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM activity_logs 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= DATE_TRUNC('month', CURRENT_DATE) 
        AND logged_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `;
    
    // Get this year's total
    const yearQuery = `
      SELECT COALESCE(SUM(count), 0) as total
      FROM activity_logs 
      WHERE user_id = $1 
        AND activity_type_id = $2 
        AND logged_at >= DATE_TRUNC('year', CURRENT_DATE) 
        AND logged_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
    `;
    
    // Get activity unit
    const unitQuery = `
      SELECT unit FROM activity_types WHERE activity_type_id = $1
    `;
    
    // Execute all queries in parallel
    const [todayResult, weekResult, monthResult, yearResult, unitResult] = await Promise.all([
      pool.query(todayQuery, [userId, activityTypeId]),
      pool.query(weekQuery, [userId, activityTypeId]),
      pool.query(monthQuery, [userId, activityTypeId]),
      pool.query(yearQuery, [userId, activityTypeId]),
      pool.query(unitQuery, [activityTypeId])
    ]);
    
    return {
      today: todayResult.rows[0].total,
      week: weekResult.rows[0].total,
      month: monthResult.rows[0].total,
      year: yearResult.rows[0].total,
      unit: unitResult.rows[0]?.unit || 'units'
    };
  }
}

module.exports = Log;
