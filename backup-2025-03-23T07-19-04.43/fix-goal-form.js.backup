// Direct fix for the goal form submission issues
(function() {
  console.log('Form submission fix loaded');
  
  // Function to directly attach the submit handler
  function fixGoalFormSubmit() {
    const goalForm = document.getElementById('goal-form');
    if (!goalForm) {
      console.log('Goal form not found, will try again in 500ms');
      setTimeout(fixGoalFormSubmit, 500);
      return;
    }
    
    console.log('Found goal form, attaching direct submit handler');
    
    // Remove any existing event listeners by cloning the form
    const newForm = goalForm.cloneNode(true);
    goalForm.parentNode.replaceChild(newForm, goalForm);
    
    // Add our direct submit handler
    newForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      console.log('Goal form submitted');
      
      // Get form values
      const targetCountInput = document.getElementById('goal-target-count');
      const periodTypeSelect = document.getElementById('goal-period-type');
      const startDateInput = document.getElementById('goal-start-date');
      const endDateInput = document.getElementById('goal-end-date');
      const activityInput = document.getElementById('goal-activity');
      
      // Get form values
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
      
      // Get current activity
      const activityTypeSelect = document.getElementById('activity-type');
      const selectedOption = activityTypeSelect.selectedOptions[0];
      if (!selectedOption) {
        alert('Please select an activity first');
        return;
      }
      
      const activityTypeId = parseInt(selectedOption.value);
      const activityName = selectedOption.textContent;
      
      console.log('Submitting goal directly:', {
        activityTypeId,
        activityName,
        targetCount,
        periodType,
        startDate,
        endDate
      });
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        console.error('No user found in localStorage');
        alert('You must be logged in to create goals');
        return;
      }
      
      // Submit the goal directly via fetch
      submitGoal(currentUser, activityTypeId, targetCount, periodType, startDate, endDate)
        .then(() => {
          // Hide form
          const goalFormContainer = document.getElementById('goal-form-container');
          if (goalFormContainer) {
            goalFormContainer.classList.add('hidden');
          }
          
          // Show success message
          alert('Goal added successfully!');
          
          // Reload goals if possible
          if (window.goalsManager) {
            window.goalsManager.loadGoals().then(() => {
              window.goalsManager.renderGoals();
            });
          } else {
            // Force reload the page as fallback
            window.location.reload();
          }
        })
        .catch(error => {
          console.error('Error submitting goal:', error);
          alert('Error saving goal: ' + error.message);
        });
    });
    
    // Fix cancel button
    const cancelBtn = document.getElementById('cancel-goal-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        const goalFormContainer = document.getElementById('goal-form-container');
        if (goalFormContainer) {
          goalFormContainer.classList.add('hidden');
        }
      });
    }
    
    // Fix close button
    const closeBtn = document.getElementById('goal-form-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        const goalFormContainer = document.getElementById('goal-form-container');
        if (goalFormContainer) {
          goalFormContainer.classList.add('hidden');
        }
      });
    }
    
    console.log('Goal form submit handler attached');
  }
  
  // Helper function to submit the goal
  async function submitGoal(currentUser, activityTypeId, targetCount, periodType, startDate, endDate) {
    const url = '/api/goals';
    const data = {
      userId: currentUser.user_id,
      activityTypeId,
      targetCount,
      periodType,
      startDate,
      endDate
    };
    
    console.log('Sending goal data:', data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Goal submission failed:', errorData);
      throw new Error(errorData.error || 'Failed to create goal');
    }
    
    const result = await response.json();
    console.log('Goal created successfully:', result);
    return result;
  }
  
  // Run on page load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(fixGoalFormSubmit, 500);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fixGoalFormSubmit, 500);
    });
  }
  
  // Also add a button to the form to handle direct submission
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const submitBtn = document.getElementById('goal-submit-btn');
      if (submitBtn) {
        const directSubmitBtn = document.createElement('button');
        directSubmitBtn.type = 'button';
        directSubmitBtn.id = 'direct-goal-submit';
        directSubmitBtn.className = submitBtn.className;
        directSubmitBtn.style.marginLeft = '5px';
        directSubmitBtn.textContent = 'Direct Submit';
        
        directSubmitBtn.addEventListener('click', function() {
          console.log('Direct submit button clicked');
          // Trigger form submission
          const form = document.getElementById('goal-form');
          if (form) {
            // Create and dispatch a submit event
            const submitEvent = new Event('submit', {
              bubbles: true,
              cancelable: true
            });
            form.dispatchEvent(submitEvent);
          }
        });
        
        const actions = document.querySelector('.goal-form-actions');
        if (actions) {
          actions.appendChild(directSubmitBtn);
        }
      }
    }, 1000);
  });
})();
