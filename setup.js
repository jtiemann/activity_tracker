const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up Activity Tracker App with improvements...');

// Create necessary directories
const directories = ['logs', 'test/fixtures'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully!');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}

// Check if config.env exists, create if not
const configPath = path.join(__dirname, 'config.env');
if (!fs.existsSync(configPath)) {
  console.log('Creating config.env file...');
  try {
    const sampleConfig = `# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=activity_tracker
DB_PASSWORD=kermit
DB_PORT=5432

# Server Configuration
PORT=3001

# JWT Secret (replace with a secure random string in production)
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
JWT_EXPIRY=24h

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Email Configuration (optional, update with your SMTP settings)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=user@example.com
EMAIL_PASSWORD=yourpassword
EMAIL_FROM=noreply@activitytracker.app`;

    fs.writeFileSync(configPath, sampleConfig);
    console.log('Config file created successfully!');
  } catch (error) {
    console.error('Error creating config file:', error.message);
  }
}

// Update database schema
console.log('Updating database schema...');
try {
  execSync('psql -U postgres -f update_db.sql', { stdio: 'inherit' });
  console.log('Database schema updated successfully!');
} catch (error) {
  console.error('Error updating database schema:', error.message);
  console.log('Please make sure PostgreSQL is running and update_db.sql exists.');
  console.log('You may need to run the SQL script manually:');
  console.log('psql -U postgres -f update_db.sql');
}

// Add activity categories to existing activities
console.log('Adding categories to existing activities...');
try {
  const addCategoriesScript = `
  const pool = require('./models/db');

  async function addCategories() {
    try {
      // Add default categories to existing activities based on name
      const activities = await pool.query('SELECT * FROM activity_types');
      
      for (const activity of activities.rows) {
        let category = 'other';
        
        // Try to determine category based on activity name
        const name = activity.name.toLowerCase();
        
        if (name.includes('run') || name.includes('walk') || name.includes('jog') || name.includes('hike')) {
          category = 'cardio';
        } else if (name.includes('push') || name.includes('pull') || name.includes('sit') || name.includes('squat')) {
          category = 'strength';
        } else if (name.includes('meditat') || name.includes('yoga') || name.includes('stretch')) {
          category = 'wellness';
        } else if (name.includes('read') || name.includes('study') || name.includes('learn')) {
          category = 'learning';
        }
        
        // Update the activity with the category
        await pool.query(
          'UPDATE activity_types SET category = $1 WHERE activity_type_id = $2',
          [category, activity.activity_type_id]
        );
        
        console.log(\`Set category "\${category}" for activity "\${activity.name}"\`);
      }
      
      console.log('Categories added successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Error adding categories:', error);
      process.exit(1);
    }
  }

  addCategories();
  `;
  
  const scriptPath = path.join(__dirname, 'add-categories.js');
  fs.writeFileSync(scriptPath, addCategoriesScript);
  
  execSync('node add-categories.js', { stdio: 'inherit' });
  
  // Clean up temporary script
  fs.unlinkSync(scriptPath);
} catch (error) {
  console.error('Error adding categories:', error.message);
}

console.log('\nSetup completed!');
console.log('\nTo start the application, run:');
console.log('npm start');
console.log('\nTo run tests:');
console.log('npm test');
