const express = require('express');
const { authenticateToken, requireStudent, requireRecruiter, requireAdmin } = require('../middleware/auth');
const { 
  applyJobValidation, 
  updateApplicationValidation, 
  applyForJob, 
  getStudentApplications, 
  getJobApplicants, 
  updateApplicationStatus, 
  getAllApplications 
} = require('../controllers/applicationController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Student routes
router.post('/apply', requireStudent, applyJobValidation, applyForJob);
router.get('/my-applications', requireStudent, getStudentApplications);

// Recruiter routes
router.get('/job/:jobId/applicants', requireRecruiter, getJobApplicants);
router.put('/:applicationId/status', requireRecruiter, updateApplicationValidation, updateApplicationStatus);

// Admin routes
router.get('/all', requireAdmin, getAllApplications);

module.exports = router;
