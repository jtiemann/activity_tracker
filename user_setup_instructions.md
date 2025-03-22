# Adding Users with Secure Password Hashing

This document provides instructions on how to add users to the Activity Tracker application with properly hashed passwords.

## Option 1: Using the add_test_user.js Script (Recommended)

The easiest way to add a new user is to use the provided script:

1. First, make sure you have installed the dependencies:
   ```bash
   npm install
   ```

2. Run the script to add jtiemann with password "kermit":
   ```bash
   node add_test_user.js
   ```

   This script will:
   - Create a secure bcrypt hash of the password
   - Insert the user into the database
   - Add default activities for the user
   - Display the generated password hash

## Option 2: Hash a Password Manually and Add to Database

If you want to generate a password hash first, then add it to the database manually:

1. Generate a hash for a password:
   ```bash
   npm run hash your_password
   # or
   node hash_password.js your_password
   ```

2. Copy the generated hash and update the add_user.sql file with it:
   ```sql
   -- Replace the placeholder hash with the one generated
   INSERT INTO users (username, email, password_hash)
   VALUES ('your_username', 'your_email', 'your_generated_hash');
   ```

3. Run the SQL script:
   ```bash
   psql -U postgres -d activity_tracker -f add_user.sql
   ```

## Option 3: Add a User Directly from SQL

If you prefer to add a user directly in SQL without using Node.js:

1. Connect to your PostgreSQL database:
   ```bash
   psql -U postgres -d activity_tracker
   ```

2. Execute the following SQL commands:
   ```sql
   -- Replace hash with an actual bcrypt hash
   INSERT INTO users (username, email, password_hash)
   VALUES ('username', 'email@example.com', 'bcrypt_hash');
   
   -- Add some default activities for the user
   INSERT INTO activity_types (user_id, name, unit)
   VALUES 
     ((SELECT user_id FROM users WHERE username = 'username'), 'Push-ups', 'reps'),
     ((SELECT user_id FROM users WHERE username = 'username'), 'Running', 'miles'),
     ((SELECT user_id FROM users WHERE username = 'username'), 'Meditation', 'minutes');
   ```

## Notes on Password Security

- Never store plain text passwords in your database
- Always use bcrypt or a similar secure hashing algorithm
- The "salt rounds" parameter (set to 10 in our code) determines how computationally intensive the hashing will be
- Higher salt rounds are more secure but take longer to compute
