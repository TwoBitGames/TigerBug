const {body, validationResult} = require('express-validator');
const {User} = require('../models/associations');
const {hashPassword, comparePassword} = require('../utils/password');
const {generateToken} = require('../utils/jwt');
const {
    generateVerificationCode,
    generateVerificationExpiry,
    isVerificationCodeValid
} = require('../utils/verification');
const {sendVerificationEmail, sendWelcomeEmail} = require('../utils/email');
const {Op} = require('sequelize');
const fs = require('fs');
const path = require('path');

const validateRegister = [
    body('username').isLength({
        min: 2,
        max: 30
    }).isAlphanumeric().withMessage('Username must be 2-30 characters and contain only letters and numbers'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters long'),
];

const validateLogin = [
    body('identifier').notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty(),
];

const validateVerifyEmail = [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({min: 6, max: 6}).withMessage('Verification code must be 6 digits'),
];

const validateResendVerification = [
    body('email').isEmail().normalizeEmail(),
];

const validateUpdateProfile = [
    body('username').isLength({
        min: 2,
        max: 30
    }).isAlphanumeric().withMessage('Username must be 2-30 characters and contain only letters and numbers'),
];

const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {username, email, password} = req.body;

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    {email},
                    {username}
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({error: 'User already exists with this email'});
            }
            if (existingUser.username === username) {
                return res.status(400).json({error: 'Username is already taken'});
            }
        }

        const passwordHash = await hashPassword(password);
        const verificationCode = generateVerificationCode();
        const verificationExpiry = generateVerificationExpiry();

        const user = await User.create({
            username,
            email,
            password_hash: passwordHash,
            is_verified: false,
            verification_code: verificationCode,
            verification_code_expires: verificationExpiry,
        });

        try {
            await sendVerificationEmail(email, verificationCode);
            console.log(`Verification email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        res.status(201).json({
            message: 'User created successfully. Please check your email for verification code.',
            requiresVerification: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_verified: user.is_verified,
                profile_picture: user.profile_picture,
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

        const {identifier, password} = req.body;

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    {email: identifier},
                    {username: identifier}
                ]
            }
        });

        if (!user || !user.password_hash) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        if (!user.is_verified) {
            return res.status(403).json({
                error: 'Email not verified',
                requiresVerification: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    is_verified: user.is_verified,
                    profile_picture: user.profile_picture,
                }
            });
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
                is_verified: user.is_verified,
                profile_picture: user.profile_picture,
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
                username: req.user.username,
                email: req.user.email,
                is_admin: req.user.is_admin,
                profile_picture: req.user.profile_picture,
            },
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const checkOnboardingStatus = async (req, res) => {
    try {
        const userCount = await User.count();
        res.json({
            needsOnboarding: userCount === 0,
            userCount
        });
    } catch (error) {
        console.error('Onboarding status check error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const setupFirstAdmin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const userCount = await User.count();
        if (userCount > 0) {
            return res.status(400).json({error: 'System already has users. Onboarding not available.'});
        }

        const {email, password} = req.body;

        const passwordHash = await hashPassword(password);
        const user = await User.create({
            username: 'admin', // Default username for first admin
            email,
            password_hash: passwordHash,
            is_admin: true,
            is_verified: true,
        });

        const token = generateToken(user);

        res.status(201).json({
            message: 'First admin account created successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
                is_verified: user.is_verified,
                profile_picture: user.profile_picture,
            },
        });
    } catch (error) {
        console.error('Setup first admin error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const verifyEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {email, code} = req.body;

        const user = await User.findOne({where: {email}});
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        if (user.is_verified) {
            return res.status(400).json({error: 'Email already verified'});
        }

        if (!isVerificationCodeValid(code, user.verification_code, user.verification_code_expires)) {
            return res.status(400).json({error: 'Invalid or expired verification code'});
        }

        await user.update({
            is_verified: true,
            verification_code: null,
            verification_code_expires: null,
        });

        try {
            await sendWelcomeEmail(user.email);
            console.log(`Welcome email sent to ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        const token = generateToken(user);

        res.json({
            message: 'Email verified successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
                is_verified: true,
                profile_picture: user.profile_picture,
            },
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const resendVerificationCode = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {email} = req.body;

        const user = await User.findOne({where: {email}});
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        if (user.is_verified) {
            return res.status(400).json({error: 'Email already verified'});
        }

        const verificationCode = generateVerificationCode();
        const verificationExpiry = generateVerificationExpiry();

        await user.update({
            verification_code: verificationCode,
            verification_code_expires: verificationExpiry,
        });

        try {
            await sendVerificationEmail(email, verificationCode);
            console.log(`Verification email resent to ${email}`);
        } catch (emailError) {
            console.error('Failed to resend verification email:', emailError);
            return res.status(500).json({error: 'Failed to send verification email'});
        }

        res.json({
            message: 'Verification code sent successfully',
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {username} = req.body;
        const userId = req.user.id;

        const existingUser = await User.findOne({
            where: {
                username,
                id: {[Op.ne]: userId}
            }
        });

        if (existingUser) {
            return res.status(400).json({error: 'Username is already taken'});
        }

        await req.user.update({username});

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                is_admin: req.user.is_admin,
                profile_picture: req.user.profile_picture,
            },
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({error: 'No file uploaded'});
        }

        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        if (user.profile_picture) {
            const oldFilePath = path.join(process.env.UPLOAD_PATH || './attachments', 'profiles', path.basename(user.profile_picture));
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                } catch (error) {
                    console.error('Error deleting old profile picture:', error);
                }
            }
        }

        const relativePath = `/api/profile-pictures/${path.basename(req.file.path)}`;
        await user.update({profile_picture: relativePath});

        res.json({
            message: 'Profile picture uploaded successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
                profile_picture: user.profile_picture,
            },
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        if (!user.profile_picture) {
            return res.status(400).json({error: 'No profile picture to delete'});
        }

        const filePath = path.join(process.env.UPLOAD_PATH || './attachments', 'profiles', path.basename(user.profile_picture));
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error('Error deleting profile picture file:', error);
            }
        }

        await user.update({profile_picture: null});

        res.json({
            message: 'Profile picture deleted successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
                profile_picture: null,
            },
        });
    } catch (error) {
        console.error('Profile picture delete error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    validateRegister,
    validateLogin,
    validateVerifyEmail,
    validateResendVerification,
    validateUpdateProfile,
    register,
    login,
    getProfile,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    checkOnboardingStatus,
    setupFirstAdmin,
    verifyEmail,
    resendVerificationCode,
};
