const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const CrashReport = sequelize.define('CrashReport', {
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
    crash_data: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Raw crash report data (decoded from base64)',
    },
    stack_trace: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Extracted stack trace if available',
    },
    error_message: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Extracted error message if available',
    },
    application_version: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Version of the application that crashed',
    },
    operating_system: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Operating system information',
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'IP address of the client that reported the crash',
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'User agent string if available',
    },
    status: {
        type: DataTypes.ENUM('New', 'Reviewing', 'Converted', 'Ignored'),
        allowNull: false,
        defaultValue: 'New',
        comment: 'Status of the crash report',
    },
    converted_to_issue_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'posts',
            key: 'id',
        },
        comment: 'Reference to the issue if crash was converted to an issue',
    },
    reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        comment: 'User who reviewed this crash report',
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the crash report was reviewed',
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Internal notes about the crash report',
    },
    crash_frequency: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'How many times this type of crash occurred',
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'crash_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = CrashReport;
