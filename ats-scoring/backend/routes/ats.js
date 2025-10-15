const express = require('express');
const { authenticateToken, requireStudent } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { 
  scoreResumeValidation, 
  scoreResume, 
  getAnalysisHistory, 
  getAnalysisDetails, 
  getJobRecommendations 
} = require('../controllers/atsController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Score resume route
router.post('/score', 
  upload.single('resume'),
  handleUploadError,
  scoreResumeValidation,
  scoreResume
);

// Get analysis history
router.get('/history', requireStudent, getAnalysisHistory);

// Get specific analysis details
router.get('/analysis/:analysisId', requireStudent, getAnalysisDetails);

// Get job recommendations
router.get('/recommendations', requireStudent, getJobRecommendations);

module.exports = router;
