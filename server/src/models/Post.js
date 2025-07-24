const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'projects',
            key: 'id',
        },
    },
    author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_private: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    status: {
        type: DataTypes.ENUM('Open', 'In Progress', 'Closed'),
        allowNull: false,
        defaultValue: 'Open',
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        allowNull: false,
        defaultValue: 'Medium',
    },
    issue_type: {
        type: DataTypes.ENUM('Bug', 'Feature'),
        allowNull: false,
        defaultValue: 'Bug',
    },
    assignee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    parent_issue_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'posts',
            key: 'id',
        },
    },
    story_points: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 100,
        },
    },
    time_estimate: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 999,
        },
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    labels: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'posts',
});

module.exports = Post;
