const {Activity, Post, User} = require('../models/associations');
const {checkProjectPermission} = require('../utils/permissions');

const getPostActivities = async (req, res) => {
    try {
        const {projectId, postId} = req.params;

        const post = await Post.findOne({
            where: {id: postId, project_id: projectId}
        });

        if (!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        const permission = await checkProjectPermission(req.user?.id, projectId);
        if (!permission.hasAccess && post.is_private) {
            return res.status(403).json({error: 'Access denied'});
        }

        const activities = await Activity.findAll({
            where: {post_id: postId},
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'profile_picture']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json(activities);
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        res.status(500).json({error: 'Failed to fetch activities'});
    }
};

const createActivity = async (postId, userId, activityType, oldValue = null, newValue = null) => {
    try {
        return await Activity.create({
            post_id: postId,
            user_id: userId,
            activity_type: activityType,
            old_value: oldValue ? JSON.stringify(oldValue) : null,
            new_value: newValue ? JSON.stringify(newValue) : null
        });
    } catch (error) {
        console.error('Failed to create activity:', error);
        throw error;
    }
};

module.exports = {
    getPostActivities,
    createActivity
};