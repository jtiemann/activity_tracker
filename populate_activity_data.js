const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'activity_tracker',
  password: process.env.DB_PASSWORD || 'kermit',
  port: process.env.DB_PORT || 5432,
});

async function populateActivities() {
  try {
    // First, get user ID for jtiemann
    const userResult = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      ['jtiemann']
    );
    
    if (userResult.rows.length === 0) {
      console.error('User jtiemann not found! Please run add_test_user.js first.');
      process.exit(1);
    }
    
    const userId = userResult.rows[0].user_id;
    console.log(`Found user jtiemann with ID: ${userId}`);
    
    // Check if activities exist for user, create them if not
    const activities = [
      { name: 'Push-ups', unit: 'reps' },
      { name: 'Pull-ups', unit: 'reps' },
      { name: 'Spaziergehen', unit: 'km' }
    ];
    
    const activityIds = {};
    
    for (const activity of activities) {
      // Check if activity exists
      const activityResult = await pool.query(
        'SELECT activity_type_id FROM activity_types WHERE user_id = $1 AND name = $2',
        [userId, activity.name]
      );
      
      if (activityResult.rows.length === 0) {
        // Create activity
        const newActivityResult = await pool.query(
          'INSERT INTO activity_types (user_id, name, unit, category) VALUES ($1, $2, $3, $4) RETURNING activity_type_id',
          [userId, activity.name, activity.unit, getCategory(activity.name)]
        );
        
        activityIds[activity.name] = newActivityResult.rows[0].activity_type_id;
        console.log(`Created activity "${activity.name}" with ID ${activityIds[activity.name]}`);
      } else {
        activityIds[activity.name] = activityResult.rows[0].activity_type_id;
        console.log(`Found existing activity "${activity.name}" with ID ${activityIds[activity.name]}`);
      }
    }
    
    // Generate logs for the past 60 days with randomized data
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 60);
    
    // Clear existing logs for these activities in this date range
    for (const activityName in activityIds) {
      await pool.query(
        'DELETE FROM activity_logs WHERE user_id = $1 AND activity_type_id = $2 AND logged_at >= $3',
        [userId, activityIds[activityName], startDate]
      );
      console.log(`Cleared existing logs for activity "${activityName}"`);
    }
    
    // Add logs with patterns
    console.log(`Generating logs from ${startDate.toISOString()} to ${now.toISOString()}`);
    
    // Push-ups: Gradual improvement pattern with some variation
    let pushupBase = 20;
    let pushupImprovement = 0.5;
    
    // Pull-ups: Weekly pattern with improvement
    let pullupBase = 5;
    let pullupImprovement = 0.2;
    
    // Walking: Higher on weekends, occasional long walks
    let walkingWeekdayBase = 2;
    let walkingWeekendBase = 5;
    
    // Counter for logs
    let logsAdded = 0;
    
    // Loop through each day
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const currentDay = new Date(d);
      
      // Random variation function
      const vary = (base, percent) => base * (1 + (Math.random() * percent * 2 - percent));
      
      // Generate push-up logs (usually daily with some missed days)
      if (Math.random() > 0.15) { // 85% chance to log push-ups
        // Morning session
        const morningCount = Math.round(vary(pushupBase, 0.2));
        const morningDate = new Date(currentDay);
        morningDate.setHours(7 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
        
        await pool.query(
          'INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at, notes) VALUES ($1, $2, $3, $4, $5)',
          [activityIds['Push-ups'], userId, morningCount, morningDate, 'Morning workout']
        );
        logsAdded++;
        
        // Sometimes do evening push-ups too
        if (Math.random() > 0.6) {
          const eveningCount = Math.round(vary(pushupBase * 0.8, 0.2));
          const eveningDate = new Date(currentDay);
          eveningDate.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
          
          await pool.query(
            'INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at, notes) VALUES ($1, $2, $3, $4, $5)',
            [activityIds['Push-ups'], userId, eveningCount, eveningDate, 'Evening workout']
          );
          logsAdded++;
        }
        
        // Increase base push-ups gradually
        pushupBase += pushupImprovement;
      }
      
      // Generate pull-up logs (less frequent)
      if (dayOfWeek === 1 || dayOfWeek === 4 || Math.random() > 0.8) { // Mondays, Thursdays, and 20% random days
        const pullupCount = Math.round(vary(pullupBase, 0.3));
        const pullupDate = new Date(currentDay);
        pullupDate.setHours(18 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
        
        await pool.query(
          'INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at, notes) VALUES ($1, $2, $3, $4, $5)',
          [activityIds['Pull-ups'], userId, pullupCount, pullupDate, Math.random() > 0.8 ? 'Feeling strong!' : '']
        );
        logsAdded++;
        
        // Increase base pull-ups gradually
        pullupBase += pullupImprovement;
      }
      
      // Generate walking logs (more on weekends, occasional walk on weekdays)
      if (isWeekend || Math.random() > 0.5) {
        const walkingBase = isWeekend ? walkingWeekendBase : walkingWeekdayBase;
        const walkingCount = Math.round(vary(walkingBase, 0.4) * 10) / 10; // 1 decimal place
        const walkingDate = new Date(currentDay);
        walkingDate.setHours(14 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);
        
        // Notes with more variety for walking
        let notes = '';
        if (walkingCount > walkingBase * 1.3) {
          notes = 'Long walk today!';
        } else if (Math.random() > 0.7) {
          const walkingNotes = [
            'Nice weather',
            'Park route',
            'With friend',
            'City center',
            'Forest trail',
            'Riverside',
            'With dog',
            'Shopping trip'
          ];
          notes = walkingNotes[Math.floor(Math.random() * walkingNotes.length)];
        }
        
        await pool.query(
          'INSERT INTO activity_logs (activity_type_id, user_id, count, logged_at, notes) VALUES ($1, $2, $3, $4, $5)',
          [activityIds['Spaziergehen'], userId, walkingCount, walkingDate, notes]
        );
        logsAdded++;
      }
    }
    
    console.log(`Successfully added ${logsAdded} activity logs for user jtiemann!`);
    console.log('The charts should now display meaningful data.');
    
  } catch (error) {
    console.error('Error populating activity data:', error);
  } finally {
    // Close the database connection
    pool.end();
  }
}

// Helper function to determine category based on activity name
function getCategory(activityName) {
  activityName = activityName.toLowerCase();
  
  if (activityName.includes('push') || activityName.includes('pull')) {
    return 'strength';
  }
  
  if (activityName.includes('walk') || activityName.includes('spazier') || activityName.includes('run')) {
    return 'cardio';
  }
  
  return 'other';
}

// Run the function
populateActivities()
  .then(() => {
    console.log('Activity data population completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to populate activity data:', error);
    process.exit(1);
  });
