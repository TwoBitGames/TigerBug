const express = require('express');
const router = express.Router();
const {
    validateRegister, 
    validateLogin, 
    validateVerifyEmail,
    validateResendVerification,
    validateUpdateProfile,
    validateForgotPassword,
    validateResetPassword,
    register, 
    login, 
    getProfile,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    checkOnboardingStatus, 
    setupFirstAdmin,
    verifyEmail,
    resendVerificationCode,
    getProjectAssignmentStatus,
    getUserProjectMemberships,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const {authenticateToken} = require('../middleware/auth');
const {profileUploadMiddleware, handleProfileUploadError} = require('../middleware/profileUpload');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

router.post('/verify-email', validateVerifyEmail, verifyEmail);
router.post('/resend-verification', validateResendVerification, resendVerificationCode);

router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateUpdateProfile, updateProfile);
router.post('/profile/picture', authenticateToken, profileUploadMiddleware, handleProfileUploadError, uploadProfilePicture);
router.delete('/profile/picture', authenticateToken, deleteProfilePicture);

router.get('/onboarding-status', checkOnboardingStatus);
router.post('/setup-first-admin', validateRegister, setupFirstAdmin);

router.get('/project-assignment-status', authenticateToken, getProjectAssignmentStatus);
router.get('/project-memberships', authenticateToken, getUserProjectMemberships);

router.use('/oauth', require('./oauth'));

module.exports = router;
