const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const atsRoutes = require('./routes/ats');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-frontend-domain.com' : 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// React frontend is deployed separately on Netlify

// Serve a plain HTML/CSS (vanilla) frontend from ../frontend-vanilla at /vanilla when present
const vanillaFrontendPath = path.join(__dirname, '..', 'frontend-vanilla');
if (fs.existsSync(vanillaFrontendPath)) {
  // Serve static assets (css, js, images) from the vanilla frontend folder under /vanilla
  app.use('/vanilla', express.static(vanillaFrontendPath));

  // Serve admin dashboard specifically at /vanilla/admin
  app.get('/vanilla/admin', (req, res, next) => {
    const adminFile = path.join(vanillaFrontendPath, 'admin-dashboard.html');
    if (fs.existsSync(adminFile)) return res.sendFile(adminFile);
    return next();
  });

  // For any other /vanilla GET request, serve the vanilla index.html if it exists
  app.get('/vanilla/*', (req, res, next) => {
    const indexFile = path.join(vanillaFrontendPath, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    return next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ats', atsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const { initializeApp } = require('./utils/initialize');

const PORT = process.env.PORT || 5000;

// Initialize application before starting server
initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Admin credentials:`);
    console.log(`  Email: ${process.env.ADMIN_EMAIL || 'admin@ats-scoring.com'}`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
