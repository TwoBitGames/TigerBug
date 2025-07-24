const {Sequelize} = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../data/database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        underscored: true,
        timestamps: true,
    },
});

module.exports = sequelize;