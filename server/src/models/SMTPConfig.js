const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SMTPConfig = sequelize.define('SMTPConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1,
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 587,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  use_tls: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  from_address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'smtp_config',
});

module.exports = SMTPConfig;
