const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { registerValidation, loginValidation, register, login, getProfile, updateProfile } = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
