const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 30],
      isAlphanumeric: {
        args: true,
        msg: 'Username can only contain letters and numbers'
      }
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  oauth_provider: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['google', 'discord']],
    },
  },
  oauth_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verification_code_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password_reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = User;
