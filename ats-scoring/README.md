# ATS Resume Scoring + Job Portal Web App

A complete full-stack web application for ATS (Applicant Tracking System) resume scoring and job portal functionality, built with React, Node.js, Express, and MySQL.

## 🚀 Features

### 🔐 Authentication & Roles
- **Admin**: Platform management, user oversight, analytics
- **Recruiter**: Job posting, applicant management, ATS score viewing
- **Student**: Resume upload, ATS scoring, job applications

### 📊 ATS Scoring System
- Resume analysis using AI/ML model from [ATS-SCORING-SYSTEM](https://github.com/shubhamsingh-s/ATS-SCORING-SYSTEM.git)
- Score calculation (0-100%)
- Skills matching and keyword analysis
- Detailed recommendations for improvement
- Missing skills and contact information detection

### 💼 Job Portal Features
- Job posting and management
- Application tracking
- Resume-based job recommendations
- ATS score integration for recruiters

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **JWT** authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing
- **Express Rate Limiting** for security

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management

### AI/ML Integration
- Custom ATS scoring model
- Resume text extraction (PDF/DOCX)
- Skills and keyword matching
- Entity recognition

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ats-scoring
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ats_scoring_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Admin Credentials
ADMIN_EMAIL=admin@ats-scoring.com
ADMIN_PASSWORD=admin123

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Setup
1. Create a MySQL database named `ats_scoring_db`
2. The application will automatically create tables on first run

### 5. Start the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👤 Default Admin Credentials

- **Email**: admin@ats-scoring.com
- **Password**: admin123

## 📁 Project Structure

```
ats-scoring/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication & upload middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── uploads/         # File upload directory
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utility functions
│   └── public/          # Static files
└── ats-model/           # ATS scoring model (cloned)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Jobs
- `GET /api/jobs` - Get all jobs (public)
- `GET /api/jobs/:id` - Get job by ID (public)
- `POST /api/jobs` - Create job (recruiter)
- `GET /api/jobs/recruiter/my-jobs` - Get recruiter's jobs
- `PUT /api/jobs/:id` - Update job (recruiter)
- `DELETE /api/jobs/:id` - Delete job (recruiter)

### Applications
- `POST /api/applications/apply` - Apply for job (student)
- `GET /api/applications/my-applications` - Get student applications
- `GET /api/applications/job/:id/applicants` - Get job applicants (recruiter)
- `PUT /api/applications/:id/status` - Update application status (recruiter)

### ATS Scoring
- `POST /api/ats/score` - Score resume
- `GET /api/ats/history` - Get analysis history (student)
- `GET /api/ats/analysis/:id` - Get analysis details
- `GET /api/ats/recommendations` - Get job recommendations

### Admin (Users)
- `GET /api/users` - Get all users (admin)
- `GET /api/users/stats` - Get platform statistics
- `GET /api/users/logs` - Get activity logs
- `PUT /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user

## 🎯 Usage Guide

### For Students
1. Register as a student
2. Upload your resume (PDF/DOCX)
3. Get ATS score and recommendations
4. Browse and apply to jobs
5. View personalized job recommendations

### For Recruiters
1. Register as a recruiter
2. Post job openings
3. View applicants with ATS scores
4. Shortlist or reject candidates
5. Manage job postings

### For Admins
1. Login with admin credentials
2. View platform analytics
3. Manage users and roles
4. Monitor activity logs
5. Oversee all jobs and applications

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting
- File upload validation
- CORS protection
- Helmet.js security headers

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Update database credentials
3. Use PM2 or similar process manager
4. Configure reverse proxy (nginx)

### Frontend Deployment
1. Run `npm run build`
2. Serve static files
3. Update API URL for production
4. Configure HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

## 🔄 Future Enhancements

- [ ] Advanced resume parsing
- [ ] Email notifications
- [ ] Real-time chat
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Integration with job boards
- [ ] Advanced ATS scoring algorithms
