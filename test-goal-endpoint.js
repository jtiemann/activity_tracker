// Test script for directly testing the goal API endpoint
const axios = require('axios');

// Test login and goal creation
async function testGoalEndpoint() {
  try {
    console.log('Testing goal creation endpoint...');
    
    // 1. Login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'jtiemann',
      password: 'kermit'
    });
    
    if (!loginResponse.data.token) {
      console.error('Login failed - no token received');
      return;
    }
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user_id;
    console.log(`Login successful! User ID: ${userId}`);
    
    // 2. Get user's activities
    console.log('\n2. Getting user activities...');
    const activitiesResponse = await axios.get(`http://localhost:3001/api/activities/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!activitiesResponse.data || activitiesResponse.data.length === 0) {
      console.error('No activities found for user');
      return;
    }
    
    const activities = activitiesResponse.data;
    console.log(`Found ${activities.length} activities`);
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.name} (ID: ${activity.activity_type_id})`);
    });
    
    // Use the first activity for testing
    const activityId = activities[0].activity_type_id;
    console.log(`Using activity: ${activities[0].name} (ID: ${activityId})`);
    
    // 3. Create a test goal
    console.log('\n3. Creating a test goal...');
    
    // Create dates for the goal
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);
    
    const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const goalData = {
      userId: userId,
      activityTypeId: activityId,
      targetCount: 100,
      periodType: 'weekly',
      startDate: startDateStr,
      endDate: endDateStr
    };
    
    console.log('Goal data to submit:', goalData);
    
    try {
      const goalResponse = await axios.post('http://localhost:3001/api/goals', goalData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('\nGoal created successfully!');
      console.log('Goal data:', goalResponse.data);
    } catch (error) {
      console.error('\nError creating goal:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error(error.message);
      }
    }
    
    // 4. Verify goals exist
    console.log('\n4. Verifying goals...');
    try {
      const goalsResponse = await axios.get(`http://localhost:3001/api/goals/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const goals = goalsResponse.data;
      console.log(`Found ${goals.length} goals for user`);
      
      if (goals.length > 0) {
        console.log('Latest goal:', goals[0]);
      }
    } catch (error) {
      console.error('Error fetching goals:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error(error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testGoalEndpoint();
