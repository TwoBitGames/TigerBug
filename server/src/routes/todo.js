const express = require('express');
const router = express.Router();
const { getTodoTasks } = require('../controllers/todoController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getTodoTasks);

module.exports = router;
