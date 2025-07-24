const {body, validationResult} = require('express-validator');
const { Project, User, ProjectMembership } = require('../models/associations');

const validateProject = [
    body('name').trim().isLength({min: 1}).withMessage('Project name is required'),
    body('description').optional().trim(),
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
            attributes: ['id', 'name', 'description', 'created_at'],
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
            attributes: ['id', 'name', 'description', 'created_at'],
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
        const {name, description} = req.body;

        if (!req.user.is_admin) {
            return res.status(403).json({error: 'Admin privileges required'});
        }

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        await project.update({name, description});

        res.json({
            message: 'Project updated successfully',
            project,
        });
    } catch (error) {
        console.error('Update project error:', error);
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

module.exports = {
    validateProject,
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
};
