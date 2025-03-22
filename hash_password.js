const bcrypt = require('bcrypt');

// Function to hash a password
async function hashPassword(plainPassword) {
  const saltRounds = 10;
  try {
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    console.log(`Password: ${plainPassword}`);
    console.log(`Hashed password: ${hash}`);
    return hash;
  } catch (err) {
    console.error('Error hashing password:', err);
    throw err;
  }
}

// If this script is run directly, hash the password provided as an argument
if (require.main === module) {
  const password = process.argv[2];
  if (!password) {
    console.error('Please provide a password as a command-line argument.');
    console.log('Usage: node hash_password.js yourpassword');
    process.exit(1);
  }
  
  hashPassword(password)
    .then(() => {
      console.log('Done. Use the hashed password in your database.');
    })
    .catch(err => {
      console.error('Failed to hash password:', err);
      process.exit(1);
    });
}

module.exports = { hashPassword };
