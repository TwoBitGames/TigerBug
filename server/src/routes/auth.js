const express = require('express');
const router = express.Router();
const {
    validateRegister, 
    validateLogin, 
    validateVerifyEmail,
    validateResendVerification,
    validateUpdateProfile,
    register, 
    login, 
    getProfile,
    updateProfile,
    checkOnboardingStatus, 
    setupFirstAdmin,
    verifyEmail,
    resendVerificationCode
} = require('../controllers/authController');
const {authenticateToken} = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

router.post('/verify-email', validateVerifyEmail, verifyEmail);
router.post('/resend-verification', validateResendVerification, resendVerificationCode);

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateUpdateProfile, updateProfile);

router.get('/onboarding-status', checkOnboardingStatus);
router.post('/setup-first-admin', validateRegister, setupFirstAdmin);

module.exports = router;
