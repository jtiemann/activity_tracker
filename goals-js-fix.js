// Goals handling
class GoalsManager {
  constructor() {
    this.goals = [];
    this.currentActivity = null;
    this.logDebug = true; // Set to true to enable debugging logs
  }

  // Debug log helper
  debug(...args) {
    if (this.logDebug) {
      console.log('[GoalsManager]', ...args);
    }
  }

  // Initialize goals
  async init(activity) {
    this.debug('Initializing with activity:', activity);
    this.currentActivity = activity;
    await this.loadGoals();
    this.setupEventListeners();
    this.renderGoals();
  }

  // Load goals for current activity
  async loadGoals() {
    try {
      if (!this.currentActivity) {
        this.debug('No current activity set, skipping goal loading');
        return;
      }
      
      this.debug('Loading goals for activity ID:', this.currentActivity.activity_type_id);
      
      if (!window.directGoalsApi) {
        this.debug('directGoalsApi not available, trying apiClient');
        if (window.apiClient) {
          this.goals = await window.apiClient.getActivityGoals(this.currentActivity.activity_type_id);
        } else {
          throw new Error('No API client available for loading goals');
        }
      } else {
        this.goals = await window.directGoalsApi.getActivityGoals(this.currentActivity.activity_type_id);
      }
      
      // Ensure goals is always an array
      if (!Array.isArray(this.goals)) {
        this.debug('Goals is not an array, setting to empty array');
        this.goals = [];
      }
      
      this.debug('Loaded goals:', this.goals);
    } catch (error) {
      console.error('Error loading goals:', error);
      this.goals = []; // Ensure goals is set to an empty array on error
    }
  }

  // Set up event listeners
  setupEventListeners() {
    this.debug('Setting up event listeners');
    
    // Add goal button
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
      // Remove existing event listeners to prevent duplicates
      const newAddGoalBtn = addGoalBtn.cloneNode(true);
      addGoalBtn.parentNode.replaceChild(newAddGoalBtn, addGoalBtn);
      
      newAddGoalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.debug('Add Goal button clicked');
        this.showAddGoalForm();
      });
    } else {
      this.debug('Warning: Add Goal button not found');
    }
    
    // Add goal form
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
      // Remove existing event listeners to prevent duplicates
      const newGoalForm = goalForm.cloneNode(true);
      goalForm.parentNode.replaceChild(newGoalForm, goalForm);
      
      newGoalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.debug('Goal form submitted');
        this.handleGoalFormSubmit();
      });
    } else {
      this.debug('Warning: Goal form not found');
    }
    
    // Cancel goal form
    const cancelGoalBtn = document.getElementById('cancel-goal-btn');
    if (cancelGoalBtn) {
      // Remove existing event listeners to prevent duplicates
      const newCancelGoalBtn = cancelGoalBtn.cloneNode(true);
      cancelGoalBtn.parentNode.replaceChild(newCancelGoalBtn, cancelGoalBtn);
      
      newCancelGoalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.debug('Cancel button clicked');
        this.hideGoalForm();
      });
    }
    
    // Close form button
    const closeFormBtn = document.getElementById('goal-form-close');
    if (closeFormBtn) {
      // Remove existing event listeners to prevent duplicates
      const newCloseFormBtn = closeFormBtn.cloneNode(true);
      closeFormBtn.parentNode.replaceChild(newCloseFormBtn, closeFormBtn);
      
      newCloseFormBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.debug('Close form button clicked');
        this.hideGoalForm();
      });
    }
  }

  // Show add goal form
  showAddGoalForm() {
    this.debug('Showing add goal form');
    const goalFormContainer = document.getElementById('goal-form-container');
    if (!goalFormContainer) {
      console.error('Goal form container not found');
      return;
    }
    
    const goalForm = document.getElementById('goal-form');
    const goalFormTitle = document.getElementById('goal-form-title');
    const goalBtn = document.getElementById('goal-submit-btn');
    
    if (!goalForm) {
      console.error('Goal form not found');
      return;
    }
    
    // Reset form
    goalForm.reset();
    
    // Set form mode to add
    goalForm.dataset.mode = 'add';
    goalForm.dataset.goalId = '';
    
    // Update form title and button text
    if (goalFormTitle) {
      goalFormTitle.textContent = 'Add New Goal';
    }
    
    if (goalBtn) {
      goalBtn.textContent = 'Add Goal';
    }
    
    // If we have current activity, pre-select it
    if (this.currentActivity) {
      const activityInput = document.getElementById('goal-activity');
      if (activityInput) {
        activityInput.value = this.currentActivity.name;
        activityInput.disabled = true;
        this.debug('Set activity field to:', this.currentActivity.name);
      }
    }
    
    // Set default period type
    const periodTypeSelect = document.getElementById('goal-period-type');
    if (periodTypeSelect) {
      periodTypeSelect.value = 'weekly';
    }
    
    // Set default dates
    const today = new Date();
    const startDateInput = document.getElementById('goal-start-date');
    if (startDateInput) {
      startDateInput.valueAsDate = today;
    }
    
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30); // 30 days from now
    
    const endDateInput = document.getElementById('goal-end-date');
    if (endDateInput) {
      endDateInput.valueAsDate = endDate;
    }
    
    // Show form by removing hidden class and setting display style
    goalFormContainer.classList.remove('hidden');
    goalFormContainer.style.display = 'flex';
    this.debug('Goal form should now be visible');
  }

  // Hide goal form
  hideGoalForm() {
    this.debug('Hiding goal form');
    const goalFormContainer = document.getElementById('goal-form-container');
    if (goalFormContainer) {
      goalFormContainer.classList.add('hidden');
      goalFormContainer.style.display = 'none';
    }
  }

  // Handle goal form submit
  async handleGoalFormSubmit() {
    try {
      this.debug('Handling goal form submission');
      const goalForm = document.getElementById('goal-form');
      const targetCountInput = document.getElementById('goal-target-count');
      const periodTypeSelect = document.getElementById('goal-period-type');
      const startDateInput = document.getElementById('goal-start-date');
      const endDateInput = document.getElementById('goal-end-date');
      
      // Get form values
      const targetCount = parseFloat(targetCountInput.value);
      const periodType = periodTypeSelect.value;
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      
      this.debug('Goal form values:', {
        targetCount,
        periodType,
        startDate,
        endDate,
        currentActivity: this.currentActivity
      });
      
      // Validate input
      if (isNaN(targetCount) || targetCount <= 0) {
        alert('Please enter a valid target count');
        return;
      }
      
      if (!periodType) {
        alert('Please select a period type');
        return;
      }
      
      if (!startDate || !endDate) {
        alert('Please select start and end dates');
        return;
      }
      
      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date');
        return;
      }
      
      if (!this.currentActivity || !this.currentActivity.activity_type_id) {
        console.error('No activity selected or missing activity_type_id');
        alert('Please select an activity first');
        return;
      }
      
      // Check form mode and submit accordingly
      const mode = goalForm.dataset.mode;
      
      let result;
      if (mode === 'add') {
        this.debug('Creating new goal...');
        // Try using direct API first
        if (window.directGoalsApi) {
          result = await window.directGoalsApi.createGoal(
            this.currentActivity.activity_type_id,
            targetCount,
            periodType,
            startDate,
            endDate
          );
        } else if (window.apiClient) {
          // Fallback to using apiClient
          result = await window.apiClient.createGoal(
            this.currentActivity.activity_type_id,
            targetCount,
            periodType,
            startDate,
            endDate
          );
        } else {
          throw new Error('No API client available for creating goals');
        }
        this.debug('Goal created result:', result);
      } else if (mode === 'edit') {
        this.debug('Updating existing goal...');
        const goalId = parseInt(goalForm.dataset.goalId);
        if (window.directGoalsApi) {
          result = await window.directGoalsApi.updateGoal(
            goalId,
            targetCount,
            periodType,
            startDate,
            endDate
          );
        } else if (window.apiClient) {
          result = await window.apiClient.updateGoal(
            goalId,
            targetCount,
            periodType,
            startDate,
            endDate
          );
        } else {
          throw new Error('No API client available for updating goals');
        }
        this.debug('Goal updated result:', result);
      }
      
      // Hide form before loading goals to improve UX
      this.hideGoalForm();
      
      // Reload goals and update UI
      await this.loadGoals();
      this.renderGoals();
      
      // Show success message
      const message = mode === 'add' ? 'Goal added successfully!' : 'Goal updated successfully!';
      this.showMessage(message, 'success');
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Error saving goal: ' + error.message);
      this.showMessage('Error saving goal. Please try again.', 'error');
    }
  }

  // Show edit goal form
  async showEditGoalForm(goalId) {
    try {
      this.debug('Showing edit goal form for goal ID:', goalId);
      const goal = this.goals.find(g => g.goal_id === goalId);
      if (!goal) {
        console.error('Goal not found:', goalId);
        return;
      }
      
      const goalFormContainer = document.getElementById('goal-form-container');
      const goalForm = document.getElementById('goal-form');
      const goalFormTitle = document.getElementById('goal-form-title');
      const goalBtn = document.getElementById('goal-submit-btn');
      const targetCountInput = document.getElementById('goal-target-count');
      const periodTypeSelect = document.getElementById('goal-period-type');
      const startDateInput = document.getElementById('goal-start-date');
      const endDateInput = document.getElementById('goal-end-date');
      const activityInput = document.getElementById('goal-activity');
      
      if (!goalFormContainer || !goalForm) {
        console.error('Goal form elements not found');
        return;
      }
      
      // Set form mode to edit
      goalForm.dataset.mode = 'edit';
      goalForm.dataset.goalId = goalId;
      
      // Update form title and button text
      if (goalFormTitle) goalFormTitle.textContent = 'Edit Goal';
      if (goalBtn) goalBtn.textContent = 'Update Goal';
      
      // Populate form fields
      if (targetCountInput) targetCountInput.value = goal.target_count;
      if (periodTypeSelect) periodTypeSelect.value = goal.period_type;
      
      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);
      
      if (startDateInput) startDateInput.valueAsDate = startDate;
      if (endDateInput) endDateInput.valueAsDate = endDate;
      
      // Set activity name
      if (activityInput) {
        activityInput.value = goal.activity_name || this.currentActivity?.name || '';
        activityInput.disabled = true;
      }
      
      // Show form
      goalFormContainer.classList.remove('hidden');
      goalFormContainer.style.display = 'flex';
    } catch (error) {
      console.error('Error showing edit goal form:', error);
    }
  }

  // Delete a goal
  async deleteGoal(goalId) {
    try {
      this.debug('Deleting goal ID:', goalId);
      const confirmed = confirm('Are you sure you want to delete this goal?');
      if (!confirmed) return;
      
      if (window.directGoalsApi) {
        await window.directGoalsApi.deleteGoal(goalId);
      } else if (window.apiClient) {
        await window.apiClient.deleteGoal(goalId);
      } else {
        throw new Error('No API client available for deleting goals');
      }
      
      // Reload goals and update UI
      await this.loadGoals();
      this.renderGoals();
      
      // Show success message
      this.showMessage('Goal deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting goal:', error);
      this.showMessage('Error deleting goal. Please try again.', 'error');
    }
  }

  // Render goals in the UI
  renderGoals() {
    const goalsContainer = document.getElementById('goals-container');
    if (!goalsContainer) {
      this.debug('Error: Goals container not found');
      return;
    }
    
    this.debug('Rendering goals, count:', this.goals?.length || 0);
    
    // Clear container
    goalsContainer.innerHTML = '';
    
    // Check if we have goals
    if (!this.goals || this.goals.length === 0) {
      goalsContainer.innerHTML = `
        <div class="empty-state">
          <p>No goals set yet. Click "Add Goal" to create one!</p>
        </div>
      `;
      this.debug('No goals to render, showing empty state');
      return;
    }
    
    // Render each goal
    for (const goal of this.goals) {
      this.renderGoal(goal);
    }
  }

  // Render a single goal
  async renderGoal(goal) {
    try {
      this.debug('Rendering goal:', goal.goal_id);
      const goalsContainer = document.getElementById('goals-container');
      if (!goalsContainer) return;
      
      // Default progress values if we can't fetch from server
      let progress = {
        currentCount: 0,
        targetCount: goal.target_count || 100,
        progressPercent: 0,
        remaining: goal.target_count || 100,
        completed: false
      };
      
      // Only try to get progress if we have a valid goal ID
      if (goal && goal.goal_id && !isNaN(parseInt(goal.goal_id))) {
        try {
          this.debug('Fetching progress for goal ID:', goal.goal_id);
          let progressData;
          
          if (window.directGoalsApi) {
            progressData = await window.directGoalsApi.getGoalProgress(goal.goal_id);
          } else if (window.apiClient) {
            progressData = await window.apiClient.getGoalProgress(goal.goal_id);
          }
          
          if (progressData && !progressData.error) {
            progress = progressData;
            this.debug('Progress data received:', progress);
          }
        } catch (error) {
          console.error('Error loading goal progress:', error);
          // Keep using the default progress object
        }
      }
      
      // Ensure activity name and unit are present
      const activityName = goal.activity_name || this.currentActivity?.name || 'Activity';
      const activityUnit = goal.unit || this.currentActivity?.unit || 'units';
      
      // Create goal element
      const goalElement = document.createElement('div');
      goalElement.className = 'card goal-card';
      goalElement.innerHTML = `
        <div class="goal-header">
          <h3>${activityName} Goal</h3>
          <div class="goal-actions">
            <button class="btn-sm btn-edit" data-id="${goal.goal_id}" aria-label="Edit goal">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-sm btn-danger" data-id="${goal.goal_id}" aria-label="Delete goal">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="goal-details">
          <div class="goal-target">
            <span class="goal-label">Target:</span>
            <span class="goal-value">${goal.target_count} ${activityUnit}</span>
          </div>
          <div class="goal-period">
            <span class="goal-label">Period:</span>
            <span class="goal-value">${this.formatPeriodType(goal.period_type)}</span>
          </div>
          <div class="goal-dates">
            <span class="goal-label">Dates:</span>
            <span class="goal-value">${this.formatDateRange(goal.start_date, goal.end_date)}</span>
          </div>
        </div>
        <div class="goal-progress">
          <div class="progress-label">
            <span>Progress: ${progress.currentCount} / ${progress.targetCount} ${activityUnit}</span>
            <span>${progress.progressPercent}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${progress.completed ? 'completed' : ''}" style="width: ${progress.progressPercent}%"></div>
          </div>
          <div class="progress-status">
            ${progress.completed ? 
              '<span class="status-completed"><i class="fas fa-check-circle"></i> Goal Completed!</span>' :
              `<span class="status-remaining">${progress.remaining} ${activityUnit} remaining</span>`
            }
          </div>
        </div>
      `;
      
      // Add event listeners
      const editBtn = goalElement.querySelector('.btn-edit');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.showEditGoalForm(goal.goal_id);
        });
      }
      
      const deleteBtn = goalElement.querySelector('.btn-danger');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          this.deleteGoal(goal.goal_id);
        });
      }
      
      // Add to container
      goalsContainer.appendChild(goalElement);
    } catch (error) {
      console.error('Error rendering goal:', error);
    }
  }

  // Format period type for display
  formatPeriodType(periodType) {
    switch (periodType) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return periodType;
    }
  }

  // Format date range for display
  formatDateRange(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid date range';
      }
      
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Invalid date range';
    }
  }

  // Show message
  showMessage(message, type = 'info') {
    try {
      this.debug('Showing message:', message, type);
      // Create message element if it doesn't exist
      let messageElement = document.getElementById('message');
      if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'message';
        document.body.appendChild(messageElement);
      }
      
      // Set message content and type
      messageElement.textContent = message;
      messageElement.className = `message message-${type}`;
      
      // Show message
      messageElement.classList.add('show');
      
      // Hide message after 3 seconds
      setTimeout(() => {
        if (messageElement) {
          messageElement.classList.remove('show');
        }
      }, 3000);
    } catch (error) {
      console.error('Error showing message:', error);
    }
  }

  // Update current activity
  updateActivity(activity) {
    this.debug('Updating current activity:', activity);
    if (!activity) {
      console.warn('Attempted to update with null activity');
      return;
    }
    
    this.currentActivity = activity;
    
    // Load and render goals for the new activity
    this.loadGoals().then(() => {
      this.renderGoals();
    }).catch(error => {
      console.error('Error updating activity:', error);
    });
  }
}

// Initialize goals manager
window.goalsManager = new GoalsManager();
