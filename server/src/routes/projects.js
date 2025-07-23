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
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', requireAdmin, validateProject, createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', validateProject, updateProject);
router.delete('/:id', requireAdmin, deleteProject);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;