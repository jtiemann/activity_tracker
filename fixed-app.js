// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to now
    const now = new Date();
    const dateTimeString = now.toISOString().slice(0, 16);
    document.getElementById('date').value = dateTimeString;
    
    // DOM Elements
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    
    const activityTypeSelect = document.getElementById('activity-type');
    const newActivityBtn = document.getElementById('new-activity-btn');
    const createActivityForm = document.getElementById('create-activity-form');
    const newActivityNameInput = document.getElementById('new-activity-name');
    const newActivityUnitInput = document.getElementById('new-activity-unit');
    const saveActivityBtn = document.getElementById('save-activity-btn');
    const countInput = document.getElementById('count');
    const unitInput = document.getElementById('unit');
    const unitLabel = document.getElementById('unit-label');
    const notesInput = document.getElementById('notes');
    const dateInput = document.getElementById('date');
    const logButton = document.getElementById('log-button');
    const logContainer = document.getElementById('log-container');
    const emptyState = document.getElementById('empty-state');
    const appTitle = document.getElementById('app-title');
    
    // Stats Elements
    const todayCount = document.getElementById('today-count');
    const weekCount = document.getElementById('week-count');
    const monthCount = document.getElementById('month-count');
    const yearCount = document.getElementById('year-count');
    const todayUnit = document.getElementById('today-unit');
    const weekUnit = document.getElementById('week-unit');
    const monthUnit = document.getElementById('month-unit');
    const yearUnit = document.getElementById('year-unit');
    
    // User data
    let currentUser = null;
    let activities = [];
    let currentActivity = null;
    
    // Initialize theme manager
    window.themeManager = new ThemeManager();
    
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showApp();
        loadActivities();
    }
    
    // Event listeners
    loginBtn.addEventListener('click', login);
    logoutBtn.addEventListener('click', logout);
    
    // Add event listener for theme toggle
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'theme-toggle' || 
            (e.target.parentElement && e.target.parentElement.id === 'theme-toggle')) {
            // Toggle theme and update charts
            const isDarkMode = window.themeManager.toggleTheme();
            if (window.activityCharts) {
                window.activityCharts.updateChartTheme(isDarkMode);
            }
        }
    });
    
    activityTypeSelect.addEventListener('change', function() {
        const selectedId = parseInt(this.value);
        currentActivity = activities.find(a => a.activity_type_id === selectedId);
        if (currentActivity) {
            updateUIForActivity(currentActivity);
            // Load previous entry as default
            loadPreviousEntry(currentActivity.activity_type_id, currentUser.user_id);
            
            // Update goals for current activity
            if (window.goalsManager) {
                window.goalsManager.init(currentActivity);
            }
            loadLogs();
            loadStats();
            
            // Update chart activity if charts initialized
            if (window.activityCharts) {
                window.activityCharts.updateActivity(currentActivity);
            }
        }
    });
    
    newActivityBtn.addEventListener('click', function() {
        createActivityForm.style.display = 'block';
        newActivityNameInput.focus();
    });
    
    saveActivityBtn.addEventListener('click', createActivity);
    
    logButton.addEventListener('click', logActivity);
    
    // Login function
    async function login() {
        const usernameValue = username.value.trim();
        const passwordValue = password.value;
        
        if (!usernameValue || !passwordValue) {
            loginError.textContent = 'Please enter both username and password';
            return;
        }
        
        // Show loading state
        loginBtn.innerHTML = '<span class="loader"></span> Logging in...';
        loginBtn.disabled = true;
        
        try {
            // Updated API endpoint to match the server route
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: usernameValue,
                    password: passwordValue
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                loginError.textContent = errorData.error || 'Login failed';
                // Reset login button
                loginBtn.innerHTML = 'Login';
                loginBtn.disabled = false;
                return;
            }
            
            currentUser = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            // Update auth manager 
            if (window.authManager) {
                window.authManager.setAuth({
                    id: currentUser.user_id,
                    username: currentUser.username,
                    email: currentUser.email
                }, currentUser.token);
            }
            
            showApp();
            loadActivities();
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'An error occurred. Please try again.';
            // Reset login button
            loginBtn.innerHTML = 'Login';
            loginBtn.disabled = false;
        }
    }
    
    // Logout function
    function logout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLogin();
    }
    
    // Show app after login
    function showApp() {
        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userNameDisplay.textContent = currentUser.username;
        
        // Initialize mobile navigation after login
        if (!window.mobileNav) {
            window.mobileNav = new MobileNavigation();
        }
    }
    
    // Show login after logout
    function showLogin() {
        loginScreen.classList.remove('hidden');
        appContainer.classList.add('hidden');
        username.value = '';
        password.value = '';
        loginError.textContent = '';
        loginBtn.innerHTML = 'Login';
        loginBtn.disabled = false;
    }
    
    // Load activities for current user
    async function loadActivities() {
        try {
            const response = await fetch(`/api/activities/${currentUser.user_id}`, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load activities');
            
            activities = await response.json();
            
            // Populate activity dropdown
            populateActivityDropdown();
            
            if (activities.length > 0) {
                currentActivity = activities[0];
                updateUIForActivity(currentActivity);
                loadLogs();
                loadStats();
                
                // Initialize goals for the first activity
                if (window.goalsManager && currentActivity) {
                    window.goalsManager.init(currentActivity);
                }
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }
    
    // Populate activity dropdown
    function populateActivityDropdown() {
        // Clear dropdown
        activityTypeSelect.innerHTML = '';
        
        // Add options
        activities.forEach(activity => {
            const option = document.createElement('option');
            option.value = activity.activity_type_id;
            option.textContent = activity.name;
            activityTypeSelect.appendChild(option);
        });
    }
    
    // Create a new activity
    async function createActivity() {
        const name = newActivityNameInput.value.trim();
        const unit = newActivityUnitInput.value.trim();
        
        if (!name) {
            alert('Please enter an activity name');
            return;
        }
        
        if (!unit) {
            alert('Please enter a unit');
            return;
        }
        
        // Show loading state
        saveActivityBtn.innerHTML = '<span class="loader"></span>';
        saveActivityBtn.disabled = true;
        
        try {
            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({
                    userId: currentUser.user_id,
                    name: name,
                    unit: unit
                }),
            });
            
            if (!response.ok) throw new Error('Failed to create activity');
            
            const newActivity = await response.json();
            activities.push(newActivity);
            
            // Update dropdown and select new activity
            populateActivityDropdown();
            activityTypeSelect.value = newActivity.activity_type_id;
            currentActivity = newActivity;
            updateUIForActivity(currentActivity);
            
            // Hide form and reset
            createActivityForm.style.display = 'none';
            newActivityNameInput.value = '';
            newActivityUnitInput.value = '';
            
            // Reload logs and stats
            loadLogs();
            loadStats();
            
            // Initialize goals for the new activity
            if (window.goalsManager && currentActivity) {
                window.goalsManager.init(currentActivity);
            }
            
            // Reset button
            saveActivityBtn.innerHTML = 'Save';
            saveActivityBtn.disabled = false;
        } catch (error) {
            console.error('Error creating activity:', error);
            alert('Failed to create activity. Please try again.');
            
            // Reset button
            saveActivityBtn.innerHTML = 'Save';
            saveActivityBtn.disabled = false;
        }
    }
    
    // Update UI for selected activity
    function updateUIForActivity(activity) {
        // Update app title
        appTitle.textContent = `${activity.name} Tracker`;
        
        // Update unit input and label
        unitInput.value = activity.unit;
        unitLabel.textContent = `Units (${activity.unit})`;
        
        // Update stats units
        todayUnit.textContent = activity.unit;
        weekUnit.textContent = activity.unit;
        monthUnit.textContent = activity.unit;
        yearUnit.textContent = activity.unit;
    }
    // Load previous entry for an activity
    async function loadPreviousEntry(activityId, userId) {
        try {
            const response = await fetch(`/api/logs/${userId}/${activityId}?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load previous log');
            
            const logs = await response.json();
            
            // If there's at least one log entry, use its count as the default
            if (logs && logs.length > 0) {
                countInput.value = logs[0].count;
                console.log(`Set default count to ${logs[0].count} from previous log`);
            }
        } catch (error) {
            console.error('Error loading previous entry:', error);
            // Don't change the input if there's an error
        }
    }
    
    
    // Log an activity
    async function logActivity() {
        if (!currentActivity) {
            alert('Please select an activity first');
            return;
        }
        
        const count = parseFloat(countInput.value);
        const unit = unitInput.value.trim();
        const notes = notesInput.value.trim();
        const timestamp = new Date(dateInput.value).toISOString();
        
        if (isNaN(count) || count <= 0) {
            alert('Please enter a valid count');
            return;
        }
        
        if (!unit) {
            alert('Please enter a unit');
            return;
        }
        
        if (isNaN(Date.parse(timestamp))) {
            alert('Please select a valid date and time');
            return;
        }
        
        // Show loading state
        logButton.innerHTML = '<span class="loader"></span> Logging...';
        logButton.disabled = true;
        
        try {
            const response = await fetch('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({
                    activityTypeId: currentActivity.activity_type_id,
                    userId: currentUser.user_id,
                    count: count,
                    loggedAt: timestamp,
                    notes: notes
                }),
            });
            
            if (!response.ok) throw new Error('Failed to log activity');
            
            // Update UI
            loadLogs();
            loadStats();
            
            // Reset form
            countInput.value = 10;
            notesInput.value = '';
            dateInput.value = new Date().toISOString().slice(0, 16);
            
            // Update activity unit if changed
            if (unit !== currentActivity.unit) {
                currentActivity.unit = unit;
                updateUIForActivity(currentActivity);
            }
            
            // Reset button
            logButton.innerHTML = 'Log Activity';
            logButton.disabled = false;
        } catch (error) {
            console.error('Error logging activity:', error);
            alert('Failed to log activity. Please try again.');
            
            // Reset button
            logButton.innerHTML = 'Log Activity';
            logButton.disabled = false;
        }
    }
    
    // Load logs for current activity
    async function loadLogs() {
        if (!currentActivity) return;
        
        try {
            const response = await fetch(`/api/logs/${currentUser.user_id}/${currentActivity.activity_type_id}`, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load logs');
            
            const logs = await response.json();
            
            // Clear log container except empty state
            Array.from(logContainer.children).forEach(child => {
                if (child !== emptyState) {
                    logContainer.removeChild(child);
                }
            });
            
            // Show/hide empty state
            if (logs.length === 0) {
                emptyState.style.display = 'block';
                
                // Initialize chart with empty data if charts exist
                if (window.activityCharts) {
                    window.activityCharts.updateData([], null);
                }
                
                return;
            } else {
                emptyState.style.display = 'none';
            }
            
            // Render each log
            logs.forEach(log => {
                const logItem = document.createElement('div');
                logItem.className = 'log-item';
                
                const date = new Date(log.logged_at);
                const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                
                const notesText = log.notes ? `<div class="log-notes">${log.notes}</div>` : '';
                
                logItem.innerHTML = `
                    <div>
                        <div class="log-date">${formattedDate}</div>
                        <div class="log-reps">${log.count} ${currentActivity.unit}</div>
                        ${notesText}
                    </div>
                    <div class="log-actions">
                        <button class="btn-sm btn-danger" data-id="${log.log_id}" aria-label="Delete this log">Delete</button>
                    </div>
                `;
                
                logContainer.appendChild(logItem);
                
                // Add delete event listener
                const deleteButton = logItem.querySelector('button[data-id]');
                deleteButton.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    deleteLog(id);
                });
            });
            
            // Initialize or update charts
            if (window.Chart) {
                if (!window.activityCharts) {
                    window.activityCharts = new ActivityCharts();
                    window.activityCharts.init(currentActivity);
                }
                window.activityCharts.updateData(logs, null);
            }
            
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    }
    
    // Delete a log
    async function deleteLog(logId) {
        try {
            const response = await fetch(`/api/logs/${logId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete log');
            
            // Reload logs and stats
            loadLogs();
            loadStats();
        } catch (error) {
            console.error('Error deleting log:', error);
            alert('Failed to delete log. Please try again.');
        }
    }
    
    // Load stats for current activity
    async function loadStats() {
        if (!currentActivity) return;
        
        try {
            const response = await fetch(`/api/logs/stats/${currentUser.user_id}/${currentActivity.activity_type_id}`, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load stats');
            
            const stats = await response.json();
            
            todayCount.textContent = stats.today;
            weekCount.textContent = stats.week;
            monthCount.textContent = stats.month;
            yearCount.textContent = stats.year;
            
            // Update chart stats if charts exist
            if (window.activityCharts) {
                window.activityCharts.updateData(null, stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    // Support keyboard navigation for the login form
    username.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            password.focus();
        }
    });
    
    password.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});