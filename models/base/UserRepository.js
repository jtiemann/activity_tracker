/**
 * User Repository for handling user data operations
 * Extends the base repository with user-specific methods
 */
const BaseRepository = require('./BaseRepository');
const bcrypt = require('bcrypt');

class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'user_id');
  }

  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  async getByUsername(username) {
    const users = await this.findAll({ username });
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Get user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User object or null
   */
  async getByEmail(email) {
    const users = await this.findAll({ email });
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Create a new user
   * @param {string} username - Username
   * @param {string} email - Email address
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} Created user object
   */
  async create(username, email, password) {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    return super.create({
      username,
      email,
      password_hash: passwordHash
    });
  }

  /**
   * Update last login time
   * @param {number} id - User ID
   * @returns {Promise<Object>} Updated user object
   */
  async updateLastLogin(id) {
    return super.update(id, {
      last_login: new Date()
    });
  }

  /**
   * Verify password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Change user password
   * @param {number} id - User ID
   * @param {string} newPassword - New plain text password
   * @returns {Promise<Object>} Updated user object
   */
  async changePassword(id, newPassword) {
    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    return super.update(id, {
      password_hash: passwordHash
    });
  }

  /**
   * Get users with email addresses
   * @returns {Promise<Array>} Array of user objects with email addresses
   */
  async getUsersWithEmail() {
    const query = `
      SELECT user_id, username, email 
      FROM ${this.tableName} 
      WHERE email IS NOT NULL AND email <> ''
    `;
    
    const result = await this.raw(query);
    return result.rows;
  }
}

module.exports = new UserRepository();
