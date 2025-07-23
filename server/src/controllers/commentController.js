const {body, validationResult} = require('express-validator');
const { Comment, Post, User, Project, ProjectMembership, Attachment } = require('../models/associations');
const {checkProjectPermission, canViewPrivatePost} = require('../utils/permissions');
const {sendCommentNotification} = require('../utils/email');

const validateComment = [
    body('message').trim().isLength({min: 1}).withMessage('Comment message is required'),
];

const createComment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {projectId, postId} = req.params;
        const {message} = req.body;

        const {hasAccess, role} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const post = await Post.findOne({
            where: {id: postId, project_id: projectId},
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
                {model: Project, attributes: ['id', 'name']},
            ],
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        if (!canViewPrivatePost(req.user, post, role)) {
            return res.status(403).json({error: 'Access denied'});
        }

        const comment = await Comment.create({
            post_id: postId,
            author_id: req.user.id,
            message,
        });

        const fullComment = await Comment.findByPk(comment.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
            ],
        });

        const members = await User.findAll({
            include: [
                {
                    model: ProjectMembership,
                    where: {project_id: projectId},
                    attributes: ['role'],
                },
            ],
            attributes: ['email'],
        });

        const recipients = members
            .filter(member => member.email !== req.user.email)
            .map(member => member.email);

        if (recipients.length > 0) {
            await sendCommentNotification(fullComment, post, recipients);
        }

        res.status(201).json({
            message: 'Comment created successfully',
            comment: fullComment,
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getComments = async (req, res) => {
    try {
        const {projectId, postId} = req.params;
        const {page = 1, limit = 20} = req.query;

        const {hasAccess, role} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const post = await Post.findOne({
            where: {id: postId, project_id: projectId},
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        if (!canViewPrivatePost(req.user, post, role)) {
            return res.status(403).json({error: 'Access denied'});
        }

        const offset = (page - 1) * limit;

        const {count, rows: comments} = await Comment.findAndCountAll({
            where: {post_id: postId},
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
                {
                    model: Attachment,
                    as: 'attachments',
                    attributes: ['id', 'original_filename', 'file_path', 'uploaded_at'],
                },
            ],
            order: [['created_at', 'ASC']],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            comments,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateComment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {projectId, postId, id} = req.params;
        const {message} = req.body;

        const {hasAccess} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const comment = await Comment.findOne({
            where: {id, post_id: postId},
        });

        if (!comment) {
            return res.status(404).json({error: 'Comment not found'});
        }

        if (comment.author_id !== req.user.id) {
            return res.status(403).json({error: 'Access denied'});
        }

        await comment.update({message});

        res.json({
            message: 'Comment updated successfully',
            comment,
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const deleteComment = async (req, res) => {
    try {
        const {projectId, postId, id} = req.params;

        const {hasAccess, role} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const comment = await Comment.findOne({
            where: {id, post_id: postId},
        });

        if (!comment) {
            return res.status(404).json({error: 'Comment not found'});
        }

        const canDelete = comment.author_id === req.user.id ||
            ['Manager', 'Administrator'].includes(role);

        if (!canDelete) {
            return res.status(403).json({error: 'Access denied'});
        }

        await comment.destroy();

        res.json({
            message: 'Comment deleted successfully',
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    validateComment,
    createComment,
    getComments,
    updateComment,
    deleteComment,
};
