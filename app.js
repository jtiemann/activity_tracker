const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configure PostgreSQL connection
const pool = new Pool({
  user: 'postgres',      // replace with your PostgreSQL username
  host: 'localhost',
  database: 'activity_tracker',
  password: 'kermit',  // replace with your PostgreSQL password
  port: 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to database. Current time:', res.rows[0].now);
  }
});

// API Routes

// Get all activity types for a user
app.get('/api/activities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM activity_types WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new activity type
app.post('/api/activities', async (req, res) => {
  try {
    const { userId, name, unit } = req.body;
    const result = await pool.query(
      'INSERT INTO activity_types (user_id, name, unit) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Log an activity
app.post('/api/logs', async (req, res) => {
  try {
    const { activityTypeId, userId, count, loggedAt, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [activityTypeId, userId, count, loggedAt || new Date(), notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error logging activity:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get logs for a specific activity
app.get('/api/logs/:userId/:activityTypeId', async (req, res) => {
  try {
    const { userId, activityTypeId } = req.params;
    const result = await pool.query(
      'SELECT * FROM activity_logs WHERE user_id = $1 AND activity_type_id = $2 ORDER BY logged_at DESC',
      [userId, activityTypeId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a log
app.delete('/api/logs/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    await pool.query('DELETE FROM activity_logs WHERE log_id = $1', [logId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting log:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get activity stats (today, this week, this month, this year)
app.get('/api/stats/:userId/:activityTypeId', async (req, res) => {
  try {
    const { userId, activityTypeId } = req.params;
    
    // Get today's total
    const todayResult = await pool.query(
      `SELECT COALESCE(SUM(count), 0) as total
       FROM activity_logs 
       WHERE user_id = $1 
         AND activity_type_id = $2 
         AND logged_at >= CURRENT_DATE 
         AND logged_at < CURRENT_DATE + INTERVAL '1 day'`,
      [userId, activityTypeId]
    );
    
    // Get this week's total
    const weekResult = await pool.query(
      `SELECT COALESCE(SUM(count), 0) as total
       FROM activity_logs 
       WHERE user_id = $1 
         AND activity_type_id = $2 
         AND logged_at >= DATE_TRUNC('week', CURRENT_DATE) 
         AND logged_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'`,
      [userId, activityTypeId]
    );
    
    // Get this month's total
    const monthResult = await pool.query(
      `SELECT COALESCE(SUM(count), 0) as total
       FROM activity_logs 
       WHERE user_id = $1 
         AND activity_type_id = $2 
         AND logged_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND logged_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
      [userId, activityTypeId]
    );
    
    // Get this year's total
    const yearResult = await pool.query(
      `SELECT COALESCE(SUM(count), 0) as total
       FROM activity_logs 
       WHERE user_id = $1 
         AND activity_type_id = $2 
         AND logged_at >= DATE_TRUNC('year', CURRENT_DATE) 
         AND logged_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'`,
      [userId, activityTypeId]
    );
    
    // Get activity unit
    const unitResult = await pool.query(
      `SELECT unit FROM activity_types WHERE activity_type_id = $1`,
      [activityTypeId]
    );
    
    res.json({
      today: todayResult.rows[0].total,
      week: weekResult.rows[0].total,
      month: monthResult.rows[0].total,
      year: yearResult.rows[0].total,
      unit: unitResult.rows[0]?.unit || 'units'
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// User authentication with bcrypt
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get user and password hash from database
    const result = await pool.query(
      'SELECT user_id, username, email, password_hash FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Compare provided password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login time
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = $1',
      [user.user_id]
    );
    
    // Don't send password hash back to client
    delete user.password_hash;
    
    res.json(user);
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
