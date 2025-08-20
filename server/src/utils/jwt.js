const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign({
        id: user.id,
        email: user.email,
        is_admin: user.is_admin
    }, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN || "7d"});
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {generateToken, verifyToken,};