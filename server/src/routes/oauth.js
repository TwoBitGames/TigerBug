const express = require('express');
const router = express.Router();
const {authenticateToken, requireAdmin} = require('../middleware/auth');
const {passport} = require('../config/passport');
const {
    getOAuthProviders,
    initiateOAuth,
    handleOAuthCallback,
    getOAuthConfigs,
    updateOAuthConfig,
    deleteOAuthConfig
} = require('../controllers/oauthController');

router.use((req, res, next) => {
    req.passport = passport;
    next();
});

router.get('/providers', getOAuthProviders);
router.get('/:provider', initiateOAuth);
router.get('/:provider/callback', handleOAuthCallback);

router.get('/admin/configs', authenticateToken, requireAdmin, getOAuthConfigs);
router.put('/admin/configs/:provider', authenticateToken, requireAdmin, updateOAuthConfig);
router.delete('/admin/configs/:provider', authenticateToken, requireAdmin, deleteOAuthConfig);

module.exports = router;
