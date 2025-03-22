// Chart diagnostic script for debugging weekly distribution graph issues
// This script will add debug logging to the charts.js file

const fs = require('fs');
const path = require('path');

// Define the app directory
const appDir = 'C:\\Users\\jonti\\Documents\\ActivityTrackerApp';
const chartsJsPath = path.join(appDir, 'public', 'js', 'charts.js');

console.log(`Reading ${chartsJsPath}...`);
let chartsJsContent = fs.readFileSync(chartsJsPath, 'utf8');

// Add debug logging to prepareWeeklyDistributionData method
const prepareWeeklyDistributionDataStart = chartsJsContent.indexOf('prepareWeeklyDistributionData()');
if (prepareWeeklyDistributionDataStart === -1) {
    console.error('Could not find prepareWeeklyDistributionData method');
    process.exit(1);
}

// Find the method body
const methodBodyStart = chartsJsContent.indexOf('{', prepareWeeklyDistributionDataStart);
const debugLogging = `{
        console.log('Preparing weekly distribution data');
        console.log('Current activity:', this.currentActivity);
        console.log('Available logs:', this.data.logs);
        
        // Check if we have logs
        if (!this.data.logs || this.data.logs.length === 0) {
            console.warn('No logs available for weekly distribution chart');
            return [0, 0, 0, 0, 0, 0, 0];
        }
`;

// Replace the method opening with our debug version
chartsJsContent = chartsJsContent.slice(0, methodBodyStart) + debugLogging + chartsJsContent.slice(methodBodyStart + 1);

// Add logging to the chart creation in drawWeeklyDistributionChart
const drawWeeklyDistributionChartStart = chartsJsContent.indexOf('drawWeeklyDistributionChart()');
if (drawWeeklyDistributionChartStart === -1) {
    console.error('Could not find drawWeeklyDistributionChart method');
    process.exit(1);
}

// Find the part before chart creation
const chartCreationStart = chartsJsContent.indexOf('this.charts.weeklyDistribution = new Chart', drawWeeklyDistributionChartStart);
if (chartCreationStart === -1) {
    console.error('Could not find chart creation in drawWeeklyDistributionChart');
    process.exit(1);
}

// Add debug logging before chart creation
const chartDebugLogging = `
        console.log('Creating weekly distribution chart');
        console.log('Chart data:', chartData);
        
        // Check if canvas exists
        const canvas = document.getElementById('weekly-chart');
        if (!canvas) {
            console.error('Weekly chart canvas element not found!');
            return;
        }
        console.log('Canvas element found:', canvas);
        
`;

// Insert the debug logging
chartsJsContent = chartsJsContent.slice(0, chartCreationStart) + chartDebugLogging + chartsJsContent.slice(chartCreationStart);

// Add logging to updateData method
const updateDataStart = chartsJsContent.indexOf('updateData(logs, stats)');
if (updateDataStart === -1) {
    console.error('Could not find updateData method');
    process.exit(1);
}

// Find the method body
const updateDataBodyStart = chartsJsContent.indexOf('{', updateDataStart);
const updateDataLogging = `{
        console.log('Updating chart data');
        console.log('Received logs:', logs ? logs.length : 'none');
        console.log('Current activity:', this.currentActivity);
        
`;

// Replace the method opening with our debug version
chartsJsContent = chartsJsContent.slice(0, updateDataBodyStart) + updateDataLogging + chartsJsContent.slice(updateDataBodyStart + 1);

// Add additional check to make chart display always visible when debugging
const setupChartTabsStart = chartsJsContent.indexOf('setupChartTabs()');
if (setupChartTabsStart !== -1) {
    const tabsEventListenerStart = chartsJsContent.indexOf('tab.addEventListener(\'click\'', setupChartTabsStart);
    if (tabsEventListenerStart !== -1) {
        // Add debug option to make weekly chart always visible
        const debugOption = `
        // DEBUG: Force weekly chart to be visible for testing
        window.showWeeklyChart = function() {
            document.getElementById('weekly-chart-container').style.display = 'block';
            document.getElementById('progress-chart-container').style.display = 'none';
            const tabs = document.querySelectorAll('.chart-tab');
            tabs.forEach(t => t.classList.remove('active'));
            const weeklyTab = document.querySelector('.chart-tab[data-chart="weekly"]');
            if (weeklyTab) weeklyTab.classList.add('active');
            console.log('Weekly chart container now visible');
        };
        
        `;
        chartsJsContent = chartsJsContent.slice(0, tabsEventListenerStart) + debugOption + chartsJsContent.slice(tabsEventListenerStart);
    }
}

// Add logs to prepareProgressChartData method too
const prepareProgressChartDataStart = chartsJsContent.indexOf('prepareProgressChartData()');
if (prepareProgressChartDataStart !== -1) {
    const progressMethodBodyStart = chartsJsContent.indexOf('{', prepareProgressChartDataStart);
    const progressDebugLogging = `{
        console.log('Preparing progress chart data');
        console.log('Current activity:', this.currentActivity ? this.currentActivity.name : 'none');
        console.log('Available logs:', this.data.logs ? this.data.logs.length : 0);
        
    `;
    chartsJsContent = chartsJsContent.slice(0, progressMethodBodyStart) + progressDebugLogging + chartsJsContent.slice(progressMethodBodyStart + 1);
}

// Write the updated file
console.log('Writing updated charts.js with debug logging...');
fs.writeFileSync(chartsJsPath, chartsJsContent, 'utf8');

// Create an HTML console helper
const consoleHelperPath = path.join(appDir, 'public', 'debug-helper.html');
const consoleHelperContent = `<!DOCTYPE html>
<html>
<head>
    <title>Chart Debug Helper</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #4361ee; }
        button { 
            background-color: #4361ee; 
            color: white; 
            border: none; 
            padding: 10px 15px; 
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background-color: #3a56d4; }
        pre { 
            background-color: #f5f5f5; 
            padding: 15px; 
            border-radius: 5px;
            overflow-x: auto;
        }
        .instructions {
            background-color: #fffbea;
            border-left: 4px solid #f0b429;
            padding: 10px 15px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Chart Debug Helper</h1>
        
        <div class="instructions">
            <p>This page provides tools to debug weekly distribution chart issues.</p>
            <p>Instructions:</p>
            <ol>
                <li>Open the main Activity Tracker app in another tab</li>
                <li>Login and select the "Pull-ups" activity</li>
                <li>Open your browser's developer console (F12)</li>
                <li>Run the diagnostic commands below</li>
                <li>Check the console output for errors or issues</li>
            </ol>
        </div>
        
        <h2>Diagnostic Commands</h2>
        <button onclick="copyToClipboard('window.showWeeklyChart()')">Copy Show Weekly Chart Command</button>
        <button onclick="copyToClipboard('console.log(window.activityCharts.data)')">Copy Log Chart Data Command</button>
        <button onclick="copyToClipboard('console.log(window.activityCharts.charts)')">Copy Log Chart Objects Command</button>
        
        <h2>Debug Steps</h2>
        <pre>
1. Select "Pull-ups" activity in the app
2. Check if any logs appear in the history panel
3. Open console (F12) and paste: window.showWeeklyChart()
4. Check for any errors or warning messages
5. Paste: console.log(window.activityCharts.data)
6. Check if logs array has any data
7. Check if the logs have valid logged_at dates
        </pre>
        
        <h2>Common Issues</h2>
        <ul>
            <li>No log data available for "Pull-ups" activity</li>
            <li>Invalid date formats in log entries</li>
            <li>Chart canvas element not properly initialized</li>
            <li>Chart library not loaded correctly</li>
        </ul>
    </div>
    
    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Command copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
    </script>
</body>
</html>`;

fs.writeFileSync(consoleHelperPath, consoleHelperContent, 'utf8');

console.log(`Created debug helper page at ${consoleHelperPath}`);
console.log('==================================================');
console.log('INSTRUCTIONS:');
console.log('1. Restart your Activity Tracker app');
console.log('2. Login and select "Pull-ups" activity');
console.log('3. Open browser console (F12 or right-click > Inspect > Console)');
console.log('4. Check the console for debug information');
console.log('5. Type "window.showWeeklyChart()" in the console to force the weekly chart to be visible');
console.log('6. For more help, open http://localhost:3001/debug-helper.html');
console.log('==================================================');
