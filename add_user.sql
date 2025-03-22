-- Connect to the activity tracker database
\c activity_tracker

-- Add new user
INSERT INTO users (username, email, password_hash)
VALUES ('jtiemann', 'jtiemann@example.com', ' $2b$10$wA33t9fmIMM2lKb3/FNBBOWrmz0RLWwFi.oqcCH4dKULJdbKdVDd.'
-- Verify user was added
SELECT user_id, username, email FROM users WHERE username = 'jtiemann';
