const {User, Project, ProjectMembership, SMTPConfig, BrandingConfig} = require('../models/associations');
const {sendSimpleTestEmail, refreshMailer} = require('../utils/email');

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'is_admin', 'created_at', 'profile_picture'],
            order: [['created_at', 'DESC']],
        });

        res.json({users});
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateUserRole = async (req, res) => {
    try {
        const {id} = req.params;
        const {is_admin} = req.body;

        if (typeof is_admin !== 'boolean') {
            return res.status(400).json({error: 'is_admin must be a boolean'});
        }

        if (req.user.id === parseInt(id) && !is_admin) {
            return res.status(400).json({error: 'Cannot remove admin status from yourself'});
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        await user.update({is_admin});

        res.json({
            message: `User ${is_admin ? 'granted' : 'removed'} admin privileges`,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
                created_at: user.created_at,
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getProjectMembers = async (req, res) => {
    try {
        const {id} = req.params;

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const memberships = await ProjectMembership.findAll({
            where: {project_id: id},
            include: [{
                model: User,
                attributes: ['id', 'username', 'email', 'is_admin', 'created_at'],
            }],
            order: [[User, 'email', 'ASC']],
        });

        res.json({
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
            },
            members: memberships.map(membership => ({
                id: membership.id,
                user_id: membership.user_id,
                project_id: membership.project_id,
                user: membership.User,
            }))
        });
    } catch (error) {
        console.error('Error fetching project members:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const addProjectMember = async (req, res) => {
    try {
        const {projectId} = req.params;
        const {user_id} = req.body;

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        const existingMembership = await ProjectMembership.findOne({
            where: {
                user_id: user_id,
                project_id: projectId,
            },
        });

        if (existingMembership) {
            return res.status(400).json({error: 'User is already a member of this project'});
        }

        const membership = await ProjectMembership.create({
            user_id: user_id,
            project_id: projectId
        });

        res.status(201).json({
            message: 'Member added successfully',
            membership: {
                id: membership.id,
                user_id: membership.user_id,
                project_id: membership.project_id
            }
        });
    } catch (error) {
        console.error('Error adding project member:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const removeProjectMember = async (req, res) => {
    try {
        const {projectId, userId} = req.params;

        const membership = await ProjectMembership.findOne({
            where: {
                project_id: projectId,
                user_id: userId,
            },
        });

        if (!membership) {
            return res.status(404).json({error: 'Project membership not found'});
        }

        await membership.destroy();

        res.json({message: 'Member removed successfully'});
    } catch (error) {
        console.error('Error removing project member:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getSMTPConfig = async (req, res) => {
    try {
        let smtpConfig = await SMTPConfig.findByPk(1);

        if (!smtpConfig) {
            smtpConfig = await SMTPConfig.create({
                id: 1,
                host: '',
                port: 587,
                username: '',
                password: '',
                use_tls: true,
                from_address: '',
            });
        }

        const {password, ...configWithoutPassword} = smtpConfig.toJSON();

        res.json({smtpConfig: configWithoutPassword});
    } catch (error) {
        console.error('Error fetching SMTP config:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateSMTPConfig = async (req, res) => {
    try {
        const {host, port, username, password, use_tls, from_address} = req.body;

        if (!host || !username || !from_address) {
            return res.status(400).json({error: 'Host, username, and from_address are required'});
        }

        if (port && (port < 1 || port > 65535)) {
            return res.status(400).json({error: 'Port must be between 1 and 65535'});
        }

        let smtpConfig = await SMTPConfig.findByPk(1);

        const updateData = {
            host,
            port: port || 587,
            username,
            use_tls: use_tls !== undefined ? use_tls : true,
            from_address,
        };

        if (password) {
            updateData.password = password;
        }

        if (smtpConfig) {
            await smtpConfig.update(updateData);
        } else {
            smtpConfig = await SMTPConfig.create({
                id: 1,
                ...updateData,
                password: password || '',
            });
        }

        await refreshMailer();
        console.log('SMTP transporter refreshed with new configuration');

        const {password: _, ...configWithoutPassword} = smtpConfig.toJSON();

        res.json({
            message: 'SMTP configuration updated successfully',
            smtpConfig: configWithoutPassword
        });
    } catch (error) {
        console.error('Error updating SMTP config:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const testSMTPConfig = async (req, res) => {
    try {
        const {test_email} = req.body;

        if (!test_email) {
            return res.status(400).json({error: 'test_email is required'});
        }

        const smtpConfig = await SMTPConfig.findByPk(1);
        if (!smtpConfig) {
            return res.status(400).json({error: 'SMTP configuration not found'});
        }

        await refreshMailer();

        try {
            await sendSimpleTestEmail(test_email);

            res.json({
                message: 'Test email sent successfully',
                sentTo: test_email
            });
        } catch (emailError) {
            console.error('Email send error:', emailError);
            res.status(400).json({
                error: 'Failed to send test email',
                details: emailError.message
            });
        }
    } catch (error) {
        console.error('Error testing SMTP config:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getBrandingConfig = async (req, res) => {
    try {
        let brandingConfig = await BrandingConfig.findByPk(1);

        if (!brandingConfig) {
            brandingConfig = await BrandingConfig.create({
                id: 1,
                app_name: 'TigerBug',
                logo_url: null,
                tagline: null,
                social_links: null,
                client_url: null,
            });
        }

        res.json({brandingConfig});
    } catch (error) {
        console.error('Error fetching branding config:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateBrandingConfig = async (req, res) => {
    try {
        const {app_name, logo_url, tagline, social_links, client_url} = req.body;

        if (!app_name || app_name.trim().length === 0) {
            return res.status(400).json({error: 'App name is required'});
        }

        if (app_name.length > 255) {
            return res.status(400).json({error: 'App name must be 255 characters or less'});
        }

        if (tagline && tagline.length > 500) {
            return res.status(400).json({error: 'Tagline must be 500 characters or less'});
        }

        if (logo_url && logo_url.length > 2000) {
            return res.status(400).json({error: 'Logo URL must be 2000 characters or less'});
        }

        if (client_url && client_url.length > 500) {
            return res.status(400).json({error: 'Client URL must be 500 characters or less'});
        }

        if (social_links) {
            if (typeof social_links !== 'object' || Array.isArray(social_links)) {
                return res.status(400).json({error: 'Social links must be an object'});
            }

            const allowedKeys = ['github', 'youtube', 'steam', 'twitter', 'linkedin', 'facebook', 'instagram', 'discord'];
            for (const [key, value] of Object.entries(social_links)) {
                if (!allowedKeys.includes(key)) {
                    return res.status(400).json({error: `Invalid social link key: ${key}`});
                }
                if (typeof value !== 'string' || value.length > 500) {
                    return res.status(400).json({error: `Social link ${key} must be a string with 500 characters or less`});
                }
            }
        }

        let brandingConfig = await BrandingConfig.findByPk(1);

        const updateData = {
            app_name: app_name.trim(),
            logo_url: logo_url || null,
            tagline: tagline || null,
            social_links: social_links || null,
            client_url: client_url || null,
        };

        if (brandingConfig) {
            await brandingConfig.update(updateData);
        } else {
            brandingConfig = await BrandingConfig.create({
                id: 1,
                ...updateData,
            });
        }

        res.json({
            message: 'Branding configuration updated successfully',
            brandingConfig
        });
    } catch (error) {
        console.error('Error updating branding config:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    getUsers,
    updateUserRole,
    getProjectMembers,
    addProjectMember,
    removeProjectMember,
    getSMTPConfig,
    updateSMTPConfig,
    testSMTPConfig,
    getBrandingConfig,
    updateBrandingConfig,
};
