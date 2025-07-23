const express = require('express');
const router = express.Router();
const {validateRegister, validateLogin, register, login, getProfile} = require('../controllers/authController');
const {authenticateToken} = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

router.get('/profile', authenticateToken, getProfile);

module.exports = router;
