const { ProjectMembership } = require('../models/associations');

const checkProjectPermission = async (userId, projectId) => {
    try {
        const membership = await ProjectMembership.findOne({
            where: {
                user_id: userId,
                project_id: projectId
            }
        });

        return { hasAccess: !!membership };
    } catch (error) {
        console.error('Error checking project permission:', error);
        return { hasAccess: false };
    }
};

const canCreatePost = (user) => {
    return !!user;
};

const canEditPost = (user, post, isProjectMember = false, isAdmin = false) => {
    if (!user) return false;
    
    if (isAdmin) {
        return true;
    }

    if (isProjectMember) {
        return true;
    }
    
    if (post.author_id === user.id) {
        return 'limited';
    }
    
    return false;
};

const canEditManagerFields = (user, isProjectMember = false, isAdmin = false) => {
    if (!user) return false;
    
    if (isAdmin || isProjectMember) {
        return true;
    }
    
    return false;
};

const canCreateSubIssue = (user, isProjectMember = false, isAdmin = false) => {
    if (!user) return false;
    
    if (isAdmin || isProjectMember) {
        return true;
    }
    
    return false;
};

const canDeletePost = (user, post, isProjectMember = false, isAdmin = false) => {
    if (!user) return false;

    if (isAdmin) {
        return true;
    }

    if (isProjectMember) {
        return true;
    }

    return post.author_id === user.id;
};

const canEditComment = (user, comment, isProjectMember = false, isAdmin = false) => {
    if (!user) return false;

    if (isAdmin) {
        return true;
    }

    if (isProjectMember) {
        return true;
    }

    return comment.author_id === user.id;
};

const canDeleteComment = (user, comment, isProjectMember = false, isAdmin = false) => {
    if (!user) return false;

    if (isAdmin) {
        return true;
    }

    if (isProjectMember) {
        return true;
    }

    return comment.author_id === user.id;
};

const canViewPrivatePost = (user, post, isProjectMember = false, isAdmin = false) => {
    if (!post.is_private) return true;
    
    if (!user) return false;

    if (isAdmin) {
        return true;
    }

    if (isProjectMember) {
        return true;
    }

    return post.author_id === user.id;
};

const canChangePostStatus = (user, post, isProjectMember = false, isAdmin = false) => {
    if (!user) return false;

    if (isAdmin) {
        return true;
    }

    if (isProjectMember) {
        return true;
    }

    return false;
};

module.exports = {
    checkProjectPermission, 
    canCreatePost,
    canEditPost,
    canDeletePost,
    canEditComment,
    canDeleteComment,
    canViewPrivatePost,
    canChangePostStatus,
    canEditManagerFields,
    canCreateSubIssue
};
