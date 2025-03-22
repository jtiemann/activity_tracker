# Activity Tracker

A simple, visually appealing web application for tracking any type of activity. Log your progress, view statistics, and stay motivated.

## Features

- Track multiple activities with custom units (reps, miles, minutes, etc.)
- View statistics for today, this week, this month, and year to date
- Complete history of all logged activities
- User authentication
- Data persistence with PostgreSQL

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v10+)

## Setup

### 1. Database Setup

First, set up the PostgreSQL database:

```bash
# Create the database and tables
psql -U postgres -f create_activity_tracker_db.sql
```

This will:
- Create a new database called `activity_tracker`
- Set up the necessary tables
- Insert a test user and sample activities

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Database Connection

Edit the `app.js` file to update your PostgreSQL connection details:

```javascript
const pool = new Pool({
  user: 'postgres',      // replace with your PostgreSQL username
  host: 'localhost',
  database: 'activity_tracker',
  password: 'postgres',  // replace with your PostgreSQL password
  port: 5432,
});
```

### 4. Start the Application

```bash
npm start
```

The application will be available at http://localhost:3000

## Login Details

For the sample user created in the database:

- Username: testuser
- Password: placeholder_hash_replace_with_real_hash

**Note:** In a production environment, you should use proper password hashing and secure authentication.

## Extending the Application

### Adding More Features

Here are some ideas for extending the application:

1. **Goal Setting**: Allow users to set daily, weekly, or monthly goals
2. **Progress Visualization**: Add charts and graphs to visualize progress over time
3. **Social Features**: Share achievements, compete with friends
4. **Export Data**: Allow users to export their data in CSV format
5. **Reminders**: Set up notifications for scheduled activities

## API Endpoints

The application provides the following API endpoints:

- `GET /api/activities/:userId` - Get all activities for a user
- `POST /api/activities` - Create a new activity
- `GET /api/logs/:userId/:activityTypeId` - Get logs for a specific activity
- `POST /api/logs` - Log a new activity
- `DELETE /api/logs/:logId` - Delete a log
- `GET /api/stats/:userId/:activityTypeId` - Get stats for a specific activity
- `POST /api/login` - Authenticate a user

## Project Structure

- `app.js` - Main application file
- `public/index.html` - Frontend code
- `create_activity_tracker_db.sql` - Database setup script
- `sample_queries.sql` - Example queries for the database
- `database_setup_instructions.md` - Detailed database setup instructions
