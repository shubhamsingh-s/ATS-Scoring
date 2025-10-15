@echo off
echo 🚀 Starting ATS Scoring System...

REM Check if .env file exists
if not exist backend\.env (
    echo 📝 Creating .env file...
    copy backend\env.example backend\.env
    echo ✅ .env file created. Please update database credentials if needed.
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install

REM Test setup
echo 🧪 Testing setup...
node test-setup.js

if %errorlevel% equ 0 (
    echo ✅ Backend setup complete!
    echo 🌐 Starting backend server...
    start "Backend Server" cmd /k "npm run dev"
    
    REM Install frontend dependencies
    echo 📦 Installing frontend dependencies...
    cd ..\frontend
    call npm install
    
    echo ✅ Frontend setup complete!
    echo 🌐 Starting frontend server...
    start "Frontend Server" cmd /k "npm start"
    
    echo.
    echo 🎉 ATS Scoring System is running!
    echo 📱 Frontend: http://localhost:3000
    echo 🔧 Backend API: http://localhost:5000
    echo 👤 Admin Login: admin@ats-scoring.com / admin123
    echo.
    echo Both servers are running in separate windows.
    echo Close the windows to stop the servers.
    
    pause
) else (
    echo ❌ Setup failed. Please check the error messages above.
    pause
    exit /b 1
)
