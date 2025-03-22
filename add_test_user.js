const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'activity_tracker',
  password: process.env.DB_PASSWORD || 'kermit',
  port: process.env.DB_PORT || 5432,
});

async function addUser(username, email, password) {
  try {
    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`User ${username} already exists with ID: ${checkResult.rows[0].user_id}`);
      return checkResult.rows[0];
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log(`Generated hash for password: ${passwordHash}`);
    
    // Insert the user into the database
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username, email',
      [username, email, passwordHash]
    );
    
    console.log('User added successfully:', result.rows[0]);
    
    // Add some default activities for the new user
    await pool.query(
      'INSERT INTO activity_types (user_id, name, unit) VALUES ($1, $2, $3)',
      [result.rows[0].user_id, 'Push-ups', 'reps']
    );
    
    await pool.query(
      'INSERT INTO activity_types (user_id, name, unit) VALUES ($1, $2, $3)',
      [result.rows[0].user_id, 'Running', 'miles']
    );
    
    await pool.query(
      'INSERT INTO activity_types (user_id, name, unit) VALUES ($1, $2, $3)',
      [result.rows[0].user_id, 'Meditation', 'minutes']
    );
    
    console.log('Default activities added for the user');
    
    return result.rows[0];
  } catch (err) {
    console.error('Error adding user:', err);
    throw err;
  } finally {
    // Close the database connection
    pool.end();
  }
}

// Execute the function with jtiemann/kermit credentials
addUser('jtiemann', 'jtiemann@example.com', 'kermit')
  .then((user) => {
    console.log(`User jtiemann ${user ? 'created' : 'already exists'} with password "kermit"`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to add user:', err);
    process.exit(1);
  });