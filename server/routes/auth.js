const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(auth); // All routes below require authentication

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/logout', logout);

module.exports = router;
