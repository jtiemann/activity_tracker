// Combined fix for goals functionality - both activity type population and form submission
(function() {
  console.log('Goals functionality fix loaded');
  
  // Ensure GoalsManager is instantiated
  function ensureGoalsManager() {
    // Create GoalsManager if it doesn't exist
    if (!window.goalsManager && window.GoalsManager) {
      console.log('Creating new GoalsManager instance');
      window.goalsManager = new GoalsManager();
      
      // Initialize with current activity if available
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
  }
  
  // Fix for Add Goal button to populate activity field
  function fixAddGoalButton() {
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (!addGoalBtn) {
      console.error('Add Goal button not found');
      return;
    }
    
    // Remove existing event listeners by cloning
    const newBtn = addGoalBtn.cloneNode(true);
    addGoalBtn.parentNode.replaceChild(newBtn, addGoalBtn);
    
    // Add click event listener
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Add Goal button clicked');
      
      showGoalForm();
    });
  }
  
  // Function to show goal form and populate activity field
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
    if (goalFormTitle) {
      goalFormTitle.textContent = 'Add New Goal';
    }
    
    if (goalBtn) {
      goalBtn.textContent = 'Add Goal';
    }
    
    // Get current activity from the dropdown
    const activityTypeSelect = document.getElementById('activity-type');
    let activityName = '';
    let activityId = '';
    
    if (activityTypeSelect && activityTypeSelect.selectedOptions && activityTypeSelect.selectedOptions.length > 0) {
      activityName = activityTypeSelect.selectedOptions[0].textContent || '';
      activityId = activityTypeSelect.value;
      console.log('Current activity found in dropdown:', activityName, '(ID:', activityId, ')');
      
      // Directly set the activity field value
      if (activityInput) {
        activityInput.value = activityName;
        activityInput.disabled = true;
        console.log('Set activity input value to:', activityName);
        
        // Store activity ID in a data attribute for later use
        goalForm.dataset.activityId = activityId;
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
    
    // Show form
    goalFormContainer.classList.remove('hidden');
    goalFormContainer.style.display = 'flex';
  }
  
  // Fix for goal form submission
  function fixGoalFormSubmit() {
    const goalForm = document.getElementById('goal-form');
    if (!goalForm) {
      console.error('Goal form not found');
      return;
    }
    
    // Remove existing event listeners by cloning
    const newForm = goalForm.cloneNode(true);
    goalForm.parentNode.replaceChild(newForm, goalForm);
    
    // Add form submit event listener
    newForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('Goal form submitted');
      
      handleGoalSubmit(newForm);
    });
    
    // Fix the save button in case the form submit event isn't triggered
    const submitBtn = document.getElementById('goal-submit-btn');
    if (submitBtn) {
      // Remove existing event listeners
      const newSubmitBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
      
      // Add click event listener
      newSubmitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Submit button clicked');
        
        // Manually trigger form submission
        handleGoalSubmit(newForm);
      });
    }
  }
  
  // Handle the goal form submission
  async function handleGoalSubmit(form) {
    try {
      // Get form elements
      const targetInput = document.getElementById('goal-target-count');
      const periodTypeSelect = document.getElementById('goal-period-type');
      const startDateInput = document.getElementById('goal-start-date');
      const endDateInput = document.getElementById('goal-end-date');
      const submitBtn = document.getElementById('goal-submit-btn');
      
      // Get form values
      const targetCount = parseFloat(targetInput.value);
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
      
      // Get activity ID from the dropdown or form data attribute
      let activityTypeId;
      if (form.dataset.activityId) {
        activityTypeId = parseInt(form.dataset.activityId);
      } else {
        const activityTypeSelect = document.getElementById('activity-type');
        if (activityTypeSelect && activityTypeSelect.value) {
          activityTypeId = parseInt(activityTypeSelect.value);
        } else {
          alert('Please select an activity first');
          return;
        }
      }
      
      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loader"></span> Saving...';
      }
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('You must be logged in to create goals');
        return;
      }
      
      console.log('Submitting goal with data:', {
        userId: currentUser.user_id,
        activityTypeId,
        targetCount,
        periodType,
        startDate,
        endDate
      });
      
      // Submit the goal
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          userId: currentUser.user_id,
          activityTypeId,
          targetCount,
          periodType,
          startDate,
          endDate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }
      
      const result = await response.json();
      console.log('Goal created successfully:', result);
      
      // Hide form
      const goalFormContainer = document.getElementById('goal-form-container');
      if (goalFormContainer) {
        goalFormContainer.classList.add('hidden');
        goalFormContainer.style.display = 'none';
      }
      
      // Show success message
      alert('Goal added successfully!');
      
      // Reload goals if GoalsManager is available
      if (window.goalsManager) {
        window.goalsManager.loadGoals().then(() => {
          window.goalsManager.renderGoals();
        });
      }
    } catch (error) {
      console.error('Error submitting goal:', error);
      alert('Error saving goal: ' + error.message);
    } finally {
      // Reset button state
      const submitBtn = document.getElementById('goal-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Goal';
      }
    }
  }
  
  // Fix for close and cancel buttons
  function fixCloseButtons() {
    const goalFormContainer = document.getElementById('goal-form-container');
    const closeBtn = document.getElementById('goal-form-close');
    const cancelBtn = document.getElementById('cancel-goal-btn');
    
    if (closeBtn && goalFormContainer) {
      // Remove existing event listeners
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      // Add click event listener
      newCloseBtn.addEventListener('click', function() {
        goalFormContainer.classList.add('hidden');
        goalFormContainer.style.display = 'none';
      });
    }
    
    if (cancelBtn && goalFormContainer) {
      // Remove existing event listeners
      const newCancelBtn = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      
      // Add click event listener
      newCancelBtn.addEventListener('click', function() {
        goalFormContainer.classList.add('hidden');
        goalFormContainer.style.display = 'none';
      });
    }
  }
  
  // Initialize all fixes
  function initFixes() {
    console.log('Initializing goals functionality fixes');
    
    // Ensure GoalsManager exists
    ensureGoalsManager();
    
    // Fix Add Goal button
    fixAddGoalButton();
    
    // Fix form submission
    fixGoalFormSubmit();
    
    // Fix close buttons
    fixCloseButtons();
    
    console.log('Goals functionality fixes applied successfully');
  }
  
  // Run the fixes when the page loads
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // DOM already loaded, run after a short delay
    setTimeout(initFixes, 500);
  } else {
    // Wait for DOMContentLoaded event
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initFixes, 500);
    });
  }
  
  // Also set up a backup initializer that runs after a longer delay
  // This covers cases where the DOM might not be fully ready
  setTimeout(function() {
    console.log('Running backup initializer for goals functionality');
    initFixes();
  }, 1500);
})();
