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

// Check if test user exists
async function checkUser() {
  try {
    const result = await pool.query(
      'SELECT user_id, username, email, password_hash FROM users WHERE username = $1',
      ['jtiemann']
    );
    
    if (result.rows.length === 0) {
      console.log('Test user jtiemann not found in the database!');
      console.log('Creating test user...');
      
      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('kermit', saltRounds);
      
      // Insert the user
      const insertResult = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username, email',
        ['jtiemann', 'jtiemann@example.com', passwordHash]
      );
      
      console.log('Test user created:', insertResult.rows[0]);
      
      // Add some default activities
      await pool.query(
        'INSERT INTO activity_types (user_id, name, unit) VALUES ($1, $2, $3)',
        [insertResult.rows[0].user_id, 'Push-ups', 'reps']
      );
      
      await pool.query(
        'INSERT INTO activity_types (user_id, name, unit) VALUES ($1, $2, $3)',
        [insertResult.rows[0].user_id, 'Running', 'miles']
      );
      
      console.log('Default activities added for test user');
    } else {
      console.log('Test user exists:', result.rows[0]);
      console.log('Password hash:', result.rows[0].password_hash);
    }
  } catch (error) {
    console.error('Error checking/creating user:', error);
  }
}

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Test login server is running!' });
});

// Direct login endpoint for testing
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
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, username: user.username },
      process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key',
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

// Start the test server and check for the test user
checkUser().then(() => {
  app.listen(port, () => {
    console.log(`Test login server running on http://localhost:${port}`);
    console.log(`Try these endpoints:`);
    console.log(`- GET http://localhost:${port}/`);
    console.log(`- POST http://localhost:${port}/login with JSON body: {"username": "jtiemann", "password": "kermit"}`);
  });
});
