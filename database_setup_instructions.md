# Activity Tracker Database Setup Instructions

This document provides instructions on how to set up the PostgreSQL database for the Activity Tracker application.

## Prerequisites

- PostgreSQL installed on your machine
- psql command-line utility available

## Setup Steps

### 1. Create the Database and Tables

Run the following command to create the database, tables, and sample data:

```bash
psql -U postgres -f create_activity_tracker_db.sql
```

Notes:
- Replace `postgres` with your PostgreSQL username if different
- You might be prompted for your password
- If you're using a different PostgreSQL port, add `-p YOUR_PORT`

### 2. Verify the Database Setup

After running the setup script, connect to the database:

```bash
psql -U postgres -d activity_tracker
```

And run a simple query to verify:

```sql
SELECT * FROM users;
SELECT * FROM activity_types;
SELECT * FROM activity_logs;
```

### 3. Try Sample Queries

Run the sample queries to explore the database functionality:

```bash
psql -U postgres -f sample_queries.sql
```

## Database Structure

### Tables

1. **users** - Stores user information
   - user_id (PK)
   - username
   - email
   - password_hash
   - created_at
   - last_login

2. **activity_types** - Defines types of activities that can be tracked
   - activity_type_id (PK)
   - user_id (FK)
   - name
   - unit
   - created_at
   - is_public

3. **activity_logs** - Records individual activity entries
   - log_id (PK)
   - activity_type_id (FK)
   - user_id (FK)
   - count
   - logged_at
   - notes
   - created_at

4. **activity_goals** - Stores user goals for activities
   - goal_id (PK)
   - user_id (FK)
   - activity_type_id (FK)
   - target_count
   - period_type
   - start_date
   - end_date
   - created_at

## Common Operations

### Adding a New User

```sql
INSERT INTO users (username, email, password_hash)
VALUES ('newuser', 'new@example.com', 'secure_password_hash');
```

### Creating a New Activity Type

```sql
INSERT INTO activity_types (user_id, name, unit)
VALUES (1, 'Swimming', 'laps');
```

### Logging an Activity

```sql
INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at, notes)
VALUES (1, 1, 15, NOW(), 'Felt great today!');
```

### Setting a Goal

```sql
INSERT INTO activity_goals (user_id, activity_type_id, target_count, period_type, start_date, end_date)
VALUES (1, 1, 100, 'weekly', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');
```
