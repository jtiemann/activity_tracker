// Direct API implementation for goals that doesn't rely on authManager
window.directGoalsApi = {
  // Get current user from localStorage
  getCurrentUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        return null;
      }
    }
    return null;
  },
  
  // Get auth headers
  getHeaders() {
    const currentUser = this.getCurrentUser();
    return {
      'Content-Type': 'application/json',
      'Authorization': currentUser && currentUser.token ? `Bearer ${currentUser.token}` : ''
    };
  },
  
  // Generic request method
  async request(endpoint, method = 'GET', data = null) {
    const url = `/api${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders()
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      throw error;
    }
  },
  
  // Goals API methods
  async getActivityGoals(activityTypeId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    return await this.request(`/goals/${currentUser.user_id}/${activityTypeId}`);
  },
  
  async createGoal(activityTypeId, targetCount, periodType, startDate, endDate) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    return await this.request('/goals', 'POST', {
      userId: currentUser.user_id,
      activityTypeId,
      targetCount,
      periodType,
      startDate,
      endDate
    });
  },
  
  async updateGoal(goalId, targetCount, periodType, startDate, endDate) {
    return await this.request(`/goals/${goalId}`, 'PUT', {
      targetCount,
      periodType,
      startDate,
      endDate
    });
  },
  
  async deleteGoal(goalId) {
    return await this.request(`/goals/${goalId}`, 'DELETE');
  },
  
  async getGoalProgress(goalId) {
    return await this.request(`/goals/progress/${goalId}`);
  }
};
