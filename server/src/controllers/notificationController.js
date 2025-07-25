const {UserNotificationPreferences} = require('../models/associations');

const getNotificationPreferences = async (req, res) => {
    try {
        let preferences = await UserNotificationPreferences.findOne({
            where: {user_id: req.user.id}
        });

        if (!preferences) {
            preferences = await UserNotificationPreferences.create({
                user_id: req.user.id,
                notification_level: 'all',
                post_created: true,
                post_assigned: true,
                post_status_changed: true,
                comment_on_my_post: true,
                admin_comment: true,
                added_to_project: true,
                removed_from_project: true,
            });
        }

        res.json({preferences});
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateNotificationPreferences = async (req, res) => {
    try {
        const {
            notification_level,
            post_created,
            post_assigned,
            post_status_changed,
            comment_on_my_post,
            admin_comment,
            added_to_project,
            removed_from_project,
        } = req.body;

        let preferences = await UserNotificationPreferences.findOne({
            where: {user_id: req.user.id}
        });

        const updateData = {
            notification_level: notification_level || 'all',
            post_created: post_created !== undefined ? post_created : true,
            post_assigned: post_assigned !== undefined ? post_assigned : true,
            post_status_changed: post_status_changed !== undefined ? post_status_changed : true,
            comment_on_my_post: comment_on_my_post !== undefined ? comment_on_my_post : true,
            admin_comment: admin_comment !== undefined ? admin_comment : true,
            added_to_project: added_to_project !== undefined ? added_to_project : true,
            removed_from_project: removed_from_project !== undefined ? removed_from_project : true,
        };

        if (preferences) {
            await preferences.update(updateData);
        } else {
            preferences = await UserNotificationPreferences.create({
                user_id: req.user.id,
                ...updateData,
            });
        }

        res.json({
            message: 'Notification preferences updated successfully',
            preferences
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    getNotificationPreferences,
    updateNotificationPreferences,
};
