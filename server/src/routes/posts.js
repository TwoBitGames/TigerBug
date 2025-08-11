const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router({mergeParams: true});
const {
    validatePost,
    validateUpdatePost,
    createPost,
    getPosts,
    getKanbanPosts,
    getPost,
    updatePost,
    deletePost,
    toggleVote,
} = require('../controllers/postController');
const {optionalAuth} = require('../middleware/auth');

const createPostLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 1,
    message: {
        error: 'Too many posts created from this IP. You can only create 10 posts every 2 minutes.',
        retryAfter: '2 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/', optionalAuth, getPosts);
router.get('/kanban', optionalAuth, getKanbanPosts);
router.get('/:id', optionalAuth, getPost);

router.post('/', createPostLimiter, optionalAuth, validatePost, createPost);
router.put('/:id', optionalAuth, validateUpdatePost, updatePost);
router.delete('/:id', optionalAuth, deletePost);
router.post('/:id/vote', optionalAuth, toggleVote);

module.exports = router;
