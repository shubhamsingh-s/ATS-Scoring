const express = require('express');
const { authenticateToken, requireRecruiter, requireAdmin } = require('../middleware/auth');
const { 
  createJobValidation, 
  updateJobValidation, 
  createJob, 
  getAllJobs, 
  getJobById, 
  getRecruiterJobs, 
  updateJob, 
  deleteJob 
} = require('../controllers/jobController');

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllJobs);
router.get('/:jobId', getJobById);

// Protected routes
router.use(authenticateToken);

// Recruiter routes
router.post('/', requireRecruiter, createJobValidation, createJob);
router.get('/recruiter/my-jobs', requireRecruiter, getRecruiterJobs);
router.put('/:jobId', requireRecruiter, updateJobValidation, updateJob);
router.delete('/:jobId', requireRecruiter, deleteJob);

module.exports = router;
