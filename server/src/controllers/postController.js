const {body, validationResult} = require('express-validator');
const {Op} = require('sequelize');
const {Post, Project, User, PostVote, Comment, Attachment, ProjectMembership} = require('../models/associations');
const {sendPostNotification} = require('../utils/email');

const {
    checkProjectPermission,
    canCreatePost,
    canEditPost,
    canDeletePost,
    canViewPrivatePost,
    canChangePostStatus,
    canEditManagerFields,
    canCreateSubIssue
} = require('../utils/permissions');

const validatePost = [
    body('title').trim().isLength({min: 1}).withMessage('Title is required'),
    body('description').optional().trim(),
    body('is_private').optional().isBoolean(),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('issue_type').optional().isIn(['Bug', 'Feature']),
    body('assignee_id').optional().isInt(),
    body('story_points').optional().isInt({min: 1, max: 100}),
    body('time_estimate').optional().isInt({min: 0, max: 999}),
    body('due_date').optional().isISO8601(),
    body('labels').optional().isArray(),
    body('parent_issue_id').optional().isInt(),
];

const validateUpdatePost = [
    body('title').optional().trim().isLength({min: 1}).withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('is_private').optional().isBoolean(),
    body('status').optional().isIn(['Open', 'In Progress', 'Closed']),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('issue_type').optional().isIn(['Bug', 'Feature']),
    body('assignee_id').optional().isInt(),
    body('story_points').optional().isInt({min: 1, max: 100}),
    body('time_estimate').optional().isInt({min: 0, max: 999}),
    body('due_date').optional().isISO8601(),
    body('labels').optional().isArray(),
];

const createPost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {projectId} = req.params;
        const {title, description, is_private = false, priority = 'Medium', issue_type = 'Bug', assignee_id, story_points, time_estimate, due_date, labels = [], parent_issue_id} = req.body;

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        if (!canCreatePost(req.user)) {
            return res.status(403).json({error: 'Access denied'});
        }

        const permission = await checkProjectPermission(req.user.id, projectId);
        const isProjectMember = permission.hasAccess;
        const canEditMgrFields = canEditManagerFields(req.user, isProjectMember, req.user.is_admin);

        if (parent_issue_id) {
            const parentIssue = await Post.findOne({
                where: { id: parent_issue_id, project_id: projectId }
            });
            
            if (!parentIssue) {
                return res.status(404).json({error: 'Parent issue not found'});
            }

            if (!canCreateSubIssue(req.user, isProjectMember, req.user.is_admin)) {
                return res.status(403).json({error: 'Only administrators and project managers can create sub-issues'});
            }
        }

        const postData = {
            project_id: projectId,
            author_id: req.user.id,
            title,
            description,
            is_private,
        };

        if (parent_issue_id) {
            postData.parent_issue_id = parent_issue_id;
        }

        if (canEditMgrFields) {
            if (priority) postData.priority = priority;
            if (issue_type) postData.issue_type = issue_type;
            if (assignee_id !== undefined) postData.assignee_id = assignee_id;
            if (story_points !== undefined) postData.story_points = story_points;
            if (time_estimate !== undefined) postData.time_estimate = time_estimate;
            if (due_date) postData.due_date = due_date;
            if (labels) postData.labels = labels;
        }

        const post = await Post.create(postData);

        const fullPost = await Post.findByPk(post.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'email', 'profile_picture']},
                {model: User, as: 'assignee', attributes: ['id', 'username', 'email', 'profile_picture']},
                {model: Project, attributes: ['id', 'name']},
            ],
        });

        setImmediate(async () => {
            try {
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
                
                if (recipientEmails.length > 0) {
                    await sendPostNotification(fullPost, 'Created', recipientEmails);
                }
            } catch (error) {
                console.error('Failed to send post creation notifications:', error);
            }
        });

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

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const offset = (page - 1) * limit;
        const where = {project_id: projectId, parent_issue_id: null}; // Only get parent issues, not sub-issues

        if (status) {
            where.status = status;
        }

        if (search) {
            where[Op.or] = [
                {title: {[Op.like]: `%${search}%`}},
                {description: {[Op.like]: `%${search}%`}},
            ];
        }
        if (!req.user) {
            where.is_private = false;
        } else if (req.user.is_admin) {

        } else {
            where[Op.or] = [
                {is_private: false},
                {author_id: req.user.id, is_private: true},
            ];
        }

        const {count, rows: posts} = await Post.findAndCountAll({
            where,
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'email', 'profile_picture']},
                {model: User, as: 'assignee', attributes: ['id', 'username', 'email', 'profile_picture']},
                {model: PostVote, as: 'votes', attributes: ['user_id']},
                {
                    model: Comment,
                    as: 'comments',
                    attributes: ['id'],
                    separate: true,
                },
                {
                    model: Post,
                    as: 'sub_issues',
                    attributes: ['id', 'title', 'status', 'priority', 'issue_type', 'assignee_id', 'created_at'],
                    include: [
                        {model: User, as: 'assignee', attributes: ['id', 'username', 'profile_picture']}
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        const postsWithVotes = posts.map(post => ({
            ...post.toJSON(),
            vote_count: post.votes.length,
            user_voted: req.user ? post.votes.some(vote => vote.user_id === req.user.id) : false,
            comment_count: post.comments.length,
            sub_issue_count: post.sub_issues.length,
            sub_issues_closed_count: post.sub_issues.filter(sub => sub.status === 'Closed').length,
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

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const post = await Post.findOne({
            where: {id, project_id: projectId},
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'email', 'profile_picture']},
                {model: User, as: 'assignee', attributes: ['id', 'username', 'email', 'profile_picture']},
                {model: Project, attributes: ['id', 'name']},
                {model: PostVote, as: 'votes', attributes: ['user_id']},
                {
                    model: Post,
                    as: 'sub_issues',
                    include: [
                        {model: User, as: 'author', attributes: ['id', 'username']},
                        {model: User, as: 'assignee', attributes: ['id', 'username', 'profile_picture']}
                    ]
                },
                {
                    model: Post,
                    as: 'parent_issue',
                    attributes: ['id', 'title'],
                    include: [
                        {model: User, as: 'author', attributes: ['id', 'username']}
                    ]
                }
            ],
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        const attachments = await Attachment.findAll({
            where: {
                related_type: 'post',
                related_id: id
            },
            attributes: ['id', 'original_filename', 'file_path', 'uploaded_at']
        });

        let isProjectMember = false;
        if (req.user) {
            const permission = await checkProjectPermission(req.user.id, projectId);
            isProjectMember = permission.hasAccess;
        }

        if (!canViewPrivatePost(req.user, post, isProjectMember, req.user?.is_admin)) {
            return res.status(403).json({error: 'Access denied'});
        }

        const postWithVotes = {
            ...post.toJSON(),
            vote_count: post.votes.length,
            user_voted: req.user ? post.votes.some(vote => vote.user_id === req.user.id) : false,
            can_edit: req.user ? canEditPost(req.user, post, isProjectMember, req.user.is_admin) : false,
            can_delete: req.user ? canDeletePost(req.user, post, isProjectMember, req.user.is_admin) : false,
            can_change_status: req.user ? canChangePostStatus(req.user, post, isProjectMember, req.user.is_admin) : false,
            can_edit_manager_fields: req.user ? canEditManagerFields(req.user, isProjectMember, req.user.is_admin) : false,
            can_create_sub_issue: req.user ? canCreateSubIssue(req.user, isProjectMember, req.user.is_admin) : false,
            sub_issue_count: post.sub_issues ? post.sub_issues.length : 0,
            sub_issues_closed_count: post.sub_issues ? post.sub_issues.filter(sub => sub.status === 'Closed').length : 0,
            attachments: attachments
        };

        res.json({post: postWithVotes});
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updatePost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {projectId, id} = req.params;
        const updates = req.body;

        const post = await Post.findOne({
            where: {id, project_id: projectId},
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'email', 'profile_picture']},
                {model: User, as: 'assignee', attributes: ['id', 'username', 'email', 'profile_picture']},
                {model: Project, attributes: ['id', 'name']},
            ],
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        const permission = await checkProjectPermission(req.user.id, projectId);
        const isProjectMember = permission.hasAccess;

        const editPermission = canEditPost(req.user, post, isProjectMember, req.user.is_admin);
        const canEditMgrFields = canEditManagerFields(req.user, isProjectMember, req.user.is_admin);

        if (!editPermission) {
            return res.status(403).json({error: 'Access denied'});
        }

        if (editPermission === 'limited') {
            const allowedFields = ['title', 'description'];
            const filteredUpdates = {};

            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    filteredUpdates[field] = updates[field];
                }
            }

            const attemptedFields = Object.keys(updates);
            const forbiddenFields = attemptedFields.filter(field => !allowedFields.includes(field));

            if (forbiddenFields.length > 0) {
                return res.status(403).json({
                    error: `You can only update title and description. Forbidden fields: ${forbiddenFields.join(', ')}`
                });
            }

            await post.update(filteredUpdates);
        } else {
            const managerOnlyFields = ['priority', 'issue_type', 'assignee_id', 'story_points', 'time_estimate', 'due_date', 'labels'];
            const attemptedManagerFields = Object.keys(updates).filter(field => managerOnlyFields.includes(field));
            
            if (attemptedManagerFields.length > 0 && !canEditMgrFields) {
                return res.status(403).json({
                    error: `Only managers can update these fields: ${attemptedManagerFields.join(', ')}`
                });
            }
            
            await post.update(updates);
        }

        if (updates.status && post.parent_issue_id) {
            await checkAndCloseParentIssue(post.parent_issue_id);
        }

        setImmediate(async () => {
            try {
                if (updates.status) {
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
                    
                    if (recipientEmails.length > 0) {
                        await sendPostNotification(post, 'Updated', recipientEmails);
                    }
                }
            } catch (error) {
                console.error('Failed to send post update notifications:', error);
            }
        });

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
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {projectId, id} = req.params;

        const post = await Post.findOne({
            where: {id, project_id: projectId},
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        const permission = await checkProjectPermission(req.user.id, projectId);
        const isProjectMember = permission.hasAccess;

        if (!canDeletePost(req.user, post, isProjectMember, req.user.is_admin)) {
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
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {projectId, id} = req.params;

        const post = await Post.findOne({
            where: {id, project_id: projectId},
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

const checkAndCloseParentIssue = async (parentIssueId) => {
    try {
        const subIssues = await Post.findAll({
            where: { parent_issue_id: parentIssueId }
        });

        const allClosed = subIssues.length > 0 && subIssues.every(subIssue => subIssue.status === 'Closed');
        
        if (allClosed) {
            await Post.update(
                { status: 'Closed' },
                { where: { id: parentIssueId } }
            );
        }
    } catch (error) {
        console.error('Error checking parent issue status:', error);
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
    checkAndCloseParentIssue,
};
