const express = require('express');
const router = express.Router();
const fs = require('fs');
const {Attachment, Post, Comment} = require('../models/associations');
const {authenticateToken, optionalAuth} = require('../middleware/auth');
const {uploadMiddleware, handleUploadError} = require('../middleware/upload');
const {checkProjectPermission} = require('../utils/permissions');

router.post('/:type/:id', authenticateToken, uploadMiddleware, handleUploadError, async (req, res) => {
    try {
        const {type, id} = req.params;

        if (!['post', 'comment'].includes(type)) {
            return res.status(400).json({error: 'Invalid attachment type'});
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({error: 'No files uploaded'});
        }

        let relatedEntity;
        let projectId;

        if (type === 'post') {
            relatedEntity = await Post.findByPk(id);
            projectId = relatedEntity?.project_id;
        } else {
            relatedEntity = await Comment.findByPk(id, {
                include: [{model: Post, attributes: ['project_id']}],
            });
            projectId = relatedEntity?.Post?.project_id;
        }

        if (!relatedEntity) {
            return res.status(404).json({error: `${type} not found`});
        }

        const {hasAccess} = await checkProjectPermission(req.user.id, projectId);

        const isPostAuthor = type === 'post' && relatedEntity.author_id === req.user.id;
        const isCommentAuthor = type === 'comment' && relatedEntity.author_id === req.user.id;

        const canUpload = isPostAuthor || isCommentAuthor || req.user.is_admin || hasAccess;

        if (!canUpload) {
            return res.status(403).json({error: 'Access denied'});
        }

        const attachments = await Promise.all(
            req.files.map(file =>
                Attachment.create({
                    related_type: type,
                    related_id: id,
                    file_path: file.path,
                    original_filename: file.originalname,
                    uploaded_by: req.user.id,
                })
            )
        );

        res.status(201).json({
            message: 'Files uploaded successfully',
            attachments: attachments.map(att => ({
                id: att.id,
                original_filename: att.original_filename,
                uploaded_at: att.uploaded_at,
            })),
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const {id} = req.params;

        const attachment = await Attachment.findByPk(id);
        if (!attachment) {
            return res.status(404).json({error: 'Attachment not found'});
        }

        let projectId;
        let relatedEntity;
        if (attachment.related_type === 'post') {
            relatedEntity = await Post.findByPk(attachment.related_id);
            projectId = relatedEntity?.project_id;
        } else {
            relatedEntity = await Comment.findByPk(attachment.related_id, {
                include: [{model: Post, attributes: ['project_id']}],
            });
            projectId = relatedEntity?.Post?.project_id;
        }

        if (!projectId) {
            return res.status(404).json({error: 'Related entity not found'});
        }

        if (!fs.existsSync(attachment.file_path)) {
            return res.status(404).json({error: 'File not found on disk'});
        }

        res.download(attachment.file_path, attachment.original_filename);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const {id} = req.params;

        const attachment = await Attachment.findByPk(id);
        if (!attachment) {
            return res.status(404).json({error: 'Attachment not found'});
        }

        let projectId;

        if (attachment.related_type === 'post') {
            const post = await Post.findByPk(attachment.related_id);
            projectId = post?.project_id;
        } else {
            const comment = await Comment.findByPk(attachment.related_id, {
                include: [{model: Post, attributes: ['project_id']}],
            });
            projectId = comment?.Post?.project_id;
        }

        if (!projectId) {
            return res.status(404).json({error: 'Related entity not found'});
        }

        const canDelete = attachment.uploaded_by === req.user.id || req.user.is_admin;

        if (!canDelete) {
            return res.status(403).json({error: 'Access denied'});
        }

        if (fs.existsSync(attachment.file_path)) {
            fs.unlinkSync(attachment.file_path);
        }

        await attachment.destroy();

        res.json({
            message: 'Attachment deleted successfully',
        });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

module.exports = router;
