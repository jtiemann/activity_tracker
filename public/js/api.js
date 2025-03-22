// API requests handling
class ApiClient {
  constructor() {
    this.baseUrl = '/api';
  }

  // Get auth headers
  getHeaders() {
    const token = window.authManager.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Handle API response
  async handleResponse(response) {
    if (!response.ok) {
      // If unauthorized, clear auth and reload page
      if (response.status === 401) {
        window.authManager.clearAuth();
        window.location.reload();
        throw new Error('Session expired. Please log in again.');
      }
      
      // For other errors, parse error message
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }
    
    return await response.json();
  }

  // Generic request method
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders()
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication API calls
  
  // Login
  async login(username, password) {
    return await window.authManager.login(username, password);
  }
  
  // Logout
  logout() {
    window.authManager.logout();
  }
  
  // Check authentication status
  async checkAuth() {
    return await this.request('/auth/check-auth');
  }

  // Activity API calls
  
  // Get all activities for a user
  async getActivities() {
    const user = window.authManager.getUser();
    return await this.request(`/activities/${user.id}`);
  }
  
  // Get activity by ID
  async getActivity(activityId) {
    return await this.request(`/activities/details/${activityId}`);
  }
  
  // Create a new activity
  async createActivity(name, unit) {
    const user = window.authManager.getUser();
    return await this.request('/activities', 'POST', {
      userId: user.id,
      name,
      unit
    });
  }
  
  // Update an activity
  async updateActivity(activityId, name, unit, isPublic = false) {
    return await this.request(`/activities/${activityId}`, 'PUT', {
      name,
      unit,
      isPublic
    });
  }
  
  // Delete an activity
  async deleteActivity(activityId) {
    return await this.request(`/activities/${activityId}`, 'DELETE');
  }
  
  // Get activity categories
  async getActivityCategories() {
    const user = window.authManager.getUser();
    return await this.request(`/activities/categories/${user.id}`);
  }

  // Log API calls
  
  // Get logs for a specific activity
  async getActivityLogs(activityTypeId, page = 1, limit = 100) {
    const user = window.authManager.getUser();
    return await this.request(`/logs/${user.id}/${activityTypeId}?page=${page}&limit=${limit}`);
  }
  
  // Create a new log entry
  async createLog(activityTypeId, count, loggedAt, notes) {
    const user = window.authManager.getUser();
    return await this.request('/logs', 'POST', {
      activityTypeId,
      userId: user.id,
      count,
      loggedAt,
      notes
    });
  }
  
  // Update a log entry
  async updateLog(logId, count, loggedAt, notes) {
    return await this.request(`/logs/${logId}`, 'PUT', {
      count,
      loggedAt,
      notes
    });
  }
  
  // Delete a log entry
  async deleteLog(logId) {
    return await this.request(`/logs/${logId}`, 'DELETE');
  }
  
  // Get activity stats
  async getActivityStats(activityTypeId) {
    const user = window.authManager.getUser();
    return await this.request(`/logs/stats/${user.id}/${activityTypeId}`);
  }
  
  // Export activity logs to CSV
  getExportLogsUrl(activityTypeId = null) {
    const user = window.authManager.getUser();
    const token = window.authManager.getToken();
    const endpoint = activityTypeId ? 
      `/logs/export/${user.id}/${activityTypeId}` : 
      `/logs/export/${user.id}`;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = `${this.baseUrl}${endpoint}`;
    link.download = 'activity_logs.csv';
    
    // Add token to headers
    link.onclick = function(event) {
      event.preventDefault();
      
      // Use fetch to add authorization header
      fetch(this.href, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.blob())
      .then(blob => {
        // Create a new link with the blob data
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = 'activity_logs.csv';
        
        // Add link to document, click it, and remove it
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Release the blob URL
        URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        console.error('Error exporting logs:', err);
        alert('Error exporting logs. Please try again.');
      });
    };
    
    return link;
  }
  
  // Export activity logs to PDF
  getExportLogsPDFUrl(activityTypeId = null) {
    const user = window.authManager.getUser();
    const token = window.authManager.getToken();
    const endpoint = activityTypeId ? 
      `/logs/export-pdf/${user.id}/${activityTypeId}` : 
      `/logs/export-pdf/${user.id}`;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = `${this.baseUrl}${endpoint}`;
    link.download = 'activity_logs.pdf';
    
    // Add token to headers
    link.onclick = function(event) {
      event.preventDefault();
      
      // Use fetch to add authorization header
      fetch(this.href, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.blob())
      .then(blob => {
        // Create a new link with the blob data
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = 'activity_logs.pdf';
        
        // Add link to document, click it, and remove it
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Release the blob URL
        URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        console.error('Error exporting logs:', err);
        alert('Error exporting logs. Please try again.');
      });
    };
    
    return link;
  }

  // Goal API calls
  
  // Get all goals for a user
  async getGoals() {
    const user = window.authManager.getUser();
    return await this.request(`/goals/${user.id}`);
  }
  
  // Get goals for a specific activity
  async getActivityGoals(activityTypeId) {
    const user = window.authManager.getUser();
    return await this.request(`/goals/${user.id}/${activityTypeId}`);
  }
  
  // Get a goal by ID
  async getGoal(goalId) {
    return await this.request(`/goals/details/${goalId}`);
  }
  
  // Create a new goal
  async createGoal(activityTypeId, targetCount, periodType, startDate, endDate) {
    const user = window.authManager.getUser();
    return await this.request('/goals', 'POST', {
      userId: user.id,
      activityTypeId,
      targetCount,
      periodType,
      startDate,
      endDate
    });
  }
  
  // Update a goal
  async updateGoal(goalId, targetCount, periodType, startDate, endDate) {
    return await this.request(`/goals/${goalId}`, 'PUT', {
      targetCount,
      periodType,
      startDate,
      endDate
    });
  }
  
  // Delete a goal
  async deleteGoal(goalId) {
    return await this.request(`/goals/${goalId}`, 'DELETE');
  }
  
  // Get progress for a goal
  async getGoalProgress(goalId) {
    return await this.request(`/goals/progress/${goalId}`);
  }

  // Achievement API calls
  
  // Get all achievements for a user
  async getAchievements() {
    const user = window.authManager.getUser();
    return await this.request(`/achievements/${user.id}`);
  }
  
  // Get all achievement types
  async getAchievementTypes() {
    return await this.request('/achievements/types');
  }
  
  // Check for new achievements
  async checkAchievements(activityTypeId = null) {
    const user = window.authManager.getUser();
    const endpoint = activityTypeId ?
      `/achievements/check/${user.id}/${activityTypeId}` :
      `/achievements/check/${user.id}`;
    
    return await this.request(endpoint);
  }
  
  // Share an achievement
  async shareAchievement(achievementId, platform) {
    return await this.request(`/achievements/share/${achievementId}`, 'POST', {
      platform
    });
  }
}

// Initialize API client
window.apiClient = new ApiClient();
