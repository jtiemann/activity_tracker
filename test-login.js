const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

// Create a small Express app just for testing login
const app = express();
const port = 3002; // Use a different port to avoid conflicts

// Middleware
app.use(bodyParser.json());

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'activity_tracker',
  password: process.env.DB_PASSWORD || 'kermit',
  port: parseInt(process.env.DB_PORT) || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to database. Current time:', res.rows[0].now);
  }
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test login server is running!' });
});

// Direct login endpoint (without validation middleware)
app.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Get user from database
    const result = await pool.query(
      'SELECT user_id, username, email, password_hash FROM users WHERE username = $1',
      [username]
    );
    
    console.log('Query result:', result.rows);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Compare provided password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    console.log('Password match:', passwordMatch);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login time
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = $1',
      [user.user_id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, username: user.username },
      process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    // Send user info and token
    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Start the test server
app.listen(port, () => {
  console.log(`Test login server running on http://localhost:${port}`);
  console.log(`Try these endpoints:`);
  console.log(`- GET http://localhost:${port}/test`);
  console.log(`- POST http://localhost:${port}/login with JSON body: {"username": "jtiemann", "password": "kermit"}`);
});
