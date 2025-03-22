# Activity Tracker

A comprehensive, visually appealing web application for tracking various activities. Log your progress, set goals, earn achievements, view statistics, and stay motivated.

## Features

### Core Features
- Track multiple activities with custom units (reps, miles, minutes, etc.)
- View statistics for today, this week, this month, and year to date
- Complete history of all logged activities
- Dark/light theme support
- Mobile-responsive design

### Enhanced Features
- **Goal Setting**: Set daily, weekly, monthly, and yearly targets with progress tracking
- **Achievements/Badges**: Earn achievements based on activity counts, streaks, and variety
- **Activity Categories**: Organize activities by categories (strength, cardio, wellness, etc.)
- **Data Visualization**: Interactive charts to visualize progress over time
- **Data Export**: Export your activity logs to CSV and PDF formats
- **Social Features**: Share achievements on social media platforms

### Technical Features
- **Secure Authentication**: JWT-based authentication with token refresh
- **API Rate Limiting**: Protection against abuse
- **Caching**: Optimized performance for frequently accessed data
- **Email Notifications**: Receive updates on achievements, goals, and reminders
- **Comprehensive Logging**: Detailed request and error logging
- **Data Persistence**: PostgreSQL database for reliable data storage

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v10+)
- npm or yarn package manager

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/activity-tracker.git
cd activity-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `config.env` file in the root directory:

```
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=activity_tracker
DB_PASSWORD=your_password
DB_PORT=5432

# Server Configuration
PORT=3001

# JWT Secret
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
JWT_EXPIRY=24h

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 4. Database Setup

Set up the PostgreSQL database:

```bash
# Create the database and tables
psql -U postgres -f create_activity_tracker_db.sql
```

For an existing database, update the schema:

```bash
psql -U postgres -f update_db.sql
```

### 5. Add a Test User

You can add a test user by running:

```bash
node add_test_user.js
```

This creates a user with:
- Username: jtiemann
- Password: kermit

For more options, see `USER_SETUP_INSTRUCTIONS.md`.

### 6. Start the Application

```bash
npm start
```

The application will be available at http://localhost:3001

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Test the API
npm run test-api
```

## Project Structure

The application follows the MVC (Model-View-Controller) architecture:

- **Models**: Database interactions and business logic (`/models`)
- **Views**: Frontend code in the `/public` directory
- **Controllers**: Request handling logic (`/controllers`)
- **Routes**: API endpoint definitions (`/routes`)
- **Middleware**: Authentication, validation, caching, etc. (`/middleware`)
- **Services**: Email notifications, etc. (`/services`)

## API Documentation

The application provides the following API endpoints:

### Authentication

- `POST /api/auth/login` - Authenticate a user
- `GET /api/auth/check-auth` - Check authentication status
- `GET /api/auth/refresh-token` - Refresh authentication token

### Activities

- `GET /api/activities/:userId` - Get all activities for a user
- `POST /api/activities` - Create a new activity
- `PUT /api/activities/:activityId` - Update an activity
- `DELETE /api/activities/:activityId` - Delete an activity
- `GET /api/activities/categories/:userId` - Get activity categories

### Logs

- `GET /api/logs/:userId/:activityTypeId` - Get logs for a specific activity
- `POST /api/logs` - Log a new activity
- `PUT /api/logs/:logId` - Update a log entry
- `DELETE /api/logs/:logId` - Delete a log
- `GET /api/logs/stats/:userId/:activityTypeId` - Get stats for a specific activity
- `GET /api/logs/export/:userId/:activityTypeId?` - Export logs to CSV
- `GET /api/logs/export-pdf/:userId/:activityTypeId?` - Export logs to PDF

### Goals

- `GET /api/goals/:userId` - Get all goals for a user
- `GET /api/goals/:userId/:activityTypeId` - Get goals for a specific activity
- `POST /api/goals` - Create a new goal
- `PUT /api/goals/:goalId` - Update a goal
- `DELETE /api/goals/:goalId` - Delete a goal
- `GET /api/goals/progress/:goalId` - Get progress for a goal

### Achievements

- `GET /api/achievements/:userId` - Get all achievements for a user
- `GET /api/achievements/types` - Get all achievement types
- `GET /api/achievements/check/:userId/:activityTypeId?` - Check for new achievements
- `POST /api/achievements/share/:achievementId` - Share an achievement

## Documentation

Additional documentation:

- `FIXES.md` - Details about fixes implemented
- `IMPROVEMENTS.md` - Information about feature enhancements
- `TEST_INSTRUCTIONS.md` - Detailed testing instructions
- `USER_SETUP_INSTRUCTIONS.md` - How to add users with secure passwords

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
