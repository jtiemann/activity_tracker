// This script adds the "load previous entry" feature to the Activity Tracker app

const fs = require('fs');
const path = require('path');

// Define the app directory
const appDir = 'C:\\Users\\jonti\\Documents\\ActivityTrackerApp';

// Path to the app.js file
const appJsPath = path.join(appDir, 'public', 'js', 'app.js');

// Read the current app.js file
console.log(`Reading ${appJsPath}...`);
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Check if the feature is already implemented
if (appJsContent.includes('loadPreviousEntry')) {
    console.log('The loadPreviousEntry function is already implemented.');
    process.exit(0);
}

// Define the loadPreviousEntry function
const loadPreviousEntryFunction = `
    // Load previous entry for an activity
    async function loadPreviousEntry(activityId, userId) {
        try {
            const response = await fetch(\`/api/logs/\${userId}/\${activityId}?limit=1\`, {
                headers: {
                    'Authorization': \`Bearer \${currentUser.token}\`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load previous log');
            
            const logs = await response.json();
            
            // If there's at least one log entry, use its count as the default
            if (logs && logs.length > 0) {
                countInput.value = logs[0].count;
                console.log(\`Set default count to \${logs[0].count} from previous log\`);
            }
        } catch (error) {
            console.error('Error loading previous entry:', error);
            // Don't change the input if there's an error
        }
    }
    `;

// Find a good position to insert our new function
// Let's insert it after the updateUIForActivity function
const updateUIFunctionPosition = appJsContent.indexOf('function updateUIForActivity');
if (updateUIFunctionPosition === -1) {
    console.error('Could not find the updateUIForActivity function.');
    process.exit(1);
}

// Find the end of the updateUIForActivity function
const updateUIFunctionEnd = appJsContent.indexOf('    }', updateUIFunctionPosition);
if (updateUIFunctionEnd === -1) {
    console.error('Could not find the end of updateUIForActivity function.');
    process.exit(1);
}

// Insert our function after updateUIForActivity
const insertPosition = updateUIFunctionEnd + 5; // Add 5 to skip past the closing brace and newline
appJsContent = appJsContent.slice(0, insertPosition) + loadPreviousEntryFunction + appJsContent.slice(insertPosition);

// Now find the activityTypeSelect.addEventListener section
const selectEventListenerStart = appJsContent.indexOf('activityTypeSelect.addEventListener(\'change\'');
if (selectEventListenerStart === -1) {
    console.error('Could not find the activityTypeSelect event listener.');
    process.exit(1);
}

// Find the updateUIForActivity call within the event listener
const updateUICallStart = appJsContent.indexOf('updateUIForActivity(currentActivity);', selectEventListenerStart);
if (updateUICallStart === -1) {
    console.error('Could not find the updateUIForActivity call in the event listener.');
    process.exit(1);
}

// Position right after the updateUIForActivity call
const callEndPos = updateUICallStart + 'updateUIForActivity(currentActivity);'.length;

// Insert our loadPreviousEntry call
const loadPreviousEntryCall = '\n            // Load previous entry as default\n            loadPreviousEntry(currentActivity.activity_type_id, currentUser.user_id);';
appJsContent = appJsContent.slice(0, callEndPos) + loadPreviousEntryCall + appJsContent.slice(callEndPos);

// Write the updated content back to the file
console.log('Writing updated app.js...');
fs.writeFileSync(appJsPath, appJsContent, 'utf8');

console.log('Successfully added "load previous entry" feature to the Activity Tracker app!');
