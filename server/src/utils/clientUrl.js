const { BrandingConfig } = require('../models/associations');

const getClientUrl = async () => {
    try {
        const brandingConfig = await BrandingConfig.findByPk(1);

        if (brandingConfig && brandingConfig.client_url) {
            return brandingConfig.client_url;
        }

        return process.env.CLIENT_URL || 'http://localhost:5173';
    } catch (error) {
        console.error('Error fetching client URL from branding config:', error);
        return process.env.CLIENT_URL || 'http://localhost:5173';
    }
};

module.exports = {
    getClientUrl,
};
