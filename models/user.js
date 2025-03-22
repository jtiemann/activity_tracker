const pool = require('./db');
const bcrypt = require('bcrypt');

/**
 * User model
 */
class User {
  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>} User object
   */
  static async getById(id) {
    const query = 'SELECT user_id, username, email, created_at, last_login FROM users WHERE user_id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Promise<Object>} User object with password hash
   */
  static async getByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }
  
  /**
   * Create a new user
   * @param {string} username - Username
   * @param {string} email - Email address
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} Created user object
   */
  static async create(username, email, password) {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert the user
    const query = `
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING user_id, username, email, created_at
    `;
    
    const result = await pool.query(query, [username, email, passwordHash]);
    return result.rows[0];
  }
  
  /**
   * Update last login time
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = NOW() WHERE user_id = $1';
    await pool.query(query, [id]);
  }
  
  /**
   * Verify password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
