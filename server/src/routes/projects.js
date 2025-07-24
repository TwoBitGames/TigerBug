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
  getProjectMembers,
} = require('../controllers/projectController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

router.get('/', optionalAuth, getProjects);
router.get('/:id', optionalAuth, getProject);
router.get('/:id/members', authenticateToken, getProjectMembers);
router.get('/:id/members', authenticateToken, getProjectMembers);

router.post('/', authenticateToken, requireAdmin, validateProject, createProject);
router.put('/:id', authenticateToken, validateProject, updateProject);
router.delete('/:id', authenticateToken, requireAdmin, deleteProject);

router.post('/:id/members', authenticateToken, requireAdmin, addMember);
router.delete('/:id/members/:userId', authenticateToken, requireAdmin, removeMember);

module.exports = router;