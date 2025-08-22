const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'posts',
            key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Reference to the issue/post this activity belongs to',
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        comment: 'User who performed the action',
    },
    activity_type: {
        type: DataTypes.ENUM(
            'status_changed',
            'priority_changed',
            'assignee_changed',
            'labels_added',
            'labels_removed',
            'due_date_changed',
            'story_points_changed',
            'time_estimate_changed',
            'issue_type_changed'
        ),
        allowNull: false,
        comment: 'Type of activity/change that occurred',
    },
    old_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Previous value (JSON for complex types like labels)',
    },
    new_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'New value (JSON for complex types like labels)',
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'activities',
    timestamps: false,
});

module.exports = Activity;