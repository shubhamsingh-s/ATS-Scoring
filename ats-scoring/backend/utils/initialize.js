const { testConnection, initializeDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');

const initializeApp = async () => {
  try {
    console.log('Initializing application...');
    
    // Test database connection
    await testConnection();
    
    // Initialize database tables
    await initializeDatabase();
    
    // Create admin user if it doesn't exist
    await createAdminUser();
    
    console.log('Application initialized successfully!');
  } catch (error) {
    console.error('Application initialization failed:', error);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  const { pool } = require('../config/database');
  
  try {
    // Check if admin user exists
    const [existingAdmins] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [process.env.ADMIN_EMAIL || 'admin@ats-scoring.com']
    );

    if (existingAdmins.length === 0) {
      // Create admin user
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'admin123', 
        saltRounds
      );

      await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [
          'System Administrator',
          process.env.ADMIN_EMAIL || 'admin@ats-scoring.com',
          hashedPassword,
          'admin'
        ]
      );

      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

module.exports = { initializeApp };
