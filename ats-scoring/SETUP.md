# Quick Setup Guide

## 🚀 Quick Start (Windows)

1. **Prerequisites**: Make sure you have Node.js and MySQL installed
2. **Database**: Create a MySQL database named `ats_scoring_db`
3. **Run**: Double-click `start.bat` or run `start.bat` in command prompt

## 🚀 Quick Start (Linux/Mac)

1. **Prerequisites**: Make sure you have Node.js and MySQL installed
2. **Database**: Create a MySQL database named `ats_scoring_db`
3. **Run**: `chmod +x start.sh && ./start.sh`

## 🔧 Manual Setup

### Backend
```bash
cd backend
npm install
# Update .env file with your database credentials
npm test  # Test setup
npm run dev  # Start server
```

### Frontend
```bash
cd frontend
npm install
npm start  # Start React app
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Login**: admin@ats-scoring.com / admin123

## 📋 Default Credentials

- **Admin**: admin@ats-scoring.com / admin123
- **Register** new users as students or recruiters

## 🧪 Testing

Run `npm test` in the backend directory to verify:
- Database connection
- Table creation
- ATS scoring module loading

## 🔧 Troubleshooting

1. **Database Connection Error**: Check MySQL is running and credentials in `.env`
2. **Port Already in Use**: Change PORT in `.env` file
3. **File Upload Issues**: Check uploads directory permissions
4. **Frontend Build Error**: Clear node_modules and reinstall

## 📚 Features Available

✅ **Completed**:
- User authentication (login/register)
- Role-based access control
- ATS resume scoring
- Job posting and browsing
- Application management
- Student dashboard
- Admin dashboard (basic)

🚧 **In Progress**:
- Recruiter dashboard
- Advanced admin features
- Resume upload interface
- Detailed analytics

## 🎯 Next Steps

1. Test the application with sample data
2. Customize the ATS scoring algorithm
3. Add more job categories and skills
4. Implement email notifications
5. Add advanced analytics
