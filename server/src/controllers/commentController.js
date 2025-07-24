const {body, validationResult} = require('express-validator');
const {Op} = require('sequelize');
const {Comment, Post, User, Project, Attachment, ProjectMembership} = require('../models/associations');
const {sendCommentNotification} = require('../utils/email');
const {
    checkProjectPermission,
    canViewPrivatePost,
    canEditComment,
    canDeleteComment
} = require('../utils/permissions');

const validateComment = [
    body('message').trim().isLength({min: 1}).withMessage('Message is required'),
];

const createComment = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {projectId, postId} = req.params;
        const {message} = req.body;

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const post = await Post.findOne({
            where: {id: postId, project_id: projectId},
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        let isProjectMember = false;
        if (req.user) {
            const permission = await checkProjectPermission(req.user.id, projectId);
            isProjectMember = permission.hasAccess;
        }

        if (!canViewPrivatePost(req.user, post, isProjectMember, req.user.is_admin)) {
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

        setImmediate(async () => {
            try {
                const fullPost = await Post.findByPk(postId, {
                    include: [
                        {model: User, as: 'author', attributes: ['id', 'email']},
                        {model: Project, attributes: ['id', 'name']},
                    ],
                });

                const projectMembers = await ProjectMembership.findAll({
                    where: {
                        project_id: projectId,
                        user_id: {[Op.ne]: req.user.id}
                    },
                    include: [{
                        model: User,
                        attributes: ['email']
                    }]
                });

                const recipientEmails = projectMembers.map(member => member.User.email);
                if (fullPost.author.id !== req.user.id && !recipientEmails.includes(fullPost.author.email)) {
                    recipientEmails.push(fullPost.author.email);
                }
                
                if (recipientEmails.length > 0) {
                    await sendCommentNotification(fullComment, fullPost, recipientEmails);
                }
            } catch (error) {
                console.error('Failed to send comment notifications:', error);
            }
        });

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
        const {page = 1, limit = 50} = req.query;

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const post = await Post.findOne({
            where: {id: postId, project_id: projectId},
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        let isProjectMember = false;
        if (req.user) {
            const permission = await checkProjectPermission(req.user.id, projectId);
            isProjectMember = permission.hasAccess;
        }

        if (!canViewPrivatePost(req.user, post, isProjectMember, req.user?.is_admin)) {
            return res.status(403).json({error: 'Access denied'});
        }

        const offset = (page - 1) * limit;

        const {count, rows: comments} = await Comment.findAndCountAll({
            where: {post_id: postId},
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
            ],
            order: [['created_at', 'ASC']],
            limit: parseInt(limit),
            offset,
        });

        const commentsWithAttachments = await Promise.all(
            comments.map(async (comment) => {
                const attachments = await Attachment.findAll({
                    where: {
                        related_type: 'comment',
                        related_id: comment.id,
                    },
                    order: [['uploaded_at', 'ASC']],
                });

                return {
                    ...comment.toJSON(),
                    attachments,
                    can_edit: req.user ? canEditComment(req.user, comment, isProjectMember, req.user.is_admin) : false,
                    can_delete: req.user ? canDeleteComment(req.user, comment, isProjectMember, req.user.is_admin) : false,
                };
            })
        );

        res.json({
            comments: commentsWithAttachments,
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
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {projectId, postId, id} = req.params;
        const {message} = req.body;

        const comment = await Comment.findOne({
            where: {id, post_id: postId},
            include: [
                {model: Post, where: {project_id: projectId}},
            ],
        });

        if (!comment) {
            return res.status(404).json({error: 'Comment not found'});
        }

        const permission = await checkProjectPermission(req.user.id, projectId);
        const isProjectMember = permission.hasAccess;

        if (!canEditComment(req.user, comment, isProjectMember, req.user.is_admin)) {
            return res.status(403).json({error: 'Access denied'});
        }

        await comment.update({message});

        const updatedComment = await Comment.findByPk(comment.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
            ],
        });

        res.json({
            message: 'Comment updated successfully',
            comment: updatedComment,
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const deleteComment = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {projectId, postId, id} = req.params;

        const comment = await Comment.findOne({
            where: {id, post_id: postId},
            include: [
                {model: Post, where: {project_id: projectId}},
            ],
        });

        if (!comment) {
            return res.status(404).json({error: 'Comment not found'});
        }

        const permission = await checkProjectPermission(req.user.id, projectId);
        const isProjectMember = permission.hasAccess;

        if (!canDeleteComment(req.user, comment, isProjectMember, req.user.is_admin)) {
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

