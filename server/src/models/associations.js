const User = require('./User');
const Project = require('./Project');
const ProjectMembership = require('./ProjectMembership');
const Post = require('./Post');
const Comment = require('./Comment');
const PostVote = require('./PostVote');
const Attachment = require('./Attachment');
const SMTPConfig = require('./SMTPConfig');
const BrandingConfig = require('./BrandingConfig');

// User and Project many-to-many through ProjectMembership
User.belongsToMany(Project, {
  through: ProjectMembership,
  foreignKey: 'user_id',
  otherKey: 'project_id',
  as: 'projects'
});

Project.belongsToMany(User, {
  through: ProjectMembership,
  foreignKey: 'project_id',
  otherKey: 'user_id',
  as: 'members'
});

// Direct associations for easier querying
User.hasMany(ProjectMembership, { foreignKey: 'user_id' });
ProjectMembership.belongsTo(User, { foreignKey: 'user_id' });

Project.hasMany(ProjectMembership, { foreignKey: 'project_id' });
ProjectMembership.belongsTo(Project, { foreignKey: 'project_id' });

// Post associations
Project.hasMany(Post, { foreignKey: 'project_id', as: 'posts' });
Post.belongsTo(Project, { foreignKey: 'project_id' });

User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Post assignee association
User.hasMany(Post, { foreignKey: 'assignee_id', as: 'assigned_posts' });
Post.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });

// Comment associations
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'post_id' });

User.hasMany(Comment, { foreignKey: 'author_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// PostVote associations
User.hasMany(PostVote, { foreignKey: 'user_id' });
PostVote.belongsTo(User, { foreignKey: 'user_id' });

Post.hasMany(PostVote, { foreignKey: 'post_id', as: 'votes' });
PostVote.belongsTo(Post, { foreignKey: 'post_id' });

Post.hasMany(Attachment, { 
  foreignKey: 'related_id',
  scope: { related_type: 'post' },
  as: 'attachments',
  constraints: false
});
Comment.hasMany(Attachment, { 
  foreignKey: 'related_id',
  scope: { related_type: 'comment' },
  as: 'attachments',
  constraints: false
});

module.exports = {
  User,
  Project,
  ProjectMembership,
  Post,
  Comment,
  PostVote,
  Attachment,
  SMTPConfig,
  BrandingConfig
};
