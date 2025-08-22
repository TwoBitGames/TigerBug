const crashReportStore = new Map();

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

const getCrashReportRateLimit = () => {
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();

        cleanupOldEntries();

        const hourlyKey = `${ip}:hourly`;
        let hourlyData = crashReportStore.get(hourlyKey);

        if (!hourlyData || now > hourlyData.resetTime) {
            hourlyData = { count: 0, resetTime: now + HOUR_IN_MS };
            crashReportStore.set(hourlyKey, hourlyData);
        }

        if (hourlyData.count >= 1) {
            res.set('X-RateLimit-Limit', '1');
            res.set('X-RateLimit-Remaining', '0');
            res.set('X-RateLimit-Reset', new Date(hourlyData.resetTime).toISOString());
            return res.status(429).json({
                error: 'Hourly crash report limit exceeded. Maximum 1 report per hour per IP.',
                retryAfter: '1 hour'
            });
        }

        const dailyKey = `${ip}:daily`;
        let dailyData = crashReportStore.get(dailyKey);

        if (!dailyData || now > dailyData.resetTime) {
            dailyData = { count: 0, resetTime: now + DAY_IN_MS };
            crashReportStore.set(dailyKey, dailyData);
        }

        if (dailyData.count >= 4) {
            res.set('X-RateLimit-Limit', '4');
            res.set('X-RateLimit-Remaining', '0');
            res.set('X-RateLimit-Reset', new Date(dailyData.resetTime).toISOString());
            return res.status(429).json({
                error: 'Daily crash report limit exceeded. Maximum 4 reports per day per IP.',
                retryAfter: '24 hours'
            });
        }

        hourlyData.count++;
        dailyData.count++;
        crashReportStore.set(hourlyKey, hourlyData);
        crashReportStore.set(dailyKey, dailyData);

        res.set('X-RateLimit-Limit', '1');
        res.set('X-RateLimit-Remaining', Math.max(0, 1 - hourlyData.count).toString());
        res.set('X-RateLimit-Reset', new Date(hourlyData.resetTime).toISOString());

        next();
    };
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
