const {OAuthConfig} = require('../models/associations');
const {initializeOAuthStrategies} = require('../config/passport');
const {getClientUrl} = require('../utils/clientUrl');

const getOAuthProviders = async (req, res) => {
    try {
        const providers = await OAuthConfig.findAll({
            where: {is_enabled: true},
            attributes: ['provider'],
            order: [['provider', 'ASC']]
        });

        res.json({providers});
    } catch (error) {
        console.error('Error fetching OAuth providers:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const initiateOAuth = (req, res, next) => {
    const {provider} = req.params;

    if (!['google', 'discord'].includes(provider)) {
        return res.status(400).json({error: 'Invalid OAuth provider'});
    }

    const returnUrl = req.query.returnUrl || '/';
    const state = Buffer.from(JSON.stringify({returnUrl})).toString('base64');

    return req.passport.authenticate(provider, {
        state: state,
        scope: req.query.scope ? req.query.scope.split(',') : undefined
    })(req, res, next);
};

const handleOAuthCallback = async (req, res, next) => {
    const {provider} = req.params;

    if (!['google', 'discord'].includes(provider)) {
        return res.status(400).json({error: 'Invalid OAuth provider'});
    }

    req.passport.authenticate(provider, {session: false}, async (err, result) => {
        if (err) {
            console.error('OAuth authentication error:', err);
            const clientUrl = await getClientUrl();
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
        }

        if (!result) {
            const clientUrl = await getClientUrl();
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Authentication cancelled')}`);
        }

        let returnUrl = '/';
        try {
            if (req.query.state) {
                const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
                returnUrl = state.returnUrl || '/';
            }
        } catch (e) {
            console.warn('Failed to parse OAuth state:', e);
        }

        const clientUrl = await getClientUrl();

        let finalReturnUrl = returnUrl;
        if (returnUrl.startsWith('http')) {
            try {
                const url = new URL(returnUrl);
                finalReturnUrl = url.pathname + url.search + url.hash;
            } catch (e) {
                finalReturnUrl = '/';
            }
        }

        const params = new URLSearchParams({
            token: result.token,
            user_id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            is_admin: result.user.is_admin.toString(),
            is_verified: result.user.is_verified.toString(),
            profile_picture: result.user.profile_picture || '',
            oauth_provider: result.user.oauth_provider || '',
            returnUrl: finalReturnUrl
        });

        res.redirect(`${clientUrl}/oauth/callback?${params.toString()}`);
    })(req, res, next);
};

const getOAuthConfigs = async (req, res) => {
    try {
        const configs = await OAuthConfig.findAll({
            attributes: ['id', 'provider', 'client_id', 'is_enabled', 'scope', 'callback_url'],
            order: [['provider', 'ASC']]
        });

        const safeConfigs = configs.map(config => ({
            ...config.toJSON(),
            client_secret: config.client_secret ? '***HIDDEN***' : null,
            has_client_secret: !!config.client_secret
        }));

        res.json({configs: safeConfigs});
    } catch (error) {
        console.error('Error fetching OAuth configs:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateOAuthConfig = async (req, res) => {
    try {
        const {provider} = req.params;
        const {
            client_id,
            client_secret,
            is_enabled,
            scope,
            callback_url
        } = req.body;

        if (!['google', 'discord'].includes(provider)) {
            return res.status(400).json({error: 'Invalid OAuth provider'});
        }

        let config = await OAuthConfig.findOne({where: {provider}});

        const updateData = {
            client_id,
            is_enabled: !!is_enabled,
            scope,
            callback_url
        };

        if (client_secret && client_secret !== '***HIDDEN***') {
            updateData.client_secret = client_secret;
        }

        if (config) {
            await config.update(updateData);
        } else {
            updateData.provider = provider;
            config = await OAuthConfig.create(updateData);
        }

        await initializeOAuthStrategies();

        const safeConfig = {
            ...config.toJSON(),
            client_secret: config.client_secret ? '***HIDDEN***' : null,
            has_client_secret: !!config.client_secret
        };

        res.json({
            message: 'OAuth configuration updated successfully',
            config: safeConfig
        });
    } catch (error) {
        console.error('Error updating OAuth config:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const deleteOAuthConfig = async (req, res) => {
    try {
        const {provider} = req.params;

        const config = await OAuthConfig.findOne({where: {provider}});
        if (!config) {
            return res.status(404).json({error: 'OAuth configuration not found'});
        }

        await config.destroy();

        await initializeOAuthStrategies();

        res.json({message: 'OAuth configuration deleted successfully'});
    } catch (error) {
        console.error('Error deleting OAuth config:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};


module.exports = {
    getOAuthProviders,
    initiateOAuth,
    handleOAuthCallback,
    getOAuthConfigs,
    updateOAuthConfig,
    deleteOAuthConfig
};
