const express = require('express');
const router = express.Router();
const {validateRegister, validateLogin, register, login, getProfile, checkOnboardingStatus, setupFirstAdmin} = require('../controllers/authController');
const {authenticateToken} = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

router.get('/profile', authenticateToken, getProfile);

router.get('/onboarding-status', checkOnboardingStatus);
router.post('/setup-first-admin', validateRegister, setupFirstAdmin);

module.exports = router;
