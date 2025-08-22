const {DataTypes} = require("sequelize");

module.exports = {
    async up(queryInterface) {
        await queryInterface.addColumn('crash_reports', 'user_story', {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Optional user story describing what the user did before the crash',
        });

        console.log("Added user_story column to crash_reports table");
    }
};