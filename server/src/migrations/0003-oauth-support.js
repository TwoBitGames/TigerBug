const {DataTypes} = require("sequelize");

module.exports = {
    async up(queryInterface) {
        const tableNames = await queryInterface.showAllTables();

        if (tableNames.includes("oauth_configs")) {
            console.log("Migration already applied: oauth_configs table exists.");
            return;
        }

        await queryInterface.createTable("oauth_configs", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            provider: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isIn: [['google', 'discord']],
                },
            },
            client_id: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            client_secret: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            scope: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            callback_url: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });


    },
};