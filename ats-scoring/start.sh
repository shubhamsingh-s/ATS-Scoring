#!/bin/bash

echo "🚀 Starting ATS Scoring System..."

# Check if .env file exists
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file..."
    cp backend/env.example backend/.env
    echo "✅ .env file created. Please update database credentials if needed."
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Test setup
echo "🧪 Testing setup..."
node test-setup.js

if [ $? -eq 0 ]; then
    echo "✅ Backend setup complete!"
    echo "🌐 Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    
    # Install frontend dependencies
    echo "📦 Installing frontend dependencies..."
    cd ../frontend
    npm install
    
    echo "✅ Frontend setup complete!"
    echo "🌐 Starting frontend server..."
    npm start &
    FRONTEND_PID=$!
    
    echo ""
    echo "🎉 ATS Scoring System is running!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
    echo "👤 Admin Login: admin@ats-scoring.com / admin123"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    
    # Wait for user interrupt
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
else
    echo "❌ Setup failed. Please check the error messages above."
    exit 1
fi
