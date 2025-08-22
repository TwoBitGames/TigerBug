const express = require('express');
const router = express.Router();
const {
    validateCrashReport,
    submitCrashReport,
    getCrashReports,
    getCrashReport,
    updateCrashReportStatus,
    convertToIssue,
    deleteCrashReport,
    clearAllCrashReports,
} = require('../controllers/crashReportController');
const { authenticateToken } = require('../middleware/auth');
const { getCrashReportRateLimit } = require('../middleware/crashReportRateLimit');

router.post('/submit', getCrashReportRateLimit(), validateCrashReport, submitCrashReport);

router.get('/project/:id', authenticateToken, getCrashReports);
router.get('/project/:id/:crashId', authenticateToken, getCrashReport);
router.put('/project/:id/:crashId/status', authenticateToken, updateCrashReportStatus);
router.post('/project/:id/:crashId/convert', authenticateToken, convertToIssue);
router.delete('/project/:id/clear-all', authenticateToken, clearAllCrashReports);
router.delete('/project/:id/:crashId', authenticateToken, deleteCrashReport);

module.exports = router;
