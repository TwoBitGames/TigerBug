const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router({ mergeParams: true });
const {validateComment, createComment, getComments, updateComment, deleteComment} = require('../controllers/commentController');
const { optionalAuth } = require('../middleware/auth');

const createCommentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2,
    message: {
        error: 'Too many comments created from this IP. You can only create 2 comments every minute.',
        retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/', optionalAuth, getComments);

router.post('/', createCommentLimiter, optionalAuth, validateComment, createComment);
router.put('/:id', optionalAuth, validateComment, updateComment);
router.delete('/:id', optionalAuth, deleteComment);

module.exports = router;
