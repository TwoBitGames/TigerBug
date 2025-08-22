const express = require('express');
const {getPostActivities} = require('../controllers/activityController');
const {authenticateToken, requireAuth} = require('../middleware/auth');

const router = express.Router();

router.get('/projects/:projectId/posts/:postId/activities', authenticateToken, requireAuth, getPostActivities);

module.exports = router;