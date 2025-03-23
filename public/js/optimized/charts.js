/**
 * Optimized charts implementation for Activity Tracker
 * Fixes issues with weekly chart rendering and provides better performance
 */
class ActivityCharts {
  /**
   * Create a new instance of ActivityCharts
   */
  constructor() {
    // Initialize chart containers
    this.charts = {};
    
    // Default data structure
    this.data = {
      logs: [],
      stats: null
    };
    
    // Chart color scheme
    this.chartColors = {
      primary: '#4361ee',
      light: '#b1c5ff',
      success: '#2ec4b6',
      danger: '#e63946',
      gridLines: '#ddd'
    };
    
    // Current activity being displayed
    this.currentActivity = null;
    
    // Chart initialized flag
    this.initialized = false;
    
    // Expose charts instance to window for easier debugging
    window.activityCharts = this;
  }

  /**
   * Update chart colors to match the current theme
   * @param {boolean} isDarkMode - Whether dark mode is enabled
   */
  updateChartTheme(isDarkMode) {
    // Update chart colors based on theme
    const textColor = isDarkMode ? '#e9ecef' : '#212529';
    const gridColor = isDarkMode ? '#495057' : '#ddd';
    
    // Update global chart.js configuration
    if (window.Chart) {
      Chart.defaults.color = textColor;
      Chart.defaults.borderColor = gridColor;
    }
    
    // Update chart colors
    this.chartColors.gridLines = gridColor;
    
    // Redraw all charts if they exist
    if (this.charts.progress) this.drawProgressChart();
    if (this.charts.weeklyDistribution) this.drawWeeklyDistributionChart();
  }
  
  /**
   * Initialize charts
   * @param {Object} currentActivity - Current activity object
   */
  init(currentActivity) {
    if (!currentActivity) return;
    
    // Store current activity
    this.currentActivity = currentActivity;
    
    // Setup chart containers in the DOM
    this.setupChartContainers();
    
    // Setup chart tab event listeners
    this.setupChartTabs();
    
    // Initialize charts if data exists
    if (this.data.logs && this.data.logs.length > 0) {
      this.drawProgressChart();
      this.drawWeeklyDistributionChart();
    }
    
    // Mark as initialized
    this.initialized = true;
  }
  
  /**
   * Set up chart containers in the DOM
   */
  setupChartContainers() {
    // Check if chart containers already exist
    if (document.getElementById('chart-tabs')) {
      return;
    }
    
    // Create chart tabs container
    const chartTabsContainer = document.createElement('div');
    chartTabsContainer.id = 'chart-tabs';
    chartTabsContainer.className = 'chart-tabs';
    chartTabsContainer.innerHTML = `
      <button class="chart-tab active" data-chart="progress" aria-selected="true" role="tab">Progress Over Time</button>
      <button class="chart-tab" data-chart="weekly" aria-selected="false" role="tab">Weekly Distribution</button>
    `;
    
    // Create charts container
    const chartsContainer = document.createElement('div');
    chartsContainer.id = 'charts-container';
    chartsContainer.innerHTML = `
      <div class="chart-container" id="progress-chart-container" role="tabpanel" aria-labelledby="progress-tab">
        <canvas id="progress-chart"></canvas>
      </div>
      <div class="chart-container" id="weekly-chart-container" style="display: none;" role="tabpanel" aria-labelledby="weekly-tab">
        <canvas id="weekly-chart"></canvas>
      </div>
    `;
    
    // Find the appropriate container to add charts to
    // Look for the card after the stats card
    const statsCard = document.querySelector('.card:nth-child(3)');
    if (!statsCard) {
      console.error('Stats card not found, cannot add charts');
      return;
    }
    
    // Create the charts card
    const chartsCard = document.createElement('div');
    chartsCard.className = 'card';
    
    // Add a title to the card
    const chartTitle = document.createElement('h2');
    chartTitle.className = 'card-title';
    chartTitle.textContent = 'Activity Analysis';
    
    // Assemble the charts card
    chartsCard.appendChild(chartTitle);
    chartsCard.appendChild(chartTabsContainer);
    chartsCard.appendChild(chartsContainer);
    
    // Insert the charts card after the stats card
    statsCard.insertAdjacentElement('afterend', chartsCard);
  }
  
  /**
   * Set up chart tab event listeners
   */
  setupChartTabs() {
    // Get all tab elements
    const tabs = document.querySelectorAll('.chart-tab');
    const chartContainers = document.querySelectorAll('.chart-container');
    
    // Create a global helper function for switching charts
    window.switchToChart = (chartType) => {
      // Hide all chart containers
      chartContainers.forEach(container => {
        container.style.display = 'none';
        container.setAttribute('aria-hidden', 'true');
      });
      
      // Show selected chart container
      const selected = document.getElementById(`${chartType}-chart-container`);
      if (selected) {
        selected.style.display = 'block';
        selected.setAttribute('aria-hidden', 'false');
      }
      
      // Update tab states
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      
      // Update selected tab
      const activeTab = document.querySelector(`.chart-tab[data-chart="${chartType}"]`);
      if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
      }
    };
    
    // Add click event listeners to each tab
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const chartType = tab.getAttribute('data-chart');
        window.switchToChart(chartType);
      });
    });
  }
  
  /**
   * Update data for charts
   * @param {Array} logs - Activity logs
   * @param {Object} stats - Activity statistics
   */
  updateData(logs, stats) {
    // Update data properties, preserving existing values if new ones aren't provided
    if (logs !== null && logs !== undefined) {
      this.data.logs = logs;
    }
    
    if (stats !== null && stats !== undefined) {
      this.data.stats = stats;
    }
    
    // Only redraw charts if there's data and the component is initialized
    if (this.initialized && this.data.logs && this.data.logs.length > 0) {
      // Debounce updates to prevent excessive redraws
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }
      
      this.updateTimeout = setTimeout(() => {
        this.drawProgressChart();
        this.drawWeeklyDistributionChart();
      }, 50);
    }
  }
  
  /**
   * Update current activity
   * @param {Object} activity - Current activity object
   */
  updateActivity(activity) {
    // Update current activity
    this.currentActivity = activity;
    
    // Redraw charts if they exist and component is initialized
    if (this.initialized) {
      if (this.charts.progress) this.drawProgressChart();
      if (this.charts.weeklyDistribution) this.drawWeeklyDistributionChart();
    }
  }
  
  /**
   * Draw progress over time chart
   */
  drawProgressChart() {
    // Safety check
    if (!this.currentActivity) return;
    
    // Prepare data for chart
    const chartData = this.prepareProgressChartData();
    
    // Get the canvas element
    const canvas = document.getElementById('progress-chart');
    if (!canvas) {
      console.error('Progress chart canvas not found');
      return;
    }
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
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
          pointRadius: 4,
          pointHoverRadius: 6
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
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0
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
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label = label.split(' (')[0] + ': ';
                }
                if (context.parsed.y !== null) {
                  const unit = this.currentActivity ? this.currentActivity.unit : 'units';
                  label += context.parsed.y + ' ' + unit;
                }
                return label;
              }
            }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        animation: {
          duration: 1000
        }
      }
    });
  }
  
  /**
   * Draw weekly distribution chart
   */
  drawWeeklyDistributionChart() {
    // Safety check
    if (!this.currentActivity) return;
    
    // Prepare data for chart
    const chartData = this.prepareWeeklyDistributionData();
    
    // Get the canvas element
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) {
      console.error('Weekly chart canvas not found');
      return;
    }
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
    // If chart already exists, destroy it
    if (this.charts.weeklyDistribution) {
      this.charts.weeklyDistribution.destroy();
    }
    
    // Create the chart with error handling
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
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 'flex',
            maxBarThickness: 50
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
                label: (context) => {
                  let label = context.dataset.label || '';
                  if (label) {
                    label = label.split(' (')[0] + ': ';
                  }
                  if (context.parsed.y !== null) {
                    const unit = this.currentActivity ? this.currentActivity.unit : 'units';
                    label += context.parsed.y + ' ' + unit;
                  }
                  return label;
                }
              }
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          animation: {
            duration: 1000
          }
        }
      });
    } catch (error) {
      console.error('Error creating weekly chart:', error);
    }
  }
  
  /**
   * Prepare data for progress chart
   * @returns {Object} Chart data with labels and values
   */
  prepareProgressChartData() {
    // Default empty data
    const defaultData = { labels: [], values: [] };
    
    // Return empty data if no logs
    if (!this.data.logs || !Array.isArray(this.data.logs) || this.data.logs.length === 0) {
      return defaultData;
    }
    
    try {
      // Sort logs by date
      const sortedLogs = [...this.data.logs].sort((a, b) => {
        const dateA = new Date(a.logged_at);
        const dateB = new Date(b.logged_at);
        return dateA - dateB;
      });
      
      // Extract dates and values
      const labels = [];
      const values = [];
      
      // Process each log entry
      sortedLogs.forEach(log => {
        try {
          // Attempt to parse date
          const date = new Date(log.logged_at);
          
          // Skip invalid dates
          if (isNaN(date.getTime())) {
            console.warn('Invalid date in log:', log);
            return;
          }
          
          // Format date for display
          const formattedDate = date.toLocaleDateString(undefined, { 
            month: 'short',
            day: 'numeric'
          });
          
          // Attempt to parse count as a number
          const count = parseFloat(log.count);
          
          // Skip invalid counts
          if (isNaN(count)) {
            console.warn('Invalid count in log:', log);
            return;
          }
          
          // Add to arrays
          labels.push(formattedDate);
          values.push(count);
        } catch (err) {
          console.warn('Error processing log for progress chart:', err);
        }
      });
      
      return { labels, values };
    } catch (error) {
      console.error('Error preparing progress chart data:', error);
      return defaultData;
    }
  }
  
  /**
   * Prepare data for weekly distribution chart
   * @returns {Array} Array of counts for each day of the week
   */
  prepareWeeklyDistributionData() {
    // Initialize day of week counts as numbers
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    
    // Return empty data if no logs
    if (!this.data.logs || !Array.isArray(this.data.logs) || this.data.logs.length === 0) {
      return dayTotals;
    }
    
    try {
      // Process each log entry
      this.data.logs.forEach(log => {
        try {
          // Validate the date
          if (!log.logged_at) {
            console.warn('Log missing logged_at date:', log);
            return;
          }
          
          // Parse the date
          const date = new Date(log.logged_at);
          
          // Skip invalid dates
          if (isNaN(date.getTime())) {
            console.warn('Invalid date in log:', log.logged_at);
            return;
          }
          
          // Get the day of week (0-6, where 0 is Sunday)
          const dayOfWeek = date.getDay();
          
          // Validate the count
          if (log.count === undefined || log.count === null) {
            console.warn('Log missing count:', log);
            return;
          }
          
          // Parse the count as a number
          const count = Number(log.count);
          
          // Skip invalid counts
          if (isNaN(count)) {
            console.warn('Invalid count in log:', log.count);
            return;
          }
          
          // Add to the correct day total
          // Use explicit Number conversion and += operator to ensure numeric addition
          dayTotals[dayOfWeek] += count;
        } catch (err) {
          console.error('Error processing log for weekly chart:', err);
        }
      });
      
      // Round values to 1 decimal place for display
      return dayTotals.map(value => Math.round(value * 10) / 10);
    } catch (error) {
      console.error('Error preparing weekly distribution data:', error);
      return dayTotals;
    }
  }
}

// Create and export a singleton instance
window.ActivityCharts = ActivityCharts;
