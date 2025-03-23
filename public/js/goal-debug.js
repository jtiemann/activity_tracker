// Goal Submission Debugging Utility
// This script helps diagnose issues with goal saving

(function() {
  // Add console tracking for goal-related actions
  console.log('Goal debugging utility loaded');
  
  // Track form submissions
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    // Log goal-related API calls
    if (url.includes('/api/goals')) {
      console.group('Goal API Request');
      console.log('URL:', url);
      console.log('Method:', options.method);
      
      if (options.body) {
        try {
          console.log('Request body:', JSON.parse(options.body));
        } catch (e) {
          console.log('Request body:', options.body);
        }
      }
      
      try {
        const response = await originalFetch(url, options);
        const clonedResponse = response.clone();
        
        try {
          const responseData = await clonedResponse.json();
          console.log('Response status:', response.status);
          console.log('Response data:', responseData);
        } catch (e) {
          console.log('Response status:', response.status);
          console.log('Response could not be parsed as JSON');
        }
        
        console.groupEnd();
        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        console.groupEnd();
        throw error;
      }
    }
    
    // Use original fetch for non-goal requests
    return originalFetch(url, options);
  };
  
  // Add a function to test goal creation directly
  window.testGoalCreation = async function(activityTypeId) {
    try {
      console.group('Manual Goal Creation Test');
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        console.error('No logged in user found in localStorage');
        console.groupEnd();
        return;
      }
      
      console.log('Current user:', currentUser);
      
      // Get activity if no activityTypeId was provided
      if (!activityTypeId) {
        // Try to get from current activity
        if (window.currentActivity && window.currentActivity.activity_type_id) {
          activityTypeId = window.currentActivity.activity_type_id;
          console.log('Using current activity:', window.currentActivity);
        } else {
          // Fetch first activity
          const response = await fetch(`/api/activities/${currentUser.user_id}`, {
            headers: {
              'Authorization': `Bearer ${currentUser.token}`
            }
          });
          
          if (!response.ok) {
            console.error('Failed to fetch activities');
            console.groupEnd();
            return;
          }
          
          const activities = await response.json();
          if (activities.length === 0) {
            console.error('No activities found for user');
            console.groupEnd();
            return;
          }
          
          activityTypeId = activities[0].activity_type_id;
          console.log('Using first activity:', activities[0]);
        }
      }
      
      // Create a test goal
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);
      
      const goalData = {
        userId: currentUser.user_id,
        activityTypeId: activityTypeId,
        targetCount: 100,
        periodType: 'weekly',
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      console.log('Submitting test goal:', goalData);
      
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(goalData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Goal creation failed:', errorData);
        console.groupEnd();
        return;
      }
      
      const result = await response.json();
      console.log('Goal created successfully:', result);
      console.groupEnd();
      return result;
    } catch (error) {
      console.error('Error in test goal creation:', error);
      console.groupEnd();
    }
  };
  
  // Monitor goal form submissions
  document.addEventListener('DOMContentLoaded', function() {
    // Monitor form submissions
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
      const originalSubmit = goalForm.submit;
      goalForm.submit = function() {
        console.log('Goal form submitted');
        return originalSubmit.apply(this, arguments);
      };
      
      console.log('Goal form submission monitoring active');
    } else {
      console.log('Goal form not found yet, will check again soon');
      
      // Try again after a delay
      setTimeout(function() {
        const delayedForm = document.getElementById('goal-form');
        if (delayedForm) {
          const originalSubmit = delayedForm.submit;
          delayedForm.submit = function() {
            console.log('Goal form submitted (delayed setup)');
            return originalSubmit.apply(this, arguments);
          };
          
          console.log('Goal form submission monitoring active (delayed setup)');
        } else {
          console.log('Goal form not found after delay');
        }
      }, 2000);
    }
  });
  
  // Add debug info to the console
  console.log(`
  Goal debugging commands:
  - window.testGoalCreation() - Test goal creation with current activity
  - window.testGoalCreation(activityTypeId) - Test with specific activity ID
  `);
})();
