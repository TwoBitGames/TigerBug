module.exports = {
    async up(queryInterface) {
        const tableDescription = await queryInterface.describeTable("branding_configs");

        if (tableDescription.tagline) {
            await queryInterface.removeColumn("branding_configs", "tagline");
        }
    },
};