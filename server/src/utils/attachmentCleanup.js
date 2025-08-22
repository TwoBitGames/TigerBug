const fs = require('fs');
const {Attachment} = require('../models/associations');

const deleteAttachmentsByEntity = async (relatedType, relatedId) => {
    try {
        const attachments = await Attachment.findAll({
            where: {
                related_type: relatedType,
                related_id: relatedId,
            },
        });

        let deletedFiles = 0;
        let deletedRecords = 0;

        for (const attachment of attachments) {
            try {
                if (fs.existsSync(attachment.file_path)) {
                    fs.unlinkSync(attachment.file_path);
                    deletedFiles++;
                    console.log(`Deleted attachment file: ${attachment.file_path}`);
                } else {
                    console.warn(`Attachment file not found on disk: ${attachment.file_path}`);
                }
            } catch (fileError) {
                console.error(`Failed to delete attachment file ${attachment.file_path}:`, fileError);
            }
        }

        const deleteResult = await Attachment.destroy({
            where: {
                related_type: relatedType,
                related_id: relatedId,
            },
        });

        deletedRecords = deleteResult;

        return {
            deletedFiles,
            deletedRecords,
        };
    } catch (error) {
        console.error(`Failed to delete attachments for ${relatedType} ${relatedId}:`, error);
        throw error;
    }
};


const deleteAttachmentsForPost = async (postId) => {
    try {
        const {Comment} = require('../models/associations');
        const comments = await Comment.findAll({
            where: {post_id: postId},
            attributes: ['id'],
        });

        let totalDeletedFiles = 0;
        let totalDeletedRecords = 0;

        for (const comment of comments) {
            const result = await deleteAttachmentsByEntity('comment', comment.id);
            totalDeletedFiles += result.deletedFiles;
            totalDeletedRecords += result.deletedRecords;
        }

        const postResult = await deleteAttachmentsByEntity('post', postId);
        totalDeletedFiles += postResult.deletedFiles;
        totalDeletedRecords += postResult.deletedRecords;

        return {
            deletedFiles: totalDeletedFiles,
            deletedRecords: totalDeletedRecords,
        };
    } catch (error) {
        console.error(`Failed to delete attachments for post ${postId}:`, error);
        throw error;
    }
};

const deleteAttachmentById = async (attachmentId) => {
    try {
        const attachment = await Attachment.findByPk(attachmentId);
        if (!attachment) {
            console.warn(`Attachment with ID ${attachmentId} not found`);
            return false;
        }

        if (fs.existsSync(attachment.file_path)) {
            fs.unlinkSync(attachment.file_path);
            console.log(`Deleted attachment file: ${attachment.file_path}`);
        } else {
            console.warn(`Attachment file not found on disk: ${attachment.file_path}`);
        }

        await attachment.destroy();
        console.log(`Deleted attachment record with ID: ${attachmentId}`);

        return true;
    } catch (error) {
        console.error(`Failed to delete attachment ${attachmentId}:`, error);
        throw error;
    }
};

module.exports = {
    deleteAttachmentsByEntity,
    deleteAttachmentsForPost,
    deleteAttachmentById,
};