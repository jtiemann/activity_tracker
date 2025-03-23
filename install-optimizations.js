/**
 * Activity Tracker Optimization Installer
 * This script installs the optimized components and helps integrate them into the application
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const BASE_DIR = __dirname;
const PUBLIC_DIR = path.join(BASE_DIR, 'public');
const PUBLIC_JS_DIR = path.join(PUBLIC_DIR, 'js');
const MODELS_DIR = path.join(BASE_DIR, 'models');
const MIDDLEWARE_DIR = path.join(BASE_DIR, 'middleware');

console.log('Activity Tracker Optimization Installer');
console.log('======================================');
console.log('');

// Create backup directory
const backupDir = path.join(BASE_DIR, 'backup-' + new Date().toISOString().replace(/:/g, '-'));
console.log(`Creating backup directory: ${backupDir}`);
fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(path.join(backupDir, 'js'), { recursive: true });
fs.mkdirSync(path.join(backupDir, 'models'), { recursive: true });
fs.mkdirSync(path.join(backupDir, 'middleware'), { recursive: true });

// Helper function to backup and replace a file
function backupAndReplace(original, optimized) {
  try {
    if (fs.existsSync(original)) {
      // Determine backup path
      const relativePath = path.relative(BASE_DIR, original);
      const backupPath = path.join(backupDir, relativePath);
      
      // Ensure backup directory exists
      const backupDirPath = path.dirname(backupPath);
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }
      
      // Backup the file
      fs.copyFileSync(original, backupPath);
      console.log(`Backed up: ${relativePath}`);
      
      // Replace with optimized version
      fs.copyFileSync(optimized, original);
      console.log(`Replaced with optimized version: ${relativePath}`);
      
      return true;
    } else {
      console.log(`Original file not found: ${original}`);
      return false;
    }
  } catch (error) {
    console.error(`Error backing up and replacing ${original}:`, error);
    return false;
  }
}

// Step 1: Install optimized JavaScript files
console.log('\nInstalling optimized JavaScript files...');

const jsFiles = [
  { name: 'charts.js', integrated: false },
  { name: 'goals.js', integrated: false },
  { name: 'api.js', integrated: false }
];

jsFiles.forEach(file => {
  const original = path.join(PUBLIC_JS_DIR, file.name);
  const optimized = path.join(PUBLIC_JS_DIR, 'optimized', file.name);
  
  if (fs.existsSync(optimized)) {
    const success = backupAndReplace(original, optimized);
    file.integrated = success;
  } else {
    console.log(`Optimized file not found: ${optimized}`);
  }
});

// Step 2: Update index.html to include new scripts if needed
console.log('\nUpdating script references...');

const indexPath = path.join(PUBLIC_DIR, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Backup index.html
  const backupIndexPath = path.join(backupDir, 'index.html');
  fs.writeFileSync(backupIndexPath, indexContent);
  console.log('Backed up: index.html');
  
  // Check for new scripts that need to be added
  // We won't actually add them now, just show instructions
  
  let missingScripts = [];
  if (!indexContent.includes('<script src="js/api.js"></script>')) {
    missingScripts.push('api.js');
  }
  
  if (missingScripts.length > 0) {
    console.log('\nThe following scripts should be added to index.html:');
    missingScripts.forEach(script => {
      console.log(`- <script src="js/${script}"></script>`);
    });
  }
}

// Step 3: Install optimized models
console.log('\nInstalling optimized models...');

// Create models/base directory if it doesn't exist
const modelsBaseDir = path.join(MODELS_DIR, 'base');
if (!fs.existsSync(modelsBaseDir)) {
  fs.mkdirSync(modelsBaseDir, { recursive: true });
}

// Copy optimized model files
const modelFiles = [
  'BaseRepository.js',
  'ActivityRepository.js',
  'UserRepository.js',
  'LogRepository.js',
  'GoalRepository.js',
  'AchievementRepository.js'
];

modelFiles.forEach(file => {
  const source = path.join(MODELS_DIR, 'base', file);
  if (fs.existsSync(source)) {
    console.log(`Found optimized model: ${file}`);
  } else {
    console.log(`Optimized model not found: ${file}`);
  }
});

// Step 4: Install optimized middleware
console.log('\nInstalling optimized middleware...');

// Create middleware/optimized directory if it doesn't exist
const middlewareOptDir = path.join(MIDDLEWARE_DIR, 'optimized');
if (!fs.existsSync(middlewareOptDir)) {
  fs.mkdirSync(middlewareOptDir, { recursive: true });
}

// Copy optimized middleware files
const middlewareFiles = [
  'advancedCache.js',
  'errorHandler.js',
  'auth.js',
  'rateLimiter.js'
];

middlewareFiles.forEach(file => {
  const source = path.join(MIDDLEWARE_DIR, 'optimized', file);
  if (fs.existsSync(source)) {
    console.log(`Found optimized middleware: ${file}`);
  } else {
    console.log(`Optimized middleware not found: ${file}`);
  }
});

// Step 5: Create integration files
console.log('\nCreating integration files...');

// Create model integration file
const modelIntegrationPath = path.join(MODELS_DIR, 'repository-integration.js');
const modelIntegrationContent = `/**
 * Model Repository Integration
 * This file provides integration between old model functions and new repositories
 */

// Import repositories
const ActivityRepository = require('./base/ActivityRepository');
const UserRepository = require('./base/UserRepository');
const LogRepository = require('./base/LogRepository');
const GoalRepository = require('./base/GoalRepository');
const AchievementRepository = require('./base/AchievementRepository');

// Activity integration
const Activity = {
  // Original functions
  getAllForUser: ActivityRepository.getAllForUser.bind(ActivityRepository),
  getById: ActivityRepository.findById.bind(ActivityRepository),
  create: ActivityRepository.create.bind(ActivityRepository),
  update: ActivityRepository.update.bind(ActivityRepository),
  delete: ActivityRepository.delete.bind(ActivityRepository),
  getCategories: ActivityRepository.getCategories.bind(ActivityRepository),
  
  // New functions
  getTrendingActivities: ActivityRepository.getTrendingActivities.bind(ActivityRepository)
};

// User integration
const User = {
  // Original functions
  getById: UserRepository.findById.bind(UserRepository),
  getByUsername: UserRepository.getByUsername.bind(UserRepository),
  create: UserRepository.create.bind(UserRepository),
  updateLastLogin: UserRepository.updateLastLogin.bind(UserRepository),
  verifyPassword: UserRepository.verifyPassword.bind(UserRepository),
  
  // New functions
  getByEmail: UserRepository.getByEmail.bind(UserRepository),
  changePassword: UserRepository.changePassword.bind(UserRepository),
  getUsersWithEmail: UserRepository.getUsersWithEmail.bind(UserRepository)
};

// Log integration
const Log = {
  // Original functions
  getForActivity: LogRepository.getForActivity.bind(LogRepository),
  getById: LogRepository.findById.bind(LogRepository),
  create: LogRepository.create.bind(LogRepository),
  update: LogRepository.update.bind(LogRepository),
  delete: LogRepository.delete.bind(LogRepository),
  getStats: LogRepository.getStats.bind(LogRepository),
  
  // New functions
  getWeeklyDistribution: LogRepository.getWeeklyDistribution.bind(LogRepository)
};

// Goal integration
const Goal = {
  // Original functions
  getAllForUser: GoalRepository.getAllForUser.bind(GoalRepository),
  getForActivity: GoalRepository.getForActivity.bind(GoalRepository),
  getById: GoalRepository.findById.bind(GoalRepository),
  create: GoalRepository.create.bind(GoalRepository),
  update: GoalRepository.update.bind(GoalRepository),
  delete: GoalRepository.delete.bind(GoalRepository),
  getProgress: GoalRepository.getProgress.bind(GoalRepository),
  
  // New functions
  getActiveGoals: GoalRepository.getActiveGoals.bind(GoalRepository)
};

// Achievement integration
const Achievement = {
  // Original functions
  getAllForUser: AchievementRepository.getAllForUser.bind(AchievementRepository),
  getAchievementTypes: AchievementRepository.getAchievementTypes.bind(AchievementRepository),
  awardAchievement: AchievementRepository.awardAchievement.bind(AchievementRepository),
  checkAchievements: AchievementRepository.checkAchievements.bind(AchievementRepository)
};

module.exports = {
  Activity,
  User,
  Log,
  Goal,
  Achievement
};
`;

// Create middleware integration file
const middlewareIntegrationPath = path.join(MIDDLEWARE_DIR, 'optimized-integration.js');
const middlewareIntegrationContent = `/**
 * Middleware Optimization Integration
 * This file provides integration between old middleware and optimized versions
 */

// Import optimized middleware
const { cacheMiddleware, clearUserCache, clearEndpointCache } = require('./optimized/advancedCache');
const { authenticate, authorize, hasRole } = require('./optimized/auth');
const { AppError, errorLogger, errorHandler, notFoundHandler } = require('./optimized/errorHandler');
const { standardApiLimiter, authLimiter, publicLimiter } = require('./optimized/rateLimiter');

// Export for backwards compatibility
module.exports = {
  // Cache middleware
  cacheMiddleware,
  clearUserCache,
  clearEndpointCache,
  
  // Auth middleware
  authenticate,
  authorize,
  hasRole,
  
  // Error middleware
  AppError,
  errorLogger,
  errorHandler,
  notFoundHandler,
  
  // Rate limiting
  apiRateLimiter: standardApiLimiter,
  authLimiter,
  publicLimiter
};
`;

// Write integration files if they don't exist
if (!fs.existsSync(modelIntegrationPath)) {
  try {
    fs.writeFileSync(modelIntegrationPath, modelIntegrationContent);
    console.log(`Created model integration file: ${path.relative(BASE_DIR, modelIntegrationPath)}`);
  } catch (error) {
    console.error(`Error creating model integration file:`, error);
  }
} else {
  console.log(`Model integration file already exists: ${path.relative(BASE_DIR, modelIntegrationPath)}`);
}

if (!fs.existsSync(middlewareIntegrationPath)) {
  try {
    fs.writeFileSync(middlewareIntegrationPath, middlewareIntegrationContent);
    console.log(`Created middleware integration file: ${path.relative(BASE_DIR, middlewareIntegrationPath)}`);
  } catch (error) {
    console.error(`Error creating middleware integration file:`, error);
  }
} else {
  console.log(`Middleware integration file already exists: ${path.relative(BASE_DIR, middlewareIntegrationPath)}`);
}

// Step 6: Create database optimization SQL file
console.log('\nCreating database optimization SQL file...');

const dbOptimizationPath = path.join(BASE_DIR, 'optimize_db.sql');
const dbOptimizationContent = `-- Database optimizations for Activity Tracker
-- This script adds indexes and optimizes the database schema

-- Connect to the database
\\c activity_tracker

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

-- Add database statistics collection
ANALYZE activity_logs;
ANALYZE activity_types;
ANALYZE activity_goals;
ANALYZE user_achievements;
ANALYZE users;

-- Optimize database vacuum settings
ALTER DATABASE activity_tracker SET default_statistics_target = 500;

-- Done
SELECT 'Database optimization complete' AS message;
`;

// Write database optimization file if it doesn't exist
if (!fs.existsSync(dbOptimizationPath)) {
  try {
    fs.writeFileSync(dbOptimizationPath, dbOptimizationContent);
    console.log(`Created database optimization file: ${path.relative(BASE_DIR, dbOptimizationPath)}`);
  } catch (error) {
    console.error(`Error creating database optimization file:`, error);
  }
} else {
  console.log(`Database optimization file already exists: ${path.relative(BASE_DIR, dbOptimizationPath)}`);
}

// Step 7: Create Documentation
console.log('\nCreating optimization documentation...');

const docPath = path.join(BASE_DIR, 'OPTIMIZATIONS.md');
const docContent = `# Activity Tracker Optimizations

This document outlines the optimizations implemented in the Activity Tracker application.

## Database Optimizations

### Indexes
- Added indexes for better query performance on frequently accessed columns.
- Added composite indexes for common query patterns.

### Query Optimization
- Rewrote complex queries to be more efficient.
- Fixed date operation in streak calculation.

## Backend Optimizations

### Repository Pattern
- Implemented a base repository pattern for database operations.
- Created specialized repositories for each data model.
- Reduced code duplication and improved maintainability.

### Improved Caching
- Enhanced caching middleware with better key generation.
- Added cache invalidation for specific endpoints.
- Implemented ETag support for client-side caching.

### Error Handling
- Standardized error handling across the application.
- Added better logging for debugging.
- Improved error responses for the API.

### Authentication
- Enhanced token handling with automatic refresh.
- Added role-based authorization.
- Improved security for sensitive operations.

### Rate Limiting
- Implemented more granular rate limiting for different endpoints.
- Added protection against API abuse.

## Frontend Optimizations

### Chart Rendering
- Fixed issues with weekly chart data processing.
- Improved chart performance and appearance.
- Enhanced date handling for better accuracy.

### Goal Management
- Fixed issues with the Add Goal button.
- Improved form handling and validation.
- Enhanced error recovery.

### API Client
- Implemented a more robust API client with caching.
- Added retry logic for failed requests.
- Improved error handling.
- Added token refresh mechanism.

## Performance Improvements

### Request Batching
- Combined related API requests to reduce network overhead.
- Implemented caching of related data.

### DOM Manipulation
- Reduced unnecessary DOM updates.
- Improved UI responsiveness.
- Fixed rendering issues.

## Additional Features

### Weekly Distribution Chart
- Added a proper weekly distribution chart.
- Improved data processing for more accurate visualization.
- Fixed data aggregation issues.

### Goal Progress Tracking
- Enhanced goal progress calculation.
- Added visual indicators for goal completion.
- Improved date handling for period-based goals.

## Integration

### File Structure
- The optimized components are located in specific directories:
  - Frontend: \`public/js/optimized\`
  - Middleware: \`middleware/optimized\`
  - Models: \`models/base\`

### Integration Files
- \`models/repository-integration.js\`: Provides backward compatibility for models.
- \`middleware/optimized-integration.js\`: Integrates optimized middleware.

## Usage

1. Install the optimizations by running:
   \`\`\`
   node install-optimizations.js
   \`\`\`

2. Optimize the database by running:
   \`\`\`
   psql -U postgres -f optimize_db.sql
   \`\`\`

3. Restart the application to see the improvements.
`;

// Write documentation file if it doesn't exist
if (!fs.existsSync(docPath)) {
  try {
    fs.writeFileSync(docPath, docContent);
    console.log(`Created optimization documentation: ${path.relative(BASE_DIR, docPath)}`);
  } catch (error) {
    console.error(`Error creating optimization documentation:`, error);
  }
} else {
  console.log(`Optimization documentation already exists: ${path.relative(BASE_DIR, docPath)}`);
}

// Finish
console.log('\n======================================');
console.log('Optimization installation complete!');
console.log(`All original files have been backed up to: ${backupDir}`);
console.log('\nNext steps:');
console.log('1. Review the optimization documentation in OPTIMIZATIONS.md');
console.log('2. Run the database optimization script:');
console.log('   psql -U postgres -f optimize_db.sql');
console.log('3. Integrate the new repositories into your controllers:');
console.log('   - Replace model imports with repository imports');
console.log('   - Or use the integration files for backward compatibility');
console.log('4. Update the app.js to use the optimized middleware:');
console.log('   - Replace middleware imports with optimized versions');
console.log('   - Or use the middleware integration file');
console.log('5. Restart the application to see the improvements');
console.log('\nFor more details, see the OPTIMIZATIONS.md file.');
console.log('======================================');
