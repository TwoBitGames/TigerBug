const {Sequelize} = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        underscored: true,
        timestamps: true,
    },
});

module.exports = sequelize;