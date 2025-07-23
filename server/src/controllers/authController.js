const { body, validationResult } = require('express-validator');
const { User } = require('../models/associations');
const {hashPassword, comparePassword} = require('../utils/password');
const {generateToken} = require('../utils/jwt');

const validateRegister = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters long'),
];

const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {email, password} = req.body;

        const existingUser = await User.findOne({where: {email}});
        if (existingUser) {
            return res.status(400).json({error: 'User already exists with this email'});
        }

        const passwordHash = await hashPassword(password);
        const user = await User.create({
            email,
            password_hash: passwordHash,
        });

        const token = generateToken(user);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                is_admin: user.is_admin,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {email, password} = req.body;

        const user = await User.findOne({where: {email}});
        if (!user || !user.password_hash) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                is_admin: user.is_admin,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getProfile = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.id,
                email: req.user.email,
                is_admin: req.user.is_admin,
            },
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    validateRegister,
    validateLogin,
    register,
    login,
    getProfile,
};
