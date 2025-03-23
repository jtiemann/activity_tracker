/**
 * Activity Repository for handling activity data operations
 * Extends the base repository with activity-specific methods
 */
const BaseRepository = require('./BaseRepository');

class ActivityRepository extends BaseRepository {
  constructor() {
    super('activity_types', 'activity_type_id');
  }

  /**
   * Get all activities for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of activity objects
   */
  async getAllForUser(userId) {
    return this.findAll({ user_id: userId }, { orderBy: 'name' });
  }

  /**
   * Create a new activity
   * @param {number} userId - User ID
   * @param {string} name - Activity name
   * @param {string} unit - Activity unit
   * @param {string} category - Activity category
   * @returns {Promise<Object>} Created activity object
   */
  async create(userId, name, unit, category = 'other') {
    return super.create({
      user_id: userId,
      name,
      unit,
      category,
      is_public: false
    });
  }

  /**
   * Update an activity
   * @param {number} id - Activity ID
   * @param {string} name - Activity name
   * @param {string} unit - Activity unit
   * @param {boolean} isPublic - Whether the activity is public
   * @param {string} category - Activity category
   * @returns {Promise<Object>} Updated activity object
   */
  async update(id, name, unit, isPublic = false, category = null) {
    const data = { name, unit, is_public: isPublic };
    
    // Only include category if provided
    if (category !== null) {
      data.category = category;
    }
    
    return super.update(id, data);
  }

  /**
   * Get activity categories for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of category objects
   */
  async getCategories(userId) {
    const query = `
      SELECT DISTINCT category 
      FROM ${this.tableName} 
      WHERE user_id = $1 AND category IS NOT NULL
      ORDER BY category
    `;
    
    const result = await this.raw(query, [userId]);
    return result.rows;
  }

  /**
   * Get trending activities (most logged in last 30 days)
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of activities to return
   * @returns {Promise<Array>} Array of activity objects with count
   */
  async getTrendingActivities(userId, limit = 5) {
    const query = `
      SELECT at.*, COUNT(al.log_id) as log_count
      FROM ${this.tableName} at
      JOIN activity_logs al ON at.activity_type_id = al.activity_type_id
      WHERE at.user_id = $1
        AND al.logged_at >= NOW() - INTERVAL '30 days'
      GROUP BY at.activity_type_id
      ORDER BY log_count DESC
      LIMIT $2
    `;
    
    const result = await this.raw(query, [userId, limit]);
    return result.rows;
  }
}

module.exports = new ActivityRepository();
