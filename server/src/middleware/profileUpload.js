const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.env.UPLOAD_PATH || './attachments', 'profiles');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `user-${req.user.id}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed for profile pictures'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    },
    fileFilter: fileFilter,
});

const profileUploadMiddleware = upload.single('profile_picture');

const handleProfileUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({error: 'Profile picture file size too large (max 5MB)'});
        }
    }

    if (err.message === 'Only image files are allowed for profile pictures') {
        return res.status(400).json({error: 'Only image files are allowed for profile pictures'});
    }

    next(err);
};

module.exports = {
    profileUploadMiddleware,
    handleProfileUploadError,
};
