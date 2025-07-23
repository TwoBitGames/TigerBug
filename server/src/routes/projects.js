const express = require('express');
const router = express.Router();
const {
  validateProject,
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

router.get('/', optionalAuth, getProjects);
router.get('/:id', optionalAuth, getProject);

router.post('/', authenticateToken, requireAdmin, validateProject, createProject);
router.put('/:id', authenticateToken, validateProject, updateProject);
router.delete('/:id', authenticateToken, requireAdmin, deleteProject);

router.post('/:id/members', authenticateToken, addMember);
router.delete('/:id/members/:userId', authenticateToken, removeMember);

module.exports = router;