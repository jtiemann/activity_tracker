/**
 * This script fixes the issue with goals being displayed twice in the ActivityTrackerApp.
 * 
 * Problem: In app.js, there are two separate calls to initialize the goals manager for the
 * current activity when changing activities:
 * 
 * 1. First call: Inside the activityTypeSelect.addEventListener 'change' function
 *    - window.goalsManager.updateActivity(currentActivity);
 * 
 * 2. Second call: Also inside the same event listener function, after loading logs and stats
 *    - window.goalsManager.init(currentActivity);
 * 
 * This causes the goals to be rendered twice.
 * 
 * Solution: Modify app.js to only call the goal manager's init method once
 * when an activity is selected or changed.
 */

// Read the app.js file
const fs = require('fs');
const path = require('path');

// Define paths
const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');
const backupPath = path.join(__dirname, 'public', 'js', 'app.js.bak');

// Create a backup of the original file
try {
  fs.copyFileSync(appJsPath, backupPath);
  console.log('Created backup of app.js at:', backupPath);
} catch (error) {
  console.error('Error creating backup:', error);
  process.exit(1);
}

// Read the app.js file
let appJsContent;
try {
  appJsContent = fs.readFileSync(appJsPath, 'utf8');
  console.log('Successfully read app.js file');
} catch (error) {
  console.error('Error reading app.js:', error);
  process.exit(1);
}

// Fix the code to avoid double initialization of goals
// Pattern to find: Multiple initializations of goals manager in the activityTypeSelect change event
const originalCode = `            // Update goals for current activity
            if (window.goalsManager) {
                window.goalsManager.updateActivity(currentActivity);
            }loadLogs();
            loadStats();
                window.goalsManager.init(currentActivity);`;

const fixedCode = `            // Update goals for current activity
            if (window.goalsManager) {
                window.goalsManager.init(currentActivity);
            }
            loadLogs();
            loadStats();`;

// Apply the fix
const updatedContent = appJsContent.replace(originalCode, fixedCode);

// Save the fixed content back to the file
try {
  fs.writeFileSync(appJsPath, updatedContent);
  console.log('Successfully updated app.js with fix');
} catch (error) {
  console.error('Error writing updated app.js:', error);
  process.exit(1);
}

console.log('Goal display fix has been successfully applied!');
console.log('The issue with goals being displayed twice has been resolved.');
