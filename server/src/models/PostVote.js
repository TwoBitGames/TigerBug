const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostVote = sequelize.define('PostVote', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id',
    },
  },
}, {
  tableName: 'post_votes',
  timestamps: true,
  updatedAt: false,
});

module.exports = PostVote;
