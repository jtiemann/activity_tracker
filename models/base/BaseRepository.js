/**
 * Base Repository class to handle common database operations
 * Provides a foundation for all model repositories
 */
const pool = require('../db');

class BaseRepository {
  /**
   * Create a new repository for a database table
   * @param {string} tableName - The name of the database table
   * @param {string} primaryKey - The primary key column name
   */
  constructor(tableName, primaryKey) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  /**
   * Find a single record by ID
   * @param {number} id - The record ID
   * @returns {Promise<Object|null>} The found record or null
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all records matching conditions
   * @param {Object} conditions - Key-value pairs for WHERE clause
   * @param {Object} options - Additional options (limit, offset, orderBy, etc.)
   * @returns {Promise<Array>} Array of matching records
   */
  async findAll(conditions = {}, options = {}) {
    const { limit = null, offset = 0, orderBy = null } = options;
    
    // Build WHERE clause from conditions
    const whereClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(conditions).forEach(([key, value]) => {
      whereClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const whereClause = whereClauses.length > 0 
      ? `WHERE ${whereClauses.join(' AND ')}` 
      : '';
      
    // Build ORDER BY clause if specified
    const orderClause = orderBy 
      ? `ORDER BY ${orderBy}` 
      : '';
      
    // Build LIMIT and OFFSET clause if specified
    const limitClause = limit !== null 
      ? `LIMIT ${limit} OFFSET ${offset}` 
      : '';

    // Construct the full query
    const query = `
      SELECT * FROM ${this.tableName} 
      ${whereClause} 
      ${orderClause} 
      ${limitClause}
    `;
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Create a new record
   * @param {Object} data - The data to insert
   * @returns {Promise<Object>} The created record
   */
  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    // Generate $1, $2, etc. for parameterized query
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a record by ID
   * @param {number} id - The record ID
   * @param {Object} data - The data to update
   * @returns {Promise<Object>} The updated record
   */
  async update(id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    // Generate "column = $i" for each column
    const setClauses = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    
    // Add ID as the last parameter
    values.push(id);
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses}
      WHERE ${this.primaryKey} = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a record by ID
   * @param {number} id - The record ID
   * @returns {Promise<boolean>} True if record was deleted
   */
  async delete(id) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE ${this.primaryKey} = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Count records matching conditions
   * @param {Object} conditions - Key-value pairs for WHERE clause
   * @returns {Promise<number>} The count of matching records
   */
  async count(conditions = {}) {
    // Build WHERE clause from conditions
    const whereClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(conditions).forEach(([key, value]) => {
      whereClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const whereClause = whereClauses.length > 0 
      ? `WHERE ${whereClauses.join(' AND ')}` 
      : '';

    const query = `
      SELECT COUNT(*) as count 
      FROM ${this.tableName} 
      ${whereClause}
    `;
    
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Execute a raw SQL query
   * @param {string} sql - The SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async raw(sql, params = []) {
    return await pool.query(sql, params);
  }
}

module.exports = BaseRepository;
