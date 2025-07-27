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
        const uploadPath = path.join(process.env.UPLOAD_PATH || './attachments', 'branding');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const type = req.body.type || 'asset'; // 'logo' or 'banner'
        const filename = `${type}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed for branding assets'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    },
    fileFilter: fileFilter,
});

const brandingUploadMiddleware = upload.single('file');

const handleBrandingUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({error: 'Branding asset file size too large (max 5MB)'});
        }
    }

    if (err.message === 'Only image files are allowed for branding assets') {
        return res.status(400).json({error: 'Only image files are allowed for branding assets'});
    }

    next(err);
};

module.exports = {
    brandingUploadMiddleware,
    handleBrandingUploadError,
};
