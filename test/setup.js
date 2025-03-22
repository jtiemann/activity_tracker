// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.PORT = 3002; // Use a different port for testing

// Create a test database connection
process.env.DB_USER = 'postgres';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'activity_tracker';
process.env.DB_PASSWORD = 'kermit';
process.env.DB_PORT = 5432;

// Mock services that don't need to actually execute in tests
jest.mock('../services/emailService', () => {
  return {
    sendEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendWeeklyReport: jest.fn().mockResolvedValue(true),
    sendActivityReminder: jest.fn().mockResolvedValue(true),
    sendGoalAchievedEmail: jest.fn().mockResolvedValue(true),
    sendAchievementEmail: jest.fn().mockResolvedValue(true)
  };
});

// Mock the database connection for tests
jest.mock('../models/db', () => {
  const mockQuery = jest.fn();
  
  // Default implementation returns empty array
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  
  // Mock specific queries as needed
  mockQuery.mockImplementation((text, params) => {
    // Mock user login query
    if (text.includes('SELECT * FROM users WHERE username = $1') && params[0] === 'jtiemann') {
      return {
        rows: [{
          user_id: 1,
          username: 'jtiemann',
          email: 'jtiemann@example.com',
          password_hash: '$2b$10$wA33t9fmIMM2lKb3/FNBBOWrmz0RLWwFi.oqcCH4dKULJdbKdVDd.'
        }],
        rowCount: 1
      };
    }
    
    // Mock activities query
    if (text.includes('SELECT * FROM activity_types WHERE user_id = $1')) {
      return {
        rows: [
          { activity_type_id: 1, user_id: params[0], name: 'Running', unit: 'miles', category: 'cardio' },
          { activity_type_id: 2, user_id: params[0], name: 'Push-ups', unit: 'reps', category: 'strength' }
        ],
        rowCount: 2
      };
    }
    
    // Mock logs query
    if (text.includes('SELECT * FROM activity_logs WHERE user_id = $1 AND activity_type_id = $2')) {
      return {
        rows: [
          {
            log_id: 1,
            activity_type_id: params[1],
            user_id: params[0],
            count: 10,
            logged_at: new Date(),
            notes: 'Test log'
          }
        ],
        rowCount: 1
      };
    }
    
    // Mock stats queries
    if (text.includes('COALESCE(SUM(count), 0) as total')) {
      return { rows: [{ total: 25 }] };
    }
    
    // Default response for other queries
    return { rows: [], rowCount: 0 };
  });
  
  return {
    query: mockQuery,
    end: jest.fn(),
    on: jest.fn()
  };
});

// Global teardown after all tests
afterAll(async () => {
  // Add any necessary cleanup here
  jest.clearAllMocks();
});
