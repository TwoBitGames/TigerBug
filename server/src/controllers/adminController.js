const { User, Project, ProjectMembership, SMTPConfig } = require('../models/associations');
const { sendEmail } = require('../utils/email');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'is_admin', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin } = req.body;

    if (typeof is_admin !== 'boolean') {
      return res.status(400).json({ error: 'is_admin must be a boolean' });
    }

    if (req.user.id === parseInt(id) && !is_admin) {
      return res.status(400).json({ error: 'Cannot remove admin status from yourself' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ is_admin });

    res.json({ 
      message: `User ${is_admin ? 'granted' : 'removed'} admin privileges`,
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const memberships = await ProjectMembership.findAll({
      where: { project_id: id },
      include: [{
        model: User,
        attributes: ['id', 'email', 'is_admin', 'created_at'],
      }],
      order: [['role', 'ASC'], [User, 'email', 'ASC']],
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
        role: membership.role,
        user: membership.User,
      }))
    });
  } catch (error) {
    console.error('Error fetching project members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProjectMemberRole = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    const validRoles = ['Reporter', 'Manager', 'Administrator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Reporter, Manager, or Administrator' });
    }

    const membership = await ProjectMembership.findOne({
      where: { project_id: projectId, user_id: userId },
      include: [{ model: User, attributes: ['email'] }]
    });

    if (!membership) {
      return res.status(404).json({ error: 'Project membership not found' });
    }

    await membership.update({ role });

    res.json({ 
      message: 'Member role updated successfully',
      membership: {
        id: membership.id,
        user_id: membership.user_id,
        project_id: membership.project_id,
        role: membership.role,
        user: membership.User,
      }
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { user_id, role = 'Reporter' } = req.body;

    const validRoles = ['Reporter', 'Manager', 'Administrator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Reporter, Manager, or Administrator' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingMembership = await ProjectMembership.findOne({
      where: {
        user_id: user_id,
        project_id: projectId,
      },
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    const membership = await ProjectMembership.create({
      user_id: user_id,
      project_id: projectId,
      role: role,
    });

    res.status(201).json({ 
      message: 'Member added successfully',
      membership: {
        id: membership.id,
        user_id: membership.user_id,
        project_id: membership.project_id,
        role: membership.role,
      }
    });
  } catch (error) {
    console.error('Error adding project member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const membership = await ProjectMembership.findOne({
      where: {
        project_id: projectId,
        user_id: userId,
      },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Project membership not found' });
    }

    await membership.destroy();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    const { password, ...configWithoutPassword } = smtpConfig.toJSON();

    res.json({ smtpConfig: configWithoutPassword });
  } catch (error) {
    console.error('Error fetching SMTP config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSMTPConfig = async (req, res) => {
  try {
    const { host, port, username, password, use_tls, from_address } = req.body;

    if (!host || !username || !from_address) {
      return res.status(400).json({ error: 'Host, username, and from_address are required' });
    }

    if (port && (port < 1 || port > 65535)) {
      return res.status(400).json({ error: 'Port must be between 1 and 65535' });
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

    const { password: _, ...configWithoutPassword } = smtpConfig.toJSON();

    res.json({ 
      message: 'SMTP configuration updated successfully',
      smtpConfig: configWithoutPassword 
    });
  } catch (error) {
    console.error('Error updating SMTP config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const testSMTPConfig = async (req, res) => {
  try {
    const { test_email } = req.body;

    if (!test_email) {
      return res.status(400).json({ error: 'test_email is required' });
    }

    const smtpConfig = await SMTPConfig.findByPk(1);
    if (!smtpConfig) {
      return res.status(400).json({ error: 'SMTP configuration not found' });
    }

    try {
      await sendEmail(
        test_email,
        'SMTP Configuration Test',
        'This is a test email to verify your SMTP configuration is working correctly.'
      );

      res.json({ message: 'Test email sent successfully' });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      res.status(400).json({ 
        error: 'Failed to send test email', 
        details: emailError.message 
      });
    }
  } catch (error) {
    console.error('Error testing SMTP config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  getSMTPConfig,
  updateSMTPConfig,
  testSMTPConfig,
};
