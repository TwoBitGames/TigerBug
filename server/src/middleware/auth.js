const {verifyToken} = require('../utils/jwt');
const { User } = require('../models/associations');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({error: 'Access token required'});
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({error: 'Invalid or expired token'});
    }

    try {
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(403).json({error: 'User not found'});
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({error: 'Authentication failed'});
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({error: 'Admin privileges required'});
    }
    next();
};

module.exports = {authenticateToken, requireAdmin,};