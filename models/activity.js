const pool = require('./db');

/**
 * Activity model
 */
class Activity {
  /**
   * Get all activities for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of activity objects
   */
  static async getAllForUser(userId) {
    const query = 'SELECT * FROM activity_types WHERE user_id = $1 ORDER BY name';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
  
  /**
   * Get activity by ID
   * @param {number} id - Activity ID
   * @returns {Promise<Object>} Activity object
   */
  static async getById(id) {
    const query = 'SELECT * FROM activity_types WHERE activity_type_id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
  /**
   * Create a new activity
   * @param {number} userId - User ID
   * @param {string} name - Activity name
   * @param {string} unit - Activity unit
   * @returns {Promise<Object>} Created activity object
   */
  static async create(userId, name, unit) {
    const query = `
      INSERT INTO activity_types (user_id, name, unit) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, name, unit]);
    return result.rows[0];
  }
  
  /**
   * Update an activity
   * @param {number} id - Activity ID
   * @param {string} name - Activity name
   * @param {string} unit - Activity unit
   * @param {boolean} isPublic - Whether the activity is public
   * @returns {Promise<Object>} Updated activity object
   */
  static async update(id, name, unit, isPublic) {
    const query = `
      UPDATE activity_types 
      SET name = $2, unit = $3, is_public = $4 
      WHERE activity_type_id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, name, unit, isPublic]);
    return result.rows[0];
  }
  
  /**
   * Delete an activity
   * @param {number} id - Activity ID
   * @returns {Promise<boolean>} True if activity was deleted
   */
  static async delete(id) {
    const query = 'DELETE FROM activity_types WHERE activity_type_id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Get activity categories for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of category objects
   */
  static async getCategories(userId) {
    // Assuming we add a category field to the activity_types table
    const query = `
      SELECT DISTINCT category 
      FROM activity_types 
      WHERE user_id = $1 AND category IS NOT NULL
      ORDER BY category
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = Activity;
