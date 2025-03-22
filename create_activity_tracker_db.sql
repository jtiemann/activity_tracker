-- Create the activity tracker database
CREATE DATABASE activity_tracker;

-- Connect to the new database
\c activity_tracker

-- Users table to support multi-user functionality
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Activity types that users can track
CREATE TABLE activity_types (
    activity_type_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, name)
);

-- Individual activity log entries
CREATE TABLE activity_logs (
    log_id SERIAL PRIMARY KEY,
    activity_type_id INTEGER REFERENCES activity_types(activity_type_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    count NUMERIC(10, 2) NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for goals/targets (for future functionality)
CREATE TABLE activity_goals (
    goal_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type_id INTEGER REFERENCES activity_types(activity_type_id) ON DELETE CASCADE,
    target_count NUMERIC(10, 2) NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, activity_type_id, period_type)
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_type_id ON activity_logs(activity_type_id);
CREATE INDEX idx_activity_logs_logged_at ON activity_logs(logged_at);
CREATE INDEX idx_activity_types_user_id ON activity_types(user_id);

-- Insert a test user
INSERT INTO users (username, email, password_hash)
VALUES ('testuser', 'test@example.com', 'placeholder_hash_replace_with_real_hash');

-- Insert some sample activity types
INSERT INTO activity_types (user_id, name, unit)
VALUES 
(1, 'Push-ups', 'reps'),
(1, 'Running', 'miles'),
(1, 'Meditation', 'minutes');

-- Insert some sample activity logs
INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at)
VALUES
(1, 1, 20, NOW() - INTERVAL '2 days'),
(1, 1, 15, NOW() - INTERVAL '1 day'),
(1, 1, 25, NOW()),
(2, 1, 3.5, NOW() - INTERVAL '3 days'),
(2, 1, 2.7, NOW() - INTERVAL '1 day'),
(3, 1, 15, NOW() - INTERVAL '2 days'),
(3, 1, 20, NOW());

-- Verify data was inserted
SELECT 'Sample data has been successfully loaded.' AS message;
