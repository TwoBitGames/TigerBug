const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BrandingConfig = sequelize.define('BrandingConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1,
  },
  app_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'TigerBug',
  },
  logo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  banner_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tagline: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  social_links: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
  client_url: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'branding_configs',
  timestamps: true,
  underscored: true,
});

module.exports = BrandingConfig;
