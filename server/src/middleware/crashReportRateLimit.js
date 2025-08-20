const rateLimit = require('express-rate-limit');

const crashReportStore = new Map();

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

const getCrashReportRateLimit = () => {
    return rateLimit({
        windowMs: HOUR_IN_MS,
        max: 1,
        message: {
            error: 'Too many crash reports from this IP. Please try again later.',
            retryAfter: '1 hour'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            const ip = req.ip;
            const now = Date.now();

            cleanupOldEntries();

            const dailyKey = `${ip}:daily`;
            const dailyData = crashReportStore.get(dailyKey) || { count: 0, resetTime: now + DAY_IN_MS };
            
            if (now > dailyData.resetTime) {
                dailyData.count = 0;
                dailyData.resetTime = now + DAY_IN_MS;
            }
            
            if (dailyData.count >= 4) {
                return res.status(429).json({
                    error: 'Daily crash report limit exceeded. Maximum 4 reports per day per IP.',
                    retryAfter: '24 hours'
                });
            }

            dailyData.count++;
            crashReportStore.set(dailyKey, dailyData);

            next();
        },
    });
};

const cleanupOldEntries = () => {
    const now = Date.now();
    for (const [key, data] of crashReportStore.entries()) {
        if (data.resetTime && now > data.resetTime) {
            crashReportStore.delete(key);
        }
    }
};

module.exports = {
    getCrashReportRateLimit
};
