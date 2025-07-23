const express = require('express');
const router = express.Router({ mergeParams: true });
const {validateComment, createComment, getComments, updateComment, deleteComment} = require('../controllers/commentController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getComments);

router.post('/', optionalAuth, validateComment, createComment);
router.put('/:id', optionalAuth, validateComment, updateComment);
router.delete('/:id', optionalAuth, deleteComment);

module.exports = router;
