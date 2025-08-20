const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const {User, OAuthConfig} = require('../models/associations');
const {generateToken} = require('../utils/jwt');

let oauthConfigs = {};

const loadOAuthConfigs = async () => {
    try {
        const configs = await OAuthConfig.findAll({
            where: {is_enabled: true}
        });

        oauthConfigs = {};
        configs.forEach(config => {
            oauthConfigs[config.provider] = config;
        });

        return oauthConfigs;
    } catch (error) {
        console.error('Failed to load OAuth configs:', error);
        return {};
    }
};

const initializeOAuthStrategies = async () => {
    await loadOAuthConfigs();

    passport._strategies = {};

    // Google OAuth Strategy
    if (oauthConfigs.google && oauthConfigs.google.client_id && oauthConfigs.google.client_secret) {
        passport.use(new GoogleStrategy({
                clientID: oauthConfigs.google.client_id,
                clientSecret: oauthConfigs.google.client_secret,
                callbackURL: oauthConfigs.google.callback_url || "/api/auth/oauth/google/callback",
                scope: (oauthConfigs.google.scope || 'profile email').split(' ')
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const result = await handleOAuthCallback('google', profile, {
                        accessToken,
                        refreshToken
                    });
                    return done(null, result);
                } catch (error) {
                    return done(error, null);
                }
            }));
    }

    // Discord OAuth Strategy
    if (oauthConfigs.discord && oauthConfigs.discord.client_id && oauthConfigs.discord.client_secret) {
        passport.use(new DiscordStrategy({
                clientID: oauthConfigs.discord.client_id,
                clientSecret: oauthConfigs.discord.client_secret,
                callbackURL: oauthConfigs.discord.callback_url || "/api/auth/oauth/discord/callback",
                scope: (oauthConfigs.discord.scope || 'identify email').split(' ')
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const result = await handleOAuthCallback('discord', profile, {
                        accessToken,
                        refreshToken
                    });
                    return done(null, result);
                } catch (error) {
                    return done(error, null);
                }
            }));
    }
};

const handleOAuthCallback = async (provider, profile) => {
    try {
        const email = (profile.emails && profile.emails[0] ? profile.emails[0].value : null) || profile.email;
        const oauthId = profile.id;

        if (!email) {
            throw new Error('Email not provided by OAuth provider');
        }

        let user = await User.findOne({
            where: {
                oauth_provider: provider,
                oauth_id: oauthId
            }
        });

        if (!user) {
            user = await User.findOne({
                where: {email: email.toLowerCase()}
            });

            if (user) {
                await user.update({
                    oauth_provider: provider,
                    oauth_id: oauthId,
                    is_verified: true
                });
            } else {
                const username = generateUsernameFromProfile(profile);

                user = await User.create({
                    username: username,
                    email: email.toLowerCase(),
                    oauth_provider: provider,
                    oauth_id: oauthId,
                    is_verified: true,
                    is_admin: false,
                    profile_picture: getProfilePictureFromProfile(profile)
                });
            }
        } else {
            await user.update({
                profile_picture: getProfilePictureFromProfile(profile),
            });
        }

        const token = generateToken(user);

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
                is_verified: user.is_verified,
                profile_picture: user.profile_picture,
                oauth_provider: user.oauth_provider
            },
            token
        };

    } catch (error) {
        console.error('OAuth callback error:', error);
        throw error;
    }
};

const generateUsernameFromProfile = (profile) => {
    let username = profile.username ||
        profile.login ||
        (profile.name && profile.name.givenName) ||
        profile.displayName ||
        'user';

    username = username.toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 30);

    const randomSuffix = Math.floor(Math.random() * 10000);
    username = `${username}${randomSuffix}`;

    return username;
};

const getProfilePictureFromProfile = (profile) => {
    if (profile.photos && profile.photos.length > 0) {
        return profile.photos[0].value;
    }
    if (profile.avatar) { // For Discord
        return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
    }
    return null;
};

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = {
    initializeOAuthStrategies,
    loadOAuthConfigs,
    handleOAuthCallback,
    passport
};
