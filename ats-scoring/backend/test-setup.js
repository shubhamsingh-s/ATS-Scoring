const { testConnection, initializeDatabase } = require('./config/database');

async function testSetup() {
  console.log('🧪 Testing ATS Scoring System Setup...\n');
  
  try {
    console.log('1. Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful\n');
    
    console.log('2. Initializing database tables...');
    await initializeDatabase();
    console.log('✅ Database tables initialized\n');
    
    console.log('3. Testing ATS scoring module...');
    const { analyzeResume } = require('./utils/atsScoring');
    console.log('✅ ATS scoring module loaded\n');
    
    console.log('🎉 All tests passed! The system is ready to run.');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend: cd ../frontend && npm start');
    console.log('3. Visit http://localhost:3000');
    console.log('4. Login with admin credentials: admin@ats-scoring.com / admin123');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Ensure the database "ats_scoring_db" exists');
    process.exit(1);
  }
}

testSetup();
