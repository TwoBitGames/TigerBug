const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface) => {
        await queryInterface.addColumn('crash_reports', 'error_signature', {
            type: DataTypes.STRING(32),
            allowNull: true,
            comment: 'Hash signature for duplicate detection based on normalized error patterns'
        });

        await queryInterface.addColumn('crash_reports', 'script_line', {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Script file and line number information (format: "script:line")',
        });

        await queryInterface.addIndex('crash_reports', ['project_id', 'error_signature'], {
            name: 'idx_crash_reports_project_signature'
        });
    }
};