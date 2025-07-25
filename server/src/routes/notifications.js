const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getNotificationPreferences,
    updateNotificationPreferences,
} = require('../controllers/notificationController');

router.get('/preferences', authenticateToken, getNotificationPreferences);
router.put('/preferences', authenticateToken, updateNotificationPreferences);

module.exports = router;
