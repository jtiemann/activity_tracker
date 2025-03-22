-- Connect to the database
\c activity_tracker

-- Get all activity types for a user
SELECT * FROM activity_types WHERE user_id = 1 ORDER BY name;

-- Log a new activity
INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at) 
VALUES (1, 1, 10, NOW());

-- Get today's total for a specific activity
SELECT at.name, at.unit, SUM(al.count) AS today_total
FROM activity_logs al
JOIN activity_types at ON al.activity_type_id = at.activity_type_id
WHERE al.user_id = 1 
  AND al.activity_type_id = 1 
  AND al.logged_at >= CURRENT_DATE 
  AND al.logged_at < CURRENT_DATE + INTERVAL '1 day'
GROUP BY at.name, at.unit;

-- Get this week's total (assuming week starts on Sunday)
SELECT at.name, at.unit, SUM(al.count) AS weekly_total
FROM activity_logs al
JOIN activity_types at ON al.activity_type_id = at.activity_type_id
WHERE al.user_id = 1 
  AND al.activity_type_id = 1 
  AND al.logged_at >= DATE_TRUNC('week', CURRENT_DATE) 
  AND al.logged_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
GROUP BY at.name, at.unit;

-- Get monthly total
SELECT at.name, at.unit, SUM(al.count) AS monthly_total
FROM activity_logs al
JOIN activity_types at ON al.activity_type_id = at.activity_type_id
WHERE al.user_id = 1 
  AND al.activity_type_id = 1 
  AND al.logged_at >= DATE_TRUNC('month', CURRENT_DATE) 
  AND al.logged_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY at.name, at.unit;

-- Get yearly total
SELECT at.name, at.unit, SUM(al.count) AS yearly_total
FROM activity_logs al
JOIN activity_types at ON al.activity_type_id = at.activity_type_id
WHERE al.user_id = 1 
  AND al.activity_type_id = 1 
  AND al.logged_at >= DATE_TRUNC('year', CURRENT_DATE) 
  AND al.logged_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
GROUP BY at.name, at.unit;

-- Get activity history for a user, sorted by most recent
SELECT al.log_id, at.name, at.unit, al.count, al.logged_at, al.notes
FROM activity_logs al
JOIN activity_types at ON al.activity_type_id = at.activity_type_id
WHERE al.user_id = 1
ORDER BY al.logged_at DESC
LIMIT 50;

-- Get total counts by activity type for a user
SELECT at.name, at.unit, SUM(al.count) AS total
FROM activity_logs al
JOIN activity_types at ON al.activity_type_id = at.activity_type_id
WHERE al.user_id = 1
GROUP BY at.name, at.unit
ORDER BY total DESC;

-- Get activity streaks (consecutive days with activity)
WITH daily_activity AS (
  SELECT 
    user_id,
    activity_type_id,
    DATE(logged_at) AS activity_date
  FROM activity_logs
  GROUP BY user_id, activity_type_id, DATE(logged_at)
),
streaks AS (
  SELECT 
    user_id,
    activity_type_id,
    activity_date,
    activity_date - ROW_NUMBER() OVER (PARTITION BY user_id, activity_type_id ORDER BY activity_date) AS streak_group
  FROM daily_activity
)
SELECT 
  u.username,
  at.name,
  MIN(activity_date) AS streak_start,
  MAX(activity_date) AS streak_end,
  COUNT(*) AS streak_length
FROM streaks s
JOIN users u ON s.user_id = u.user_id
JOIN activity_types at ON s.activity_type_id = at.activity_type_id
GROUP BY u.username, at.name, streak_group
ORDER BY streak_length DESC, streak_end DESC;
