const axios = require('axios');

// Base URL for the API
const baseUrl = 'http://localhost:3001';

// Test user credentials
const credentials = {
  username: 'jtiemann',
  password: 'kermit'
};

// Store auth token after login
let authToken = '';

// Helper function to make authenticated requests
async function authenticatedRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${baseUrl}${endpoint}`,
    headers: {}
  };
  
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('Testing API endpoints...');
  
  // Test 1: Login
  console.log('\n--- Test 1: Login ---');
  try {
    // Try both endpoints to see which one works
    let loginResult;
    
    try {
      loginResult = await axios.post(`${baseUrl}/api/auth/login`, credentials);
      console.log('Login successful via /api/auth/login');
    } catch (error) {
      console.log('Login failed via /api/auth/login, trying /api/login...');
      loginResult = await axios.post(`${baseUrl}/api/login`, credentials);
      console.log('Login successful via /api/login');
    }
    
    authToken = loginResult.data.token;
    console.log('Auth token received:', authToken ? 'Yes' : 'No');
    
    // If login successful, continue with other tests
    if (authToken) {
      // Test 2: Get user activities
      console.log('\n--- Test 2: Get Activities ---');
      const activities = await authenticatedRequest('get', `/api/activities/${loginResult.data.user_id}`);
      console.log(`Retrieved ${activities?.length || 0} activities`);
      
      if (activities && activities.length > 0) {
        const activityId = activities[0].activity_type_id;
        
        // Test 3: Get activity logs
        console.log('\n--- Test 3: Get Activity Logs ---');
        const logs = await authenticatedRequest('get', `/api/logs/${loginResult.data.user_id}/${activityId}`);
        console.log(`Retrieved ${logs?.length || 0} logs for activity ${activityId}`);
        
        // Test 4: Get activity stats
        console.log('\n--- Test 4: Get Activity Stats ---');
        const stats = await authenticatedRequest('get', `/api/logs/stats/${loginResult.data.user_id}/${activityId}`);
        console.log('Stats retrieved:', stats ? 'Yes' : 'No');
        if (stats) {
          console.log(`Today: ${stats.today} ${stats.unit}`);
          console.log(`Week: ${stats.week} ${stats.unit}`);
          console.log(`Month: ${stats.month} ${stats.unit}`);
          console.log(`Year: ${stats.year} ${stats.unit}`);
        }
        
        // Test 5: Create a new log entry
        console.log('\n--- Test 5: Create Log Entry ---');
        const newLog = await authenticatedRequest('post', '/api/logs', {
          activityTypeId: activityId,
          userId: loginResult.data.user_id,
          count: 15,
          loggedAt: new Date().toISOString(),
          notes: 'Test log from API test script'
        });
        console.log('Log created:', newLog ? 'Yes' : 'No');
      }
      
      // Test 6: Get goals
      console.log('\n--- Test 6: Get Goals ---');
      const goals = await authenticatedRequest('get', `/api/goals/${loginResult.data.user_id}`);
      console.log(`Retrieved ${goals?.length || 0} goals`);
      
      // Test 7: Check achievements
      console.log('\n--- Test 7: Check Achievements ---');
      const achievements = await authenticatedRequest('get', `/api/achievements/check/${loginResult.data.user_id}`);
      console.log('Achievements checked:', achievements ? 'Yes' : 'No');
      
      console.log('\nAll tests completed!');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
runTests();