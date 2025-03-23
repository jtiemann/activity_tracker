// Charts configuration and handling (DEBUG VERSION)
class ActivityCharts {
    constructor() {
        this.charts = {};
        this.data = {
            logs: [],
            stats: null
        };
        this.chartColors = {
            primary: '#4361ee',
            light: '#b1c5ff',
            success: '#2ec4b6',
            danger: '#e63946',
            gridLines: '#ddd'
        };
        this.currentActivity = null;
        
        // Add global debug object
        window.chartDebug = {
            showRawData: () => {
                console.log('CHART DEBUG - Raw Data:');
                console.log('Current Activity:', this.currentActivity);
                console.log('Log Data:', JSON.parse(JSON.stringify(this.data.logs)));
                console.log('Stats Data:', this.data.stats);
                return this.data.logs;
            },
            
            analyzeLogData: () => {
                console.log('CHART DEBUG - Log Analysis:');
                if (!this.data.logs || !Array.isArray(this.data.logs) || this.data.logs.length === 0) {
                    console.log('No log data available');
                    return;
                }
                
                console.log('Number of logs:', this.data.logs.length);
                
                // Sample log analysis
                const sampleLog = this.data.logs[0];
                console.log('Sample log structure:', sampleLog);
                
                // Check types of important properties
                if (sampleLog) {
                    console.log('count type:', typeof sampleLog.count);
                    console.log('count value:', sampleLog.count);
                    console.log('logged_at type:', typeof sampleLog.logged_at);
                    console.log('logged_at value:', sampleLog.logged_at);
                    
                    // Try parsing date
                    try {
                        const date = new Date(sampleLog.logged_at);
                        console.log('Parsed date:', date);
                        console.log('Day of week:', date.getDay());
                        console.log('Is valid date:', !isNaN(date.getTime()));
                    } catch (e) {
                        console.error('Error parsing date:', e);
                    }
                    
                    // Try parsing count
                    try {
                        const count = parseFloat(sampleLog.count);
                        console.log('Parsed count:', count);
                        console.log('Is valid number:', !isNaN(count));
                    } catch (e) {
                        console.error('Error parsing count:', e);
                    }
                }
            },
            
            testWeeklyData: () => {
                console.log('CHART DEBUG - Testing Weekly Data Preparation:');
                const result = this.prepareWeeklyDistributionData();
                console.log('Weekly data result:', result);
                return result;
            }
        };
    }

    // Update charts to match current theme
    updateChartTheme(isDarkMode) {
        console.log('Updating chart theme, isDarkMode:', isDarkMode);
        // Update chart colors based on theme
        const textColor = isDarkMode ? '#e9ecef' : '#212529';
        const gridColor = isDarkMode ? '#495057' : '#ddd';
        
        // Update global chart.js configuration
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;
        
        // Update chart colors
        this.chartColors.gridLines = gridColor;
        
        // Redraw all charts if they exist
        if (this.charts.progress) this.drawProgressChart();
        if (this.charts.weeklyDistribution) this.drawWeeklyDistributionChart();
    }
    
    // Initialize charts
    init(currentActivity) {
        console.log('Initializing charts for activity:', currentActivity);
        this.currentActivity = currentActivity;
        this.setupChartContainers();
        this.setupChartTabs();
        
        // Initialize charts if data exists
        if (this.data.logs && this.data.logs.length > 0) {
            console.log('Data exists, drawing charts');
            this.drawProgressChart();
            this.drawWeeklyDistributionChart();
        } else {
            console.log('No data available for charts');
        }
    }
    
    // Set up chart containers in the DOM
    setupChartContainers() {
        console.log('Setting up chart containers');
        // Check if chart containers already exist
        if (document.getElementById('chart-tabs')) {
            console.log('Chart containers already exist');
            return;
        }
        
        // Create chart tabs container
        const chartTabsContainer = document.createElement('div');
        chartTabsContainer.id = 'chart-tabs';
        chartTabsContainer.className = 'chart-tabs';
        chartTabsContainer.innerHTML = `
            <button class="chart-tab active" data-chart="progress">Progress Over Time</button>
            <button class="chart-tab" data-chart="weekly">Weekly Distribution</button>
        `;
        
        // Create charts container
        const chartsContainer = document.createElement('div');
        chartsContainer.id = 'charts-container';
        chartsContainer.innerHTML = `
            <div class="chart-container" id="progress-chart-container">
                <canvas id="progress-chart"></canvas>
            </div>
            <div class="chart-container" id="weekly-chart-container" style="display: none;">
                <canvas id="weekly-chart"></canvas>
            </div>
        `;
        
        // Insert into the DOM after stats card
        const statsCard = document.querySelector('.card:nth-child(3)');
        if (!statsCard) {
            console.error('Stats card not found');
            return;
        }
        
        const chartsCard = document.createElement('div');
        chartsCard.className = 'card';
        
        const chartTitle = document.createElement('h2');
        chartTitle.className = 'card-title';
        chartTitle.textContent = 'Activity Analysis';
        
        chartsCard.appendChild(chartTitle);
        chartsCard.appendChild(chartTabsContainer);
        chartsCard.appendChild(chartsContainer);
        
        statsCard.insertAdjacentElement('afterend', chartsCard);
        console.log('Chart containers added to DOM');
    }
    
    // Set up chart tab event listeners
    setupChartTabs() {
        console.log('Setting up chart tabs');
        const tabs = document.querySelectorAll('.chart-tab');
        const chartContainers = document.querySelectorAll('.chart-container');
        
        // Add debug function to switch tabs programmatically
        window.switchToChart = (chartType) => {
            console.log('Switching to chart:', chartType);
            // Hide all chart containers
            chartContainers.forEach(container => {
                container.style.display = 'none';
            });
            
            // Show selected chart container
            document.getElementById(`${chartType}-chart-container`).style.display = 'block';
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector(`.chart-tab[data-chart="${chartType}"]`).classList.add('active');
        };
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                console.log('Tab clicked:', tab.getAttribute('data-chart'));
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Hide all chart containers
                chartContainers.forEach(container => {
                    container.style.display = 'none';
                });
                
                // Show selected chart container
                const chartType = tab.getAttribute('data-chart');
                document.getElementById(`${chartType}-chart-container`).style.display = 'block';
            });
        });
    }
    
    // Update data for charts
    updateData(logs, stats) {
        console.log('Updating chart data');
        console.log('Logs received:', logs ? logs.length : 'none');
        console.log('Stats received:', stats);
        
        this.data.logs = logs || this.data.logs;
        this.data.stats = stats || this.data.stats;
        
        if (this.data.logs && this.data.logs.length > 0) {
            console.log('Data available, redrawing charts');
            this.drawProgressChart();
            this.drawWeeklyDistributionChart();
        } else {
            console.log('No logs available for charts');
        }
    }
    
    // Update current activity
    updateActivity(activity) {
        console.log('Updating current activity:', activity);
        this.currentActivity = activity;
        
        // Redraw charts if they exist
        if (this.charts.progress) this.drawProgressChart();
        if (this.charts.weeklyDistribution) this.drawWeeklyDistributionChart();
    }
    
    // Draw progress over time chart
    drawProgressChart() {
        console.log('Drawing progress chart');
        // Prepare data for chart
        const chartData = this.prepareProgressChartData();
        console.log('Progress chart data:', chartData);
        
        // Get the canvas element
        const canvas = document.getElementById('progress-chart');
        if (!canvas) {
            console.error('Progress chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // If chart already exists, destroy it
        if (this.charts.progress) {
            console.log('Destroying existing progress chart');
            this.charts.progress.destroy();
        }
        
        // Create the chart
        console.log('Creating new progress chart');
        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: this.currentActivity ? `${this.currentActivity.name} (${this.currentActivity.unit})` : 'Activity',
                    data: chartData.values,
                    backgroundColor: this.chartColors.light,
                    borderColor: this.chartColors.primary,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: 'start',
                    pointBackgroundColor: this.chartColors.primary,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            color: this.chartColors.gridLines,
                            borderColor: this.chartColors.gridLines,
                            tickColor: this.chartColors.gridLines
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.chartColors.gridLines,
                            borderColor: this.chartColors.gridLines,
                            tickColor: this.chartColors.gridLines
                        },
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label = label.split(' (')[0] + ': ';
                                }
                                if (context.parsed.y !== null) {
                                    const unit = this.currentActivity ? this.currentActivity.unit : 'units';
                                    label += context.parsed.y + ' ' + unit;
                                }
                                return label;
                            }.bind(this)
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }
    
    // Draw weekly distribution chart
    drawWeeklyDistributionChart() {
        console.log('Drawing weekly distribution chart');
        // Prepare data for chart
        const chartData = this.prepareWeeklyDistributionData();
        console.log('Weekly chart data:', JSON.stringify(chartData));
        
        // Get the canvas element
        const canvas = document.getElementById('weekly-chart');
        if (!canvas) {
            console.error('Weekly chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // If chart already exists, destroy it
        if (this.charts.weeklyDistribution) {
            console.log('Destroying existing weekly chart');
            this.charts.weeklyDistribution.destroy();
        }
        
        // Create the chart
        console.log('Creating new weekly chart');
        try {
            this.charts.weeklyDistribution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    datasets: [{
                        label: this.currentActivity ? `${this.currentActivity.name} (${this.currentActivity.unit})` : 'Activity',
                        data: chartData,
                        backgroundColor: this.chartColors.primary,
                        borderColor: this.chartColors.primary,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: {
                                color: this.chartColors.gridLines,
                                borderColor: this.chartColors.gridLines,
                                tickColor: this.chartColors.gridLines
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: this.chartColors.gridLines,
                                borderColor: this.chartColors.gridLines,
                                tickColor: this.chartColors.gridLines
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label = label.split(' (')[0] + ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        const unit = this.currentActivity ? this.currentActivity.unit : 'units';
                                        label += context.parsed.y + ' ' + unit;
                                    }
                                    return label;
                                }.bind(this)
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
            console.log('Weekly chart created successfully');
        } catch (error) {
            console.error('Error creating weekly chart:', error);
        }
    }
    
    // Prepare data for progress chart
    prepareProgressChartData() {
        console.log('Preparing progress chart data');
        // Return empty data if no logs
        if (!this.data.logs || !Array.isArray(this.data.logs) || this.data.logs.length === 0) {
            console.log('No logs available for progress chart');
            return { labels: [], values: [] };
        }
        
        try {
            // Sort logs by date
            const sortedLogs = [...this.data.logs].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
            
            // Extract dates and values
            const labels = [];
            const values = [];
            
            sortedLogs.forEach(log => {
                try {
                    const date = new Date(log.logged_at);
                    if (!isNaN(date.getTime())) {
                        labels.push(date.toLocaleDateString());
                        
                        // Ensure count is treated as a number
                        const count = parseFloat(log.count);
                        values.push(isNaN(count) ? 0 : count);
                    } else {
                        console.warn('Invalid date in log:', log);
                    }
                } catch (err) {
                    console.warn('Error processing log for progress chart:', err);
                }
            });
            
            return { labels, values };
        } catch (error) {
            console.error('Error preparing progress chart data:', error);
            return { labels: [], values: [] };
        }
    }
    
    // Prepare data for weekly distribution chart - COMPLETELY REWRITTEN
    prepareWeeklyDistributionData() {
        console.log('Preparing weekly distribution data');
        
        // Initialize day of week counts as numbers
        const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
        
        // Return empty data if no logs
        if (!this.data.logs || !Array.isArray(this.data.logs) || this.data.logs.length === 0) {
            console.warn('No logs available for weekly distribution chart');
            return dayTotals;
        }
        
        try {
            console.log('Processing', this.data.logs.length, 'logs');
            
            // Explicit loop for better error tracing
            for (let i = 0; i < this.data.logs.length; i++) {
                const log = this.data.logs[i];
                
                try {
                    // Validate the date
                    const dateStr = log.logged_at;
                    if (!dateStr) {
                        console.warn('Log missing logged_at date:', log);
                        continue;
                    }
                    
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) {
                        console.warn('Invalid date in log:', dateStr, log);
                        continue;
                    }
                    
                    // Get the day of week (0-6, where 0 is Sunday)
                    const dayOfWeek = date.getDay();
                    
                    // Validate and convert the count to a number
                    let count = 0;
                    if (log.count !== undefined && log.count !== null) {
                        count = Number(log.count);
                        if (isNaN(count)) {
                            console.warn('Invalid count in log:', log.count, log);
                            continue;
                        }
                    } else {
                        console.warn('Log missing count:', log);
                        continue;
                    }
                    
                    // Add to the correct day total (using += for numerical addition)
                    dayTotals[dayOfWeek] += count;
                    
                    // Log successful processing
                    console.log(`Log ${i+1}: Day ${dayOfWeek}, Count ${count}, Running Total ${dayTotals[dayOfWeek]}`);
                } catch (err) {
                    console.error(`Error processing log ${i+1}:`, err, log);
                }
            }
            
            // Round values to 1 decimal place for display
            for (let i = 0; i < dayTotals.length; i++) {
                dayTotals[i] = Math.round(dayTotals[i] * 10) / 10;
            }
            
            console.log('Final day totals:', JSON.stringify(dayTotals));
            return dayTotals;
        } catch (error) {
            console.error('Error preparing weekly distribution data:', error);
            return [0, 0, 0, 0, 0, 0, 0];
        }
    }
}
