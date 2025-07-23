const {ProjectMembership} = require('../models');

const checkProjectPermission = async (userId, projectId, requiredRoles = []) => {
    try {
        const membership = await ProjectMembership.findOne({
            where: {
                user_id: userId,
                project_id: projectId
            }
        });

        if (!membership) return {hasAccess: false, role: null};

        const hasAccess = requiredRoles.length === 0 || requiredRoles.includes(membership.role);
        return {hasAccess, role: membership.role};
    } catch (error) {
        console.error('Error checking project permission:', error);
        return {hasAccess: false, role: null};
    }
};

const canManagePost = (user, post, userRole) => {
    return post.author_id === user.id || ['Manager', 'Administrator'].includes(userRole);
};

const canViewPrivatePost = (user, post, userRole) => {
    if (!post.is_private) return true;
    return post.author_id === user.id || ['Manager', 'Administrator'].includes(userRole);
};

module.exports = {checkProjectPermission, canManagePost, canViewPrivatePost};
