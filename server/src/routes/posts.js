const express = require('express');
const router = express.Router({mergeParams: true});
const {
    validatePost,
    validateUpdatePost,
    createPost,
    getPosts,
    getPost,
    updatePost,
    deletePost,
    toggleVote,
} = require('../controllers/postController');
const {optionalAuth} = require('../middleware/auth');

router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);

router.post('/', optionalAuth, validatePost, createPost);
router.put('/:id', optionalAuth, validateUpdatePost, updatePost);
router.delete('/:id', optionalAuth, deletePost);
router.post('/:id/vote', optionalAuth, toggleVote);

module.exports = router;
