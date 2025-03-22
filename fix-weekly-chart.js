// Fix weekly chart distribution data processing issue

const fs = require('fs');
const path = require('path');

// Define the app directory
const appDir = 'C:\\Users\\jonti\\Documents\\ActivityTrackerApp';
const chartsJsPath = path.join(appDir, 'public', 'js', 'charts.js');

console.log(`Reading ${chartsJsPath}...`);
let chartsJsContent = fs.readFileSync(chartsJsPath, 'utf8');

// Find the prepareWeeklyDistributionData method
const weeklyMethodStart = chartsJsContent.indexOf('prepareWeeklyDistributionData()');
if (weeklyMethodStart === -1) {
    console.error('Could not find prepareWeeklyDistributionData method');
    process.exit(1);
}

// Find the method body
const methodBodyStart = chartsJsContent.indexOf('{', weeklyMethodStart);
const methodBodyEnd = findMatchingBrace(chartsJsContent, methodBodyStart);

if (methodBodyEnd === -1) {
    console.error('Could not find the end of prepareWeeklyDistributionData method');
    process.exit(1);
}

// Extract the current method body
const currentMethodBody = chartsJsContent.substring(methodBodyStart, methodBodyEnd + 1);

// Define the corrected method
const correctedMethod = `{
        // Initialize day of week counts
        const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
        
        // Calculate totals for each day of the week
        if (this.data.logs && Array.isArray(this.data.logs)) {
            this.data.logs.forEach(log => {
                try {
                    const date = new Date(log.logged_at);
                    if (isNaN(date.getTime())) {
                        console.warn('Invalid date found in log:', log);
                        return; // Skip this log
                    }
                    
                    const dayOfWeek = date.getDay(); // 0-6 where 0 is Sunday
                    
                    // Make sure count is treated as a number
                    const count = parseFloat(log.count);
                    if (!isNaN(count)) {
                        dayTotals[dayOfWeek] += count;
                    } else {
                        console.warn('Invalid count in log:', log);
                    }
                } catch (err) {
                    console.warn('Error processing log for weekly chart:', err, log);
                }
            });
        }
        
        // Round values to 1 decimal place for cleaner display
        return dayTotals.map(value => Math.round(value * 10) / 10);
    }`;

// Replace the method
chartsJsContent = chartsJsContent.substring(0, methodBodyStart) + correctedMethod + chartsJsContent.substring(methodBodyEnd + 1);

// Write the updated file
console.log('Writing updated charts.js with fixed weekly distribution data processing...');
fs.writeFileSync(chartsJsPath, chartsJsContent, 'utf8');

console.log('Done! The weekly chart should now correctly display the data.');
console.log('Please restart your app and test the weekly distribution chart again.');

// Helper function to find the matching closing brace
function findMatchingBrace(content, openBracePos) {
    let depth = 1;
    for (let i = openBracePos + 1; i < content.length; i++) {
        if (content[i] === '{') {
            depth++;
        } else if (content[i] === '}') {
            depth--;
            if (depth === 0) {
                return i;
            }
        }
    }
    return -1;
}
