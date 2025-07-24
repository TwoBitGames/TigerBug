const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getSMTPConfig,
  updateSMTPConfig,
  testSMTPConfig,
  getBrandingConfig,
  updateBrandingConfig,
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

router.get('/projects/:id/members', getProjectMembers);
router.post('/projects/:projectId/members', addProjectMember);
router.delete('/projects/:projectId/members/:userId', removeProjectMember);

router.get('/smtp-config', getSMTPConfig);
router.put('/smtp-config', updateSMTPConfig);
router.post('/smtp-config/test', testSMTPConfig);

router.get('/branding-config', getBrandingConfig);
router.put('/branding-config', updateBrandingConfig);

module.exports = router;
