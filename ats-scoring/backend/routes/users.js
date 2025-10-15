const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const { 
  getAllUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser, 
  getPlatformStats, 
  getActivityLogs 
} = require('../controllers/userController');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// User management routes
router.get('/', getAllUsers);
router.get('/stats', getPlatformStats);
router.get('/logs', getActivityLogs);
router.get('/:userId', getUserById);
router.put('/:userId/role', 
  body('role').isIn(['admin', 'student', 'recruiter']).withMessage('Invalid role'),
  updateUserRole
);
router.delete('/:userId', deleteUser);

module.exports = router;
