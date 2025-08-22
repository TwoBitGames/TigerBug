const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface) => {
        await queryInterface.addColumn('projects', 'crash_reports_enabled', {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
            comment: 'Whether this project accepts crash reports'
        });

        await queryInterface.addColumn('projects', 'crash_reports_template', {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Custom template for parsing crash reports with variables like %error%, %stack_trace%, etc.'
        });

        await queryInterface.addColumn('projects', 'crash_reports_min_version', {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Minimum semantic version required for crash reports to be accepted'
        });
    }
};