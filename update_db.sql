-- Connect to the activity tracker database
\c activity_tracker

-- Add category field to activity_types table
ALTER TABLE activity_types ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Create achievement_types table
CREATE TABLE IF NOT EXISTS achievement_types (
    achievement_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255),
    category VARCHAR(50) NOT NULL, -- 'total_count', 'activity_specific', 'streak', 'activity_variety'
    threshold INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    user_achievement_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_type_id INTEGER REFERENCES achievement_types(achievement_type_id) ON DELETE CASCADE,
    activity_type_id INTEGER REFERENCES activity_types(activity_type_id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    custom_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample achievement types
INSERT INTO achievement_types (name, description, icon, category, threshold)
VALUES 
    ('Activity Starter', 'Log your first activity', 'award', 'total_count', 1),
    ('Dedicated Tracker', 'Log 10 activities', 'bar-chart-2', 'total_count', 10),
    ('Activity Master', 'Log 100 activities', 'award', 'total_count', 100),
    ('Push-up Beginner', 'Complete 100 push-ups', 'trending-up', 'activity_specific', 100),
    ('Push-up Pro', 'Complete 1,000 push-ups', 'award', 'activity_specific', 1000),
    ('Running Starter', 'Run your first mile', 'activity', 'activity_specific', 1),
    ('Marathon Milestone', 'Run a total of 26.2 miles', 'award', 'activity_specific', 26.2),
    ('Consistency Streak', 'Log activities for 7 consecutive days', 'check-square', 'streak', 7),
    ('Super Streak', 'Log activities for 30 consecutive days', 'award', 'streak', 30),
    ('Activity Explorer', 'Track 3 different types of activities', 'compass', 'activity_variety', 3),
    ('Activity Enthusiast', 'Track 5 different types of activities', 'award', 'activity_variety', 5);

-- Create index on user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_type_id ON user_achievements(achievement_type_id);
