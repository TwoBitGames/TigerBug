const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectMembership = sequelize.define('ProjectMembership', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  role: {
    type: DataTypes.ENUM('Reporter', 'Manager', 'Administrator'),
    allowNull: false,
    defaultValue: 'Reporter',
  },
});

module.exports = ProjectMembership;
