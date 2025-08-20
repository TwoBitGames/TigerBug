const { DataTypes } = require('sequelize');

module.exports = {
    async up(queryInterface) {
        await queryInterface.addColumn('Users', 'password_reset_token', {
            type: DataTypes.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('Users', 'password_reset_expires', {
            type: DataTypes.DATE,
            allowNull: true,
        });
    }
};
