const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.TEXT,
    defaultValue: 'active',
    allowNull: false,
    validate: {
      isIn: [['active', 'archived']]
    },
  },
  disable_issue_creation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  crash_reports_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  crash_reports_template: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  crash_reports_min_version: {
    type: DataTypes.STRING,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'projects',
  updatedAt: false,
});

module.exports = Project;
