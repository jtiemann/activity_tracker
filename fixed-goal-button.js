// Direct fix for the Add Goal button and activity field population
(function() {
  // Function to run when the page loads
  function initGoalButton() {
    console.log('Setting up direct goal button handlers');
    
    // First ensure the GoalsManager is instantiated
    if (!window.goalsManager && window.GoalsManager) {
      console.log('Creating new GoalsManager instance');
      window.goalsManager = new GoalsManager();
      
      // Get the current activity from the dropdown
      const activityTypeSelect = document.getElementById('activity-type');
      if (activityTypeSelect && activityTypeSelect.value) {
        const selectedId = parseInt(activityTypeSelect.value);
        
        // Get the currentUser from localStorage
        let currentUser = null;
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
          
          // Fetch the current activity
          fetch(`/api/activities/${currentUser.user_id}`, {
            headers: {
              'Authorization': `Bearer ${currentUser.token}`
            }
          })
          .then(response => response.json())
          .then(activities => {
            const activity = activities.find(a => a.activity_type_id === selectedId);
            if (activity) {
              console.log('Initializing goals for current activity:', activity.name);
              window.goalsManager.init(activity);
            }
          })
          .catch(error => {
            console.error('Error fetching activities:', error);
          });
        }
      }
    }
    
    setupAddGoalButton();
    setupCloseButtons();
  }

  // Function to set up the Add Goal button
  function setupAddGoalButton() {
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (!addGoalBtn) {
      console.error('Add Goal button not found');
      return;
    }

    // Add click event listener
    addGoalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Add Goal button clicked');
      
      // Direct function to show form and populate activity
      showGoalForm();
    });
  }

  // Function to show the goal form and populate the activity field
  function showGoalForm() {
    // Get the form elements
    const goalFormContainer = document.getElementById('goal-form-container');
    const goalForm = document.getElementById('goal-form');
    const activityInput = document.getElementById('goal-activity');
    const goalFormTitle = document.getElementById('goal-form-title');
    const goalBtn = document.getElementById('goal-submit-btn');
    
    if (!goalFormContainer || !goalForm) {
      console.error('Goal form elements not found');
      return;
    }
    
    // Reset form
    goalForm.reset();
    
    // Set form mode to add
    goalForm.dataset.mode = 'add';
    goalForm.dataset.goalId = '';
    
    // Update form title and button text
    goalFormTitle.textContent = 'Add New Goal';
    goalBtn.textContent = 'Add Goal';
    
    // Get current activity from the dropdown
    const activityTypeSelect = document.getElementById('activity-type');
    let activityName = '';
    
    if (activityTypeSelect && activityTypeSelect.selectedOptions && activityTypeSelect.selectedOptions.length > 0) {
      activityName = activityTypeSelect.selectedOptions[0].textContent || '';
      console.log('Current activity found in dropdown:', activityName);
      
      // Directly set the activity field value
      if (activityInput) {
        activityInput.value = activityName;
        console.log('Set activity input value to:', activityName);
        
        // Force a browser repaint to make sure the value appears
        activityInput.style.display = 'none';
        setTimeout(function() {
          activityInput.style.display = '';
        }, 0);
      } else {
        console.error('Activity input field not found');
      }
    } else {
      console.warn('No activity selected in dropdown');
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
    
    // Show form by removing hidden class
    goalFormContainer.classList.remove('hidden');
    goalFormContainer.style.display = 'flex';
    
    // Final check to ensure activity field is populated
    setTimeout(function() {
      if (activityInput && activityInput.value === '' && activityName !== '') {
        console.log('Activity field still empty, forcing value again');
        activityInput.value = activityName;
      }
    }, 100);
  }

  // Function to set up close and cancel buttons
  function setupCloseButtons() {
    const goalFormContainer = document.getElementById('goal-form-container');
    const closeBtn = document.getElementById('goal-form-close');
    const cancelBtn = document.getElementById('cancel-goal-btn');
    
    if (closeBtn && goalFormContainer) {
      closeBtn.addEventListener('click', function() {
        goalFormContainer.classList.add('hidden');
      });
    }
    
    if (cancelBtn && goalFormContainer) {
      cancelBtn.addEventListener('click', function() {
        goalFormContainer.classList.add('hidden');
      });
    }
  }
  
  // Check if DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // DOM already loaded, run immediately
    initGoalButton();
  } else {
    // Wait for DOMContentLoaded event
    document.addEventListener('DOMContentLoaded', initGoalButton);
  }
  
  // Also set up a backup initializer that runs after a short delay
  // This covers cases where the DOMContentLoaded event might be missed
  setTimeout(function() {
    if (document.getElementById('add-goal-btn')) {
      console.log('Running backup initializer for goal buttons');
      initGoalButton();
    }
  }, 1000);
})();