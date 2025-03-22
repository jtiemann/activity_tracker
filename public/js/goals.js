// Goals handling
class GoalsManager {
  constructor() {
    this.goals = [];
    this.currentActivity = null;
  }

  // Initialize goals
  async init(activity) {
    this.currentActivity = activity;
    await this.loadGoals();
    this.setupEventListeners();
    this.renderGoals();
  }

  // Load goals for current activity
  async loadGoals() {
    try {
      if (!this.currentActivity) return;
      
      this.goals = await window.apiClient.getActivityGoals(this.currentActivity.activity_type_id);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Add goal button
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
      addGoalBtn.addEventListener('click', () => this.showAddGoalForm());
    }
    
    // Add goal form
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGoalFormSubmit();
      });
    }
    
    // Cancel goal form
    const cancelGoalBtn = document.getElementById('cancel-goal-btn');
    if (cancelGoalBtn) {
      cancelGoalBtn.addEventListener('click', () => this.hideGoalForm());
    }
  }

  // Show add goal form
  showAddGoalForm() {
    const goalForm = document.getElementById('goal-form');
    const goalFormTitle = document.getElementById('goal-form-title');
    const goalBtn = document.getElementById('goal-submit-btn');
    
    // Reset form
    goalForm.reset();
    
    // Set form mode to add
    goalForm.dataset.mode = 'add';
    goalForm.dataset.goalId = '';
    
    // Update form title and button text
    goalFormTitle.textContent = 'Add New Goal';
    goalBtn.textContent = 'Add Goal';
    
    // If we have current activity, pre-select it
    if (this.currentActivity) {
      const activityInput = document.getElementById('goal-activity');
      activityInput.value = this.currentActivity.name;
      activityInput.disabled = true;
    }
    
    // Set default period type
    const periodTypeSelect = document.getElementById('goal-period-type');
    periodTypeSelect.value = 'weekly';
    
    // Set default dates
    const today = new Date();
    const startDateInput = document.getElementById('goal-start-date');
    startDateInput.valueAsDate = today;
    
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30); // 30 days from now
    
    const endDateInput = document.getElementById('goal-end-date');
    endDateInput.valueAsDate = endDate;
    
    // Show form
    const goalFormContainer = document.getElementById('goal-form-container');
    goalFormContainer.classList.remove('hidden');
  }

  // Show edit goal form
  showEditGoalForm(goalId) {
    const goal = this.goals.find(g => g.goal_id === goalId);
    if (!goal) return;
    
    const goalForm = document.getElementById('goal-form');
    const goalFormTitle = document.getElementById('goal-form-title');
    const goalBtn = document.getElementById('goal-submit-btn');
    
    // Reset form
    goalForm.reset();
    
    // Set form mode to edit
    goalForm.dataset.mode = 'edit';
    goalForm.dataset.goalId = goalId;
    
    // Update form title and button text
    goalFormTitle.textContent = 'Edit Goal';
    goalBtn.textContent = 'Update Goal';
    
    // Fill form with goal data
    const activityInput = document.getElementById('goal-activity');
    activityInput.value = goal.activity_name;
    activityInput.disabled = true;
    
    const targetCountInput = document.getElementById('goal-target-count');
    targetCountInput.value = goal.target_count;
    
    const periodTypeSelect = document.getElementById('goal-period-type');
    periodTypeSelect.value = goal.period_type;
    
    const startDateInput = document.getElementById('goal-start-date');
    startDateInput.valueAsDate = new Date(goal.start_date);
    
    const endDateInput = document.getElementById('goal-end-date');
    endDateInput.valueAsDate = new Date(goal.end_date);
    
    // Show form
    const goalFormContainer = document.getElementById('goal-form-container');
    goalFormContainer.classList.remove('hidden');
  }

  // Hide goal form
  hideGoalForm() {
    const goalFormContainer = document.getElementById('goal-form-container');
    goalFormContainer.classList.add('hidden');
  }

  // Handle goal form submit
  async handleGoalFormSubmit() {
    try {
      const goalForm = document.getElementById('goal-form');
      const targetCountInput = document.getElementById('goal-target-count');
      const periodTypeSelect = document.getElementById('goal-period-type');
      const startDateInput = document.getElementById('goal-start-date');
      const endDateInput = document.getElementById('goal-end-date');
      
      const targetCount = parseFloat(targetCountInput.value);
      const periodType = periodTypeSelect.value;
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      
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
      
      // Check form mode and submit accordingly
      const mode = goalForm.dataset.mode;
      
      if (mode === 'add') {
        // Create new goal
        await window.apiClient.createGoal(
          this.currentActivity.activity_type_id,
          targetCount,
          periodType,
          startDate,
          endDate
        );
      } else if (mode === 'edit') {
        // Update existing goal
        const goalId = parseInt(goalForm.dataset.goalId);
        await window.apiClient.updateGoal(
          goalId,
          targetCount,
          periodType,
          startDate,
          endDate
        );
      }
      
      // Reload goals and update UI
      await this.loadGoals();
      this.renderGoals();
      
      // Hide form
      this.hideGoalForm();
      
      // Show success message
      const message = mode === 'add' ? 'Goal added successfully!' : 'Goal updated successfully!';
      this.showMessage(message, 'success');
    } catch (error) {
      console.error('Error saving goal:', error);
      this.showMessage('Error saving goal. Please try again.', 'error');
    }
  }

  // Delete a goal
  async deleteGoal(goalId) {
    try {
      const confirmed = confirm('Are you sure you want to delete this goal?');
      if (!confirmed) return;
      
      await window.apiClient.deleteGoal(goalId);
      
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
    if (!goalsContainer) return;
    
    // Clear container
    goalsContainer.innerHTML = '';
    
    // Check if we have goals
    if (this.goals.length === 0) {
      goalsContainer.innerHTML = `
        <div class="empty-state">
          <p>No goals set yet. Click "Add Goal" to create one!</p>
        </div>
      `;
      return;
    }
    
    // Render each goal
    this.goals.forEach(goal => {
      this.renderGoal(goal);
    });
  }

  // Render a single goal
  async renderGoal(goal) {
    const goalsContainer = document.getElementById('goals-container');
    if (!goalsContainer) return;
    
    // Get goal progress
    let progress;
    try {
      progress = await window.apiClient.getGoalProgress(goal.goal_id);
    } catch (error) {
      console.error('Error loading goal progress:', error);
      progress = {
        currentCount: 0,
        targetCount: goal.target_count,
        progressPercent: 0,
        remaining: goal.target_count,
        completed: false
      };
    }
    
    // Create goal element
    const goalElement = document.createElement('div');
    goalElement.className = 'card goal-card';
    goalElement.innerHTML = `
      <div class="goal-header">
        <h3>${goal.activity_name} Goal</h3>
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
          <span class="goal-value">${goal.target_count} ${goal.unit}</span>
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
          <span>Progress: ${progress.currentCount} / ${progress.targetCount} ${goal.unit}</span>
          <span>${progress.progressPercent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill ${progress.completed ? 'completed' : ''}" style="width: ${progress.progressPercent}%"></div>
        </div>
        <div class="progress-status">
          ${progress.completed ? 
            '<span class="status-completed"><i class="fas fa-check-circle"></i> Goal Completed!</span>' :
            `<span class="status-remaining">${progress.remaining} ${goal.unit} remaining</span>`
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  // Show message
  showMessage(message, type = 'info') {
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
      messageElement.classList.remove('show');
    }, 3000);
  }

  // Update current activity
  updateActivity(activity) {
    this.currentActivity = activity;
    this.loadGoals().then(() => this.renderGoals());
  }
}

// Initialize goals manager
window.goalsManager = new GoalsManager();
