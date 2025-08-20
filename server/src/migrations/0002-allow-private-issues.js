const {DataTypes} = require("sequelize");

module.exports = {
    async up(queryInterface) {
        const alreadyApplied = await queryInterface.describeTable("projects").then((table) => table.disable_issue_creation !== undefined);

        if (alreadyApplied) {
            console.log("Migration already applied: disable_issue_creation column exists.");
            return;
        }

        await queryInterface.addColumn("projects", "disable_issue_creation", {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        });
    },
};