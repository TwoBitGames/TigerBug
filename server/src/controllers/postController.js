const {body, validationResult} = require('express-validator');
const {Op} = require('sequelize');
const { Post, Project, User, PostVote, Comment, Attachment, ProjectMembership } = require('../models/associations');

const {checkProjectPermission, canManagePost, canViewPrivatePost} = require('../utils/permissions');
const {sendPostNotification} = require('../utils/email');

const validatePost = [
    body('title').trim().isLength({min: 1}).withMessage('Title is required'),
    body('description').optional().trim(),
    body('is_private').optional().isBoolean(),
];

const validateUpdatePost = [
    body('title').optional().trim().isLength({min: 1}).withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('is_private').optional().isBoolean(),
    body('status').optional().isIn(['Offen', 'In Arbeit', 'Geschlossen']),
];

const createPost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {projectId} = req.params;
        const {title, description, is_private = false} = req.body;

        const {hasAccess} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const post = await Post.create({
            project_id: projectId,
            author_id: req.user.id,
            title,
            description,
            is_private,
        });

        const fullPost = await Post.findByPk(post.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
                {model: Project, attributes: ['id', 'name']},
            ],
        });

        if (!is_private) {
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
                await sendPostNotification(fullPost, 'Created', recipients);
            }
        }

        res.status(201).json({
            message: 'Post created successfully',
            post: fullPost,
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getPosts = async (req, res) => {
    try {
        const {projectId} = req.params;
        const {page = 1, limit = 10, status, search} = req.query;

        const {hasAccess, role} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const offset = (page - 1) * limit;
        const where = {project_id: projectId};

        if (status) {
            where.status = status;
        }

        if (search) {
            where[Op.or] = [
                {title: {[Op.like]: `%${search}%`}},
                {description: {[Op.like]: `%${search}%`}},
            ];
        }

        if (!['Manager', 'Administrator'].includes(role)) {
            where[Op.or] = [
                {is_private: false},
                {author_id: req.user.id},
            ];
        }

        const {count, rows: posts} = await Post.findAndCountAll({
            where,
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
                {model: PostVote, attributes: ['user_id']},
                {
                    model: Comment,
                    attributes: ['id'],
                    separate: true,
                },
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        const postsWithVotes = posts.map(post => ({
            ...post.toJSON(),
            vote_count: post.PostVotes.length,
            user_voted: post.PostVotes.some(vote => vote.user_id === req.user.id),
            comment_count: post.Comments.length,
        }));

        res.json({
            posts: postsWithVotes,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getPost = async (req, res) => {
    try {
        const {projectId, id} = req.params;

        const {hasAccess, role} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const post = await Post.findOne({
            where: {id, project_id: projectId},
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
                {model: Project, attributes: ['id', 'name']},
                {model: PostVote, attributes: ['user_id']},
                {
                    model: Attachment,
                    as: 'attachments',
                    attributes: ['id', 'original_filename', 'file_path', 'uploaded_at'],
                },
            ],
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        if (!canViewPrivatePost(req.user, post, role)) {
            return res.status(403).json({error: 'Access denied'});
        }

        const postWithVotes = {
            ...post.toJSON(),
            vote_count: post.PostVotes.length,
            user_voted: post.PostVotes.some(vote => vote.user_id === req.user.id),
            can_manage: canManagePost(req.user, post, role),
        };

        res.json({post: postWithVotes});
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updatePost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {projectId, id} = req.params;
        const updates = req.body;

        const {hasAccess, role} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const post = await Post.findOne({
            where: {id, project_id: projectId},
            include: [
                {model: User, as: 'author', attributes: ['id', 'email']},
                {model: Project, attributes: ['id', 'name']},
            ],
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        if (!canManagePost(req.user, post, role)) {
            return res.status(403).json({error: 'Access denied'});
        }

        const oldStatus = post.status;
        await post.update(updates);

        if (updates.status && updates.status !== oldStatus) {
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
                await sendPostNotification(post, 'Updated', recipients);
            }
        }

        res.json({
            message: 'Post updated successfully',
            post,
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const deletePost = async (req, res) => {
    try {
        const {projectId, id} = req.params;

        const {hasAccess, role} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const post = await Post.findOne({
            where: {id, project_id: projectId},
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        if (!canManagePost(req.user, post, role)) {
            return res.status(403).json({error: 'Access denied'});
        }

        await post.destroy();

        res.json({
            message: 'Post deleted successfully',
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const toggleVote = async (req, res) => {
    try {
        const {projectId, id} = req.params;

        const {hasAccess} = await checkProjectPermission(req.user.id, projectId);
        if (!hasAccess) {
            return res.status(403).json({error: 'Access denied'});
        }

        const post = await Post.findOne({
            where: {id, project_id: projectId},
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        const existingVote = await PostVote.findOne({
            where: {
                user_id: req.user.id,
                post_id: id,
            },
        });

        if (existingVote) {
            await existingVote.destroy();
            res.json({message: 'Vote removed', voted: false});
        } else {
            await PostVote.create({
                user_id: req.user.id,
                post_id: id,
            });
            res.json({message: 'Vote added', voted: true});
        }
    } catch (error) {
        console.error('Toggle vote error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    validatePost,
    validateUpdatePost,
    createPost,
    getPosts,
    getPost,
    updatePost,
    deletePost,
    toggleVote,
};
