const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  getSMTPConfig,
  updateSMTPConfig,
  testSMTPConfig,
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

router.get('/projects/:id/members', getProjectMembers);
router.post('/projects/:projectId/members', addProjectMember);
router.put('/projects/:projectId/members/:userId/role', updateProjectMemberRole);
router.delete('/projects/:projectId/members/:userId', removeProjectMember);

router.get('/smtp-config', getSMTPConfig);
router.put('/smtp-config', updateSMTPConfig);
router.post('/smtp-config/test', testSMTPConfig);

module.exports = router;
