-- Database optimizations for Activity Tracker
-- This script adds indexes and optimizes the database schema

-- Connect to the database
\c activity_tracker

-- Add indexes for better query performance
-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_logged_at ON activity_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_activity ON activity_logs(user_id, activity_type_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_activity_date ON activity_logs(user_id, activity_type_id, logged_at);

-- Activity types indexes
CREATE INDEX IF NOT EXISTS idx_activity_types_name ON activity_types(name);
CREATE INDEX IF NOT EXISTS idx_activity_types_category ON activity_types(category);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);

-- Activity goals indexes
CREATE INDEX IF NOT EXISTS idx_activity_goals_user_id ON activity_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_goals_dates ON activity_goals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_activity_goals_user_activity ON activity_goals(user_id, activity_type_id);
CREATE INDEX IF NOT EXISTS idx_activity_goals_period_type ON activity_goals(period_type);

-- Optimize complex queries with indexes for specific patterns
-- This will help with streak calculation
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_activity_date_day ON activity_logs(user_id, activity_type_id, date(logged_at));

-- Add a compound index for the most common query pattern for stats
CREATE INDEX IF NOT EXISTS idx_activity_logs_stats_query ON activity_logs(user_id, activity_type_id, count, logged_at);

-- -- Add partial indexes for active goals
-- CREATE INDEX IF NOT EXISTS idx_active_goals ON activity_goals(user_id, activity_type_id) 
-- WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;

--fixes issue with mutable date in index
ALTER TABLE activity_goals ADD COLUMN is_active BOOLEAN;

CREATE OR REPLACE FUNCTION update_active_status() RETURNS TRIGGER AS $$
BEGIN
  NEW.is_active := (NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_active_status
BEFORE INSERT OR UPDATE ON activity_goals
FOR EACH ROW EXECUTE FUNCTION update_active_status();

-- Update existing rows
UPDATE activity_goals SET is_active = (start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE);

-- Then create your index on this column
CREATE INDEX idx_active_goals ON activity_goals(user_id, activity_type_id) WHERE is_active = TRUE;
-- -----------------------------

-- Optimize users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Add foreign key indexes (if missing) for better join performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type_id ON activity_logs(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_activity_type_id ON user_achievements(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_activity_goals_activity_type_id ON activity_goals(activity_type_id);

-- Run ANALYZE to update statistics for the query planner
ANALYZE activity_logs;
ANALYZE activity_types;
ANALYZE activity_goals;
ANALYZE user_achievements;
ANALYZE users;

-- Optimize database settings
ALTER DATABASE activity_tracker SET default_statistics_target = 500;
ALTER DATABASE activity_tracker SET random_page_cost = 1.1;  -- If using SSD storage
ALTER DATABASE activity_tracker SET effective_cache_size = '1GB';  -- Adjust based on available memory
ALTER DATABASE activity_tracker SET work_mem = '64MB';  -- Adjust based on available memory
ALTER DATABASE activity_tracker SET maintenance_work_mem = '128MB';  -- For maintenance operations

-- Print completion message
SELECT 'Database optimization complete' AS message;
