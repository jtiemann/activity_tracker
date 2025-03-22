const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config.env' });

// Mock user for testing
const testUser = {
  id: 1,
  username: 'testuser'
};

// Generate valid JWT token for testing
const generateToken = () => {
  return jwt.sign(
    { id: testUser.id, username: testUser.username },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};

describe('Authentication Routes', () => {
  test('POST /api/auth/login - Login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'jtiemann',
        password: 'kermit'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).toHaveProperty('username', 'jtiemann');
  });
  
  test('POST /api/auth/login - Login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'jtiemann',
        password: 'wrongpassword'
      });
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
  
  test('GET /api/auth/check-auth - With valid token', async () => {
    const token = generateToken();
    
    const response = await request(app)
      .get('/api/auth/check-auth')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('authenticated', true);
    expect(response.body.user).toHaveProperty('id', testUser.id);
    expect(response.body.user).toHaveProperty('username', testUser.username);
  });
  
  test('GET /api/auth/check-auth - With invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/check-auth')
      .set('Authorization', 'Bearer invalidtoken');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Activity Routes', () => {
  let token;
  
  beforeAll(() => {
    token = generateToken();
  });
  
  test('GET /api/activities/:userId - Get all activities for a user', async () => {
    const response = await request(app)
      .get(`/api/activities/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test('POST /api/activities - Create a new activity', async () => {
    const response = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: testUser.id,
        name: 'Test Activity',
        unit: 'reps'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('name', 'Test Activity');
    expect(response.body).toHaveProperty('unit', 'reps');
    expect(response.body).toHaveProperty('user_id', testUser.id);
  });
  
  test('GET /api/activities/:userId - Unauthorized access', async () => {
    const response = await request(app)
      .get('/api/activities/999') // Different user ID
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Log Routes', () => {
  let token;
  let activityId;
  
  beforeAll(async () => {
    token = generateToken();
    
    // Create a test activity to use for logs
    const activityResponse = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: testUser.id,
        name: 'Test Activity for Logs',
        unit: 'reps'
      });
    
    activityId = activityResponse.body.activity_type_id;
  });
  
  test('POST /api/logs - Create a new log entry', async () => {
    const response = await request(app)
      .post('/api/logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        activityTypeId: activityId,
        userId: testUser.id,
        count: 10,
        loggedAt: new Date().toISOString(),
        notes: 'Test log entry'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('log');
    expect(response.body.log).toHaveProperty('activity_type_id', activityId);
    expect(response.body.log).toHaveProperty('count', 10);
    expect(response.body.log).toHaveProperty('notes', 'Test log entry');
  });
  
  test('GET /api/logs/:userId/:activityTypeId - Get logs for an activity', async () => {
    const response = await request(app)
      .get(`/api/logs/${testUser.id}/${activityId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test('GET /api/logs/stats/:userId/:activityTypeId - Get activity stats', async () => {
    const response = await request(app)
      .get(`/api/logs/stats/${testUser.id}/${activityId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('today');
    expect(response.body).toHaveProperty('week');
    expect(response.body).toHaveProperty('month');
    expect(response.body).toHaveProperty('year');
    expect(response.body).toHaveProperty('unit');
  });
});

describe('Goal Routes', () => {
  let token;
  let activityId;
  
  beforeAll(async () => {
    token = generateToken();
    
    // Create a test activity to use for goals
    const activityResponse = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: testUser.id,
        name: 'Test Activity for Goals',
        unit: 'reps'
      });
    
    activityId = activityResponse.body.activity_type_id;
  });
  
  test('POST /api/goals - Create a new goal', async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days from now
    
    const response = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: testUser.id,
        activityTypeId: activityId,
        targetCount: 100,
        periodType: 'weekly',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('activity_type_id', activityId);
    expect(response.body).toHaveProperty('target_count', 100);
    expect(response.body).toHaveProperty('period_type', 'weekly');
  });
  
  test('GET /api/goals/:userId - Get all goals for a user', async () => {
    const response = await request(app)
      .get(`/api/goals/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test('GET /api/goals/:userId/:activityTypeId - Get goals for an activity', async () => {
    const response = await request(app)
      .get(`/api/goals/${testUser.id}/${activityId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('Achievement Routes', () => {
  let token;
  
  beforeAll(() => {
    token = generateToken();
  });
  
  test('GET /api/achievements/types - Get all achievement types', async () => {
    const response = await request(app)
      .get('/api/achievements/types')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test('GET /api/achievements/:userId - Get all achievements for a user', async () => {
    const response = await request(app)
      .get(`/api/achievements/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test('GET /api/achievements/check/:userId - Check for new achievements', async () => {
    const response = await request(app)
      .get(`/api/achievements/check/${testUser.id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('newAchievements');
    expect(response.body).toHaveProperty('count');
  });
});
