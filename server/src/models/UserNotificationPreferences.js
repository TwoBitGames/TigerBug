const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const UserNotificationPreferences = sequelize.define('UserNotificationPreferences', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'CASCADE',
    },
    notification_level: {
        type: DataTypes.ENUM('off', 'important_only', 'all'),
        defaultValue: 'all',
        comment: 'Overall notification level: off (no emails), important_only (critical events), all (everything)',
    },
    post_created: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Email when a new post is created in projects I am a member of',
    },
    post_assigned: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Email when I am assigned to a post',
    },
    post_status_changed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Email when post status changes (especially when closed/fixed)',
    },
    comment_on_my_post: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Email when someone comments on my posts',
    },
    admin_comment: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Email when an admin comments on posts',
    },
    added_to_project: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Email when I am added to a project',
    },
    removed_from_project: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Email when I am removed from a project',
    },
}, {
    tableName: 'user_notification_preferences',
    timestamps: true,
});

module.exports = UserNotificationPreferences;
