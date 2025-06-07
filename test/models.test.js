const User = require('../models/user');
const Activity = require('../models/activity');
const Log = require('../models/log');
const Goal = require('../models/goal');
const db = require('../models/db');

// Mock the database responses
jest.mock('../models/db');

describe('User Model', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up mock response for user queries
    db.query.mockImplementation((text, params) => {
      if (text.includes('SELECT') && params && params[0] === 1) {
        return {
          rows: [{
            user_id: 1,
            username: 'testuser',
            email: 'test@example.com'
          }]
        };
      }
      return { rows: [] };
    });
  });
  
  test('getById returns user data', async () => {
    const user = await User.getById(1);
    
    expect(db.query).toHaveBeenCalled();
    expect(user).toHaveProperty('user_id', 1);
    expect(user).toHaveProperty('username', 'testuser');
    expect(user).toHaveProperty('email', 'test@example.com');
  });
  
  test('getByUsername returns user with password hash', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword'
      }]
    });
    
    const user = await User.getByUsername('testuser');
    
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM users WHERE username = $1'),
      ['testuser']
    );
    expect(user).toHaveProperty('password_hash');
  });
});

describe('Goal Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    db.query.mockImplementation((text, params) => {
      if (text.includes('FROM activity_goals') && text.includes('WHERE g.user_id = $1') && !text.includes('AND g.activity_type_id = $2')) {
        return {
          rows: [
            { goal_id: 1, user_id: params[0], activity_type_id: 1, target_count: 10, period_type: 'daily', start_date: new Date('2024-01-01'), end_date: new Date('2024-01-31'), activity_name: 'Run', unit: 'miles' },
            { goal_id: 2, user_id: params[0], activity_type_id: 2, target_count: 20, period_type: 'weekly', start_date: new Date('2024-02-01'), end_date: new Date('2024-02-28'), activity_name: 'Swim', unit: 'laps' }
          ]
        };
      }

      if (text.includes('FROM activity_goals') && text.includes('WHERE g.user_id = $1 AND g.activity_type_id = $2')) {
        return {
          rows: [
            { goal_id: 3, user_id: params[0], activity_type_id: params[1], target_count: 15, period_type: 'weekly', start_date: new Date('2024-03-01'), end_date: new Date('2024-03-31'), activity_name: 'Swim', unit: 'laps' }
          ]
        };
      }

      if (text.includes('WHERE g.goal_id = $1')) {
        return {
          rows: [
            { goal_id: params[0], user_id: 1, activity_type_id: 1, target_count: 100, period_type: 'daily', start_date: new Date('2024-01-01'), end_date: new Date('2024-01-31'), activity_name: 'Run', unit: 'miles' }
          ]
        };
      }

      if (text.includes('COALESCE(SUM(count), 0) as total')) {
        return { rows: [{ total: 40 }] };
      }

      return { rows: [] };
    });
  });

  test('getAllForUser returns goals for a user', async () => {
    const goals = await Goal.getAllForUser(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM activity_goals'),
      [1]
    );
    expect(goals).toHaveLength(2);
    expect(goals[0]).toHaveProperty('goal_id', 1);
  });

  test('getForActivity returns goals for a specific activity', async () => {
    const goals = await Goal.getForActivity(1, 2);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND g.activity_type_id = $2'),
      [1, 2]
    );
    expect(goals).toHaveLength(1);
    expect(goals[0]).toHaveProperty('activity_type_id', 2);
  });

  test('getProgress calculates progress for a goal', async () => {
    const progress = await Goal.getProgress(1);

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(progress).toMatchObject({
      currentCount: 40,
      targetCount: 100,
      progressPercent: 40,
      remaining: 60,
      completed: false
    });
    expect(progress.startDate).toBeInstanceOf(Date);
    expect(progress.endDate).toBeInstanceOf(Date);
  });
});

describe('Activity Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock response for activity queries
    db.query.mockImplementation((text, params) => {
      if (text.includes('SELECT * FROM activity_types WHERE user_id = $1')) {
        return {
          rows: [
            { activity_type_id: 1, user_id: params[0], name: 'Running', unit: 'miles', category: 'cardio' },
            { activity_type_id: 2, user_id: params[0], name: 'Push-ups', unit: 'reps', category: 'strength' }
          ]
        };
      }
      return { rows: [] };
    });
  });
  
  test('getAllForUser returns activities for a user', async () => {
    const activities = await Activity.getAllForUser(1);
    
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM activity_types WHERE user_id = $1'),
      [1]
    );
    expect(activities).toHaveLength(2);
    expect(activities[0]).toHaveProperty('name', 'Running');
    expect(activities[1]).toHaveProperty('name', 'Push-ups');
  });
  
  test('create adds a new activity', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ activity_type_id: 3, user_id: 1, name: 'Swimming', unit: 'laps', category: 'cardio' }]
    });
    
    const activity = await Activity.create(1, 'Swimming', 'laps');
    
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO activity_types'),
      [1, 'Swimming', 'laps']
    );
    expect(activity).toHaveProperty('name', 'Swimming');
    expect(activity).toHaveProperty('unit', 'laps');
  });
});

describe('Log Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock response for log queries
    db.query.mockImplementation((text, params) => {
      if (text.includes('SELECT * FROM activity_logs WHERE user_id = $1 AND activity_type_id = $2')) {
        return {
          rows: [
            { 
              log_id: 1, 
              activity_type_id: params[1], 
              user_id: params[0], 
              count: 5, 
              logged_at: new Date(), 
              notes: 'First log' 
            },
            { 
              log_id: 2, 
              activity_type_id: params[1], 
              user_id: params[0], 
              count: 10, 
              logged_at: new Date(), 
              notes: 'Second log' 
            }
          ]
        };
      }
      
      if (text.includes('COALESCE(SUM(count), 0) as total')) {
        return { rows: [{ total: 15 }] };
      }
      
      return { rows: [] };
    });
  });
  
  test('getForActivity returns logs for a specific activity', async () => {
    const logs = await Log.getForActivity(1, 1);
    
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM activity_logs WHERE user_id = $1 AND activity_type_id = $2'),
      [1, 1, 100, 0]
    );
    expect(logs).toHaveLength(2);
    expect(logs[0]).toHaveProperty('log_id', 1);
    expect(logs[1]).toHaveProperty('log_id', 2);
  });
  
  test('create adds a new log entry', async () => {
    const now = new Date();
    db.query.mockResolvedValueOnce({
      rows: [{ log_id: 3, activity_type_id: 1, user_id: 1, count: 15, logged_at: now, notes: 'Test log' }]
    });
    
    const log = await Log.create(1, 1, 15, now, 'Test log');
    
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO activity_logs'),
      [1, 1, 15, now, 'Test log']
    );
    expect(log).toHaveProperty('log_id', 3);
    expect(log).toHaveProperty('count', 15);
    expect(log).toHaveProperty('notes', 'Test log');
  });
  
  test('getStats returns activity statistics', async () => {
    const mockUnitResult = { rows: [{ unit: 'miles' }] };
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 5 }] })  // today
      .mockResolvedValueOnce({ rows: [{ total: 20 }] }) // week
      .mockResolvedValueOnce({ rows: [{ total: 50 }] }) // month
      .mockResolvedValueOnce({ rows: [{ total: 200 }] }) // year
      .mockResolvedValueOnce(mockUnitResult);  // unit
    
    const stats = await Log.getStats(1, 1);
    
    expect(db.query).toHaveBeenCalledTimes(5);
    expect(stats).toEqual({
      today: 5,
      week: 20,
      month: 50,
      year: 200,
      unit: 'miles'
    });
  });
});
