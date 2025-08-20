const crypto = require('crypto');

const generatePasswordResetToken = () => {
    return crypto.randomBytes(32).toString('base64url');
};

const generatePasswordResetExpiry = () => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    return expiry;
};

const isPasswordResetTokenValid = (token, dbToken, expiresAt) => {
    if (!token || !dbToken || !expiresAt) {
        return false;
    }

    if (token !== dbToken) {
        return false;
    }

    const now = new Date();
    return now <= expiresAt;
};

module.exports = {
    generatePasswordResetToken,
    generatePasswordResetExpiry,
    isPasswordResetTokenValid,
};
