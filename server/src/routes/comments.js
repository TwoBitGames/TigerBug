const express = require('express');
const router = express.Router({ mergeParams: true });
const {validateComment, createComment, getComments, updateComment, deleteComment} = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', validateComment, createComment);
router.get('/', getComments);
router.put('/:id', validateComment, updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
