const {body, validationResult} = require('express-validator');
const { Project, User, ProjectMembership } = require('../models/associations');
const path = require('path');
const fs = require('fs');

const validateProject = [
    body('name').trim().isLength({min: 1}).withMessage('Project name is required'),
    body('description').optional().trim(),
    body('disable_issue_creation').optional().isBoolean(),
];

const validateCrashReportsConfig = [
    body('crash_reports_enabled').optional().isBoolean(),
    body('crash_reports_template').optional().trim(),
    body('crash_reports_min_version').optional().trim(),
];

const createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {name, description} = req.body;

        const project = await Project.create({
            name,
            description,
        });

        res.status(201).json({
            message: 'Project created successfully',
            project,
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getProjects = async (req, res) => {
    try {
        const projects = await Project.findAll({
            attributes: ['id', 'name', 'description', 'logo_url', 'crash_reports_enabled', 'crash_reports_template', 'crash_reports_min_version', 'created_at'],
            order: [['created_at', 'DESC']],
        });

        res.json({projects});
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getProject = async (req, res) => {
    try {
        const {id} = req.params;

        const project = await Project.findByPk(id, {
            attributes: ['id', 'name', 'description', 'logo_url', 'crash_reports_enabled', 'crash_reports_template', 'crash_reports_min_version', 'created_at'],
        });

        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        res.json({project});
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {id} = req.params;
        const {name, description, disable_issue_creation, crash_reports_enabled, crash_reports_template, crash_reports_min_version} = req.body;

        if (!req.user.is_admin) {
            return res.status(403).json({error: 'Admin privileges required'});
        }

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const updateData = {name, description};
        if (disable_issue_creation !== undefined) {
            updateData.disable_issue_creation = disable_issue_creation;
        }
        if (crash_reports_enabled !== undefined) {
            updateData.crash_reports_enabled = crash_reports_enabled;
        }
        if (crash_reports_template !== undefined) {
            updateData.crash_reports_template = crash_reports_template;
        }
        if (crash_reports_min_version !== undefined) {
            updateData.crash_reports_min_version = crash_reports_min_version;
        }

        await project.update(updateData);

        res.json({
            message: 'Project updated successfully',
            project,
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateCrashReportsConfig = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {id} = req.params;
        const {crash_reports_enabled, crash_reports_template, crash_reports_min_version} = req.body;

        if (!req.user.is_admin) {
            return res.status(403).json({error: 'Admin privileges required'});
        }

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const updateData = {};
        if (crash_reports_enabled !== undefined) {
            updateData.crash_reports_enabled = crash_reports_enabled;
        }
        if (crash_reports_template !== undefined) {
            updateData.crash_reports_template = crash_reports_template;
        }
        if (crash_reports_min_version !== undefined) {
            updateData.crash_reports_min_version = crash_reports_min_version;
        }

        await project.update(updateData);

        res.json({
            message: 'Crash reports configuration updated successfully',
            project,
        });
    } catch (error) {
        console.error('Update crash reports config error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const addMember = async (req, res) => {
    try {
        const {id} = req.params;
        const {email} = req.body;

        const user = await User.findOne({where: {email}});
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        const existingMembership = await ProjectMembership.findOne({
            where: {
                user_id: user.id,
                project_id: id,
            },
        });

        if (existingMembership) {
            return res.status(400).json({error: 'User is already a member'});
        }

        await ProjectMembership.create({
            user_id: user.id,
            project_id: id
        });

        res.status(201).json({
            message: 'Member added successfully',
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const removeMember = async (req, res) => {
    try {
        const {id, userId} = req.params;

        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({error: 'Cannot remove yourself from project'});
        }

        const membershipToRemove = await ProjectMembership.findOne({
            where: {
                user_id: userId,
                project_id: id,
            },
        });

        if (!membershipToRemove) {
            return res.status(404).json({error: 'Member not found'});
        }

        await membershipToRemove.destroy();

        res.json({
            message: 'Member removed successfully',
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const deleteProject = async (req, res) => {
    try {
        const {id} = req.params;

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        await ProjectMembership.destroy({where: {project_id: id}});


        await project.destroy();

        res.json({
            message: 'Project deleted successfully',
        });
    } catch (error) {
        console.error('Delete project error:', error);
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
                attributes: ['id', 'username', 'email', 'profile_picture']
            }]
        });

        const members = memberships.map(membership => membership.User);

        res.json({members});
    } catch (error) {
        console.error('Get project members error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const uploadProjectLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({error: 'No file uploaded'});
        }

        const {id} = req.params;

        if (!req.user.is_admin) {
            return res.status(403).json({error: 'Admin privileges required'});
        }

        const project = await Project.findByPk(id);

        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        if (project.logo_url) {
            const oldFilePath = path.join(process.env.UPLOAD_PATH || './attachments', 'project-logos', path.basename(project.logo_url));
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                } catch (error) {
                    console.error('Error deleting old project logo:', error);
                }
            }
        }

        const relativePath = `/api/project-logos/${path.basename(req.file.path)}`;
        await project.update({logo_url: relativePath});

        res.json({
            message: 'Project logo uploaded successfully',
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
                logo_url: project.logo_url,
                created_at: project.created_at,
            },
        });
    } catch (error) {
        console.error('Project logo upload error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const deleteProjectLogo = async (req, res) => {
    try {
        const {id} = req.params;

        if (!req.user.is_admin) {
            return res.status(403).json({error: 'Admin privileges required'});
        }

        const project = await Project.findByPk(id);

        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        if (!project.logo_url) {
            return res.status(400).json({error: 'No project logo to delete'});
        }

        const filePath = path.join(process.env.UPLOAD_PATH || './attachments', 'project-logos', path.basename(project.logo_url));
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error('Error deleting project logo file:', error);
            }
        }

        await project.update({logo_url: null});

        res.json({
            message: 'Project logo deleted successfully',
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
                logo_url: null,
                created_at: project.created_at,
            },
        });
    } catch (error) {
        console.error('Project logo delete error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    validateProject,
    validateCrashReportsConfig,
    createProject,
    getProjects,
    getProject,
    updateProject,
    updateCrashReportsConfig,
    deleteProject,
    addMember,
    removeMember,
    getProjectMembers,
    uploadProjectLogo,
    deleteProjectLogo,
};
