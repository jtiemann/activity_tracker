// Charts configuration and handling
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
    }

    // Update charts to match current theme
    updateChartTheme(isDarkMode) {
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
        this.currentActivity = currentActivity;
        this.setupChartContainers();
        this.setupChartTabs();
        
        // Initialize charts if data exists
        if (this.data.logs.length > 0) {
            this.drawProgressChart();
            this.drawWeeklyDistributionChart();
        }
    }
    
    // Set up chart containers in the DOM
    setupChartContainers() {
        // Check if chart containers already exist
        if (document.getElementById('chart-tabs')) return;
        
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
        const chartsCard = document.createElement('div');
        chartsCard.className = 'card';
        
        const chartTitle = document.createElement('h2');
        chartTitle.className = 'card-title';
        chartTitle.textContent = 'Activity Analysis';
        
        chartsCard.appendChild(chartTitle);
        chartsCard.appendChild(chartTabsContainer);
        chartsCard.appendChild(chartsContainer);
        
        statsCard.insertAdjacentElement('afterend', chartsCard);
    }
    
    // Set up chart tab event listeners
    setupChartTabs() {
        const tabs = document.querySelectorAll('.chart-tab');
        const chartContainers = document.querySelectorAll('.chart-container');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
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
        this.data.logs = logs || this.data.logs;
        this.data.stats = stats || this.data.stats;
        
        if (this.data.logs.length > 0) {
            this.drawProgressChart();
            this.drawWeeklyDistributionChart();
        }
    }
    
    // Update current activity
    updateActivity(activity) {
        this.currentActivity = activity;
        
        // Redraw charts if they exist
        if (this.charts.progress) this.drawProgressChart();
        if (this.charts.weeklyDistribution) this.drawWeeklyDistributionChart();
    }
    
    // Draw progress over time chart
    drawProgressChart() {
        // Prepare data for chart
        const chartData = this.prepareProgressChartData();
        
        // Get the canvas element
        const ctx = document.getElementById('progress-chart').getContext('2d');
        
        // If chart already exists, destroy it
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }
        
        // Create the chart
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
        // Prepare data for chart
        const chartData = this.prepareWeeklyDistributionData();
        
        // Get the canvas element
        const ctx = document.getElementById('weekly-chart').getContext('2d');
        
        // If chart already exists, destroy it
        if (this.charts.weeklyDistribution) {
            this.charts.weeklyDistribution.destroy();
        }
        
        // Create the chart
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
    }
    
    // Prepare data for progress chart
    prepareProgressChartData() {
        // Return empty data if no logs
        if (!this.data.logs.length) {
            return { labels: [], values: [] };
        }
        
        // Sort logs by date
        const sortedLogs = [...this.data.logs].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
        
        // Extract dates and values
        const labels = sortedLogs.map(log => {
            const date = new Date(log.logged_at);
            return date.toLocaleDateString();
        });
        
        const values = sortedLogs.map(log => log.count);
        
        return { labels, values };
    }
    
    // Prepare data for weekly distribution chart
    prepareWeeklyDistributionData() {
        // Initialize day of week counts
        const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
        
        // Calculate totals for each day of the week
        this.data.logs.forEach(log => {
            const date = new Date(log.logged_at);
            const dayOfWeek = date.getDay(); // 0-6 where 0 is Sunday
            dayTotals[dayOfWeek] += log.count;
        });
        
        return dayTotals;
    }
}
