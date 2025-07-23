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
const {authenticateToken} = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', validatePost, createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.put('/:id', validateUpdatePost, updatePost);
router.delete('/:id', deletePost);

router.post('/:id/vote', toggleVote);

module.exports = router;
