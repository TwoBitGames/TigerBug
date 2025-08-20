const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const OAuthConfig = sequelize.define('OAuthConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isIn: [['google', 'discord']],
        },
    },
    client_id: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    client_secret: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    scope: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    callback_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'oauth_configs',
    timestamps: true
});

module.exports = OAuthConfig;
