import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useDialog} from '../contexts/DialogContext';
import {postsApi, commentsApi, attachmentsApi, projectsApi} from '../services/api';
import type {Post, Comment, UpdatePostData, CreateCommentData, Attachment, User as UserType} from '../types';

import {IssueHeader} from './issue/IssueHeader';
import {IssueCard} from './issue/IssueCard';
import {IssueMetadata} from './issue/IssueMetadata';
import {AttachmentsList} from './issue/AttachmentsList';
import {AttachmentDialog} from './issue/AttachmentDialog';
import {CommentsList} from './issue/CommentsList';
import {CommentForm} from './issue/CommentForm';
import {EditIssueSheet} from './issue/EditIssueSheet';
import {SubIssues} from './issue/SubIssues';
import {isImageFile} from './issue/fileUtils';

interface IssueDetailProps {
    issueId: number;
    projectId: number;
    onBack: () => void;
    onNavigateToIssue?: (issueId: number) => void;
    onCreateSubIssue?: (parentIssueId: number) => void;
}

export const IssueDetail = ({issueId, projectId, onBack, onNavigateToIssue, onCreateSubIssue}: IssueDetailProps) => {
    const {isAuthenticated} = useAuth();
    const {confirm, alert} = useDialog();
    const [issue, setIssue] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStatus, setEditStatus] = useState<'Open' | 'In Progress' | 'Closed'>('Open');
    const [editIsPrivate, setEditIsPrivate] = useState(false);
    const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [editIssueType, setEditIssueType] = useState<'Bug' | 'Feature'>('Bug');
    const [editAssigneeId, setEditAssigneeId] = useState<string>('unassigned');
    const [editStoryPoints, setEditStoryPoints] = useState<string>('');
    const [editTimeEstimate, setEditTimeEstimate] = useState<string>('');
    const [editDueDate, setEditDueDate] = useState<Date | undefined>();
    const [editLabels, setEditLabels] = useState<string[]>([]);
    const [newEditLabel, setNewEditLabel] = useState('');

    const [projectMembers, setProjectMembers] = useState<UserType[]>([]);

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
    const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);

    const [commentAttachments, setCommentAttachments] = useState<File[]>([]);

    const canEdit = Boolean(issue?.can_edit);
    const canDelete = Boolean(issue?.can_delete);
    const canChangeStatus = Boolean(issue?.can_change_status);
    const canEditManagerFields = Boolean(issue?.can_edit_manager_fields);

    useEffect(() => {
        loadIssue();
        loadComments();
        loadProjectMembers();
    }, [issueId, projectId]);

    const loadProjectMembers = async () => {
        try {
            const members = await projectsApi.getMembers(projectId);
            setProjectMembers(members);
        } catch (error) {
            console.error('Failed to load project members:', error);
        }
    };

    const loadIssue = async () => {
        try {
            setIsLoading(true);
            const data = await postsApi.getById(projectId, issueId);
            setIssue(data);
            setEditTitle(data.title);
            setEditDescription(data.description);
            setEditStatus(data.status);
            setEditIsPrivate(data.is_private);
            setEditPriority(data.priority || 'Medium');
            setEditIssueType(data.issue_type || 'Bug');
            setEditAssigneeId(data.assignee_id?.toString() || 'unassigned');
            setEditStoryPoints(data.story_points?.toString() || '');
            setEditTimeEstimate(data.time_estimate?.toString() || '');
            setEditDueDate(data.due_date ? new Date(data.due_date) : undefined);
            setEditLabels(data.labels || []);

            if (data.attachments) {
                setAttachments(data.attachments);
            }
        } catch (error) {
            console.error('Failed to load issue:', error);
            setError('Failed to load issue details');
        } finally {
            setIsLoading(false);
        }
    };

    const refreshIssue = async () => {
        try {
            const data = await postsApi.getById(projectId, issueId);
            setIssue(data);
            setEditTitle(data.title);
            setEditDescription(data.description);
            setEditStatus(data.status);
            setEditIsPrivate(data.is_private);
            setEditPriority(data.priority || 'Medium');
            setEditIssueType(data.issue_type || 'Bug');
            setEditAssigneeId(data.assignee_id?.toString() || 'unassigned');
            setEditStoryPoints(data.story_points?.toString() || '');
            setEditTimeEstimate(data.time_estimate?.toString() || '');
            setEditDueDate(data.due_date ? new Date(data.due_date) : undefined);
            setEditLabels(data.labels || []);

            if (data.attachments) {
                setAttachments(data.attachments);
            }
        } catch (error) {
            console.error('Failed to refresh issue:', error);
        }
    };

    const loadComments = async () => {
        try {
            const data = await commentsApi.getAll(projectId, issueId);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    const handleSaveIssue = async () => {
        if (!issue) return;

        try {
            const updateData: UpdatePostData = {
                title: editTitle,
                description: editDescription,
            };

            if (canChangeStatus) {
                updateData.status = editStatus;
                updateData.is_private = editIsPrivate;
            }

            if (canEditManagerFields) {
                updateData.priority = editPriority;
                updateData.issue_type = editIssueType;
                updateData.assignee_id = editAssigneeId && editAssigneeId !== 'unassigned' ? parseInt(editAssigneeId) : undefined;
                updateData.story_points = editStoryPoints ? parseInt(editStoryPoints) : undefined;
                updateData.time_estimate = editTimeEstimate ? parseInt(editTimeEstimate) : undefined;
                updateData.due_date = editDueDate ? editDueDate.toISOString().split('T')[0] : undefined;
                updateData.labels = editLabels;
            }

            await postsApi.update(projectId, issueId, updateData);
            await refreshIssue();
            setIsEditSheetOpen(false);
        } catch (error) {
            console.error('Failed to update issue:', error);
            setError('Failed to update issue');
        }
    };

    const handleOpenEditSheet = () => {
        if (issue) {
            setEditTitle(issue.title);
            setEditDescription(issue.description);
            setEditStatus(issue.status);
            setEditIsPrivate(issue.is_private);
            setEditPriority(issue.priority || 'Medium');
            setEditIssueType(issue.issue_type || 'Bug');
            setEditAssigneeId(issue.assignee_id?.toString() || 'unassigned');
            setEditStoryPoints(issue.story_points?.toString() || '');
            setEditTimeEstimate(issue.time_estimate?.toString() || '');
            setEditDueDate(issue.due_date ? new Date(issue.due_date) : undefined);
            setEditLabels(issue.labels || []);
            setNewEditLabel('');
            setIsEditSheetOpen(true);
        }
    };

    const handleDeleteIssue = async () => {
        if (!issue) return;

        const confirmed = await confirm('Are you sure you want to delete this issue?');
        if (!confirmed) return;

        try {
            await postsApi.delete(projectId, issueId);
            onBack();
        } catch (error) {
            console.error('Failed to delete issue:', error);
            setError('Failed to delete issue');
        }
    };

    const handleToggleVote = async () => {
        if (!issue || !isAuthenticated) return;

        try {
            setIsVoting(true);
            await postsApi.toggleVote(projectId, issueId);
            await refreshIssue();
        } catch (error) {
            console.error('Failed to toggle vote:', error);
        } finally {
            setIsVoting(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim() || !isAuthenticated) return;

        try {
            setIsSubmittingComment(true);
            const commentData: CreateCommentData = {
                message: newComment.trim(),
            };

            const createdComment = await commentsApi.create(projectId, issueId, commentData);

            if (commentAttachments.length > 0) {
                try {
                    await attachmentsApi.upload(commentAttachments, 'comment', createdComment.id);
                } catch (uploadError) {
                    console.error('Failed to upload comment attachments:', uploadError);
                }
            }

            setNewComment('');
            setCommentAttachments([]);
            await loadComments();
        } catch (error) {
            console.error('Failed to submit comment:', error);
            setError('Failed to submit comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleEditComment = async (commentId: number, message: string) => {
        try {
            await commentsApi.update(projectId, issueId, commentId, {message});
            setEditingComment(null);
            setEditCommentText('');
            await loadComments();
        } catch (error) {
            console.error('Failed to update comment:', error);
            setError('Failed to update comment');
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        const confirmed = await confirm('Are you sure you want to delete this comment?');
        if (!confirmed) return;

        try {
            await commentsApi.delete(projectId, issueId, commentId);
            await loadComments();
        } catch (error) {
            console.error('Failed to delete comment:', error);
            setError('Failed to delete comment');
        }
    };

    const handleDownloadAttachment = (attachmentId: number) => {
        attachmentsApi.download(attachmentId);
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        const confirmed = await confirm('Are you sure you want to delete this attachment?');
        if (!confirmed) return;

        try {
            await attachmentsApi.delete(attachmentId);
            await refreshIssue();
        } catch (error) {
            console.error('Failed to delete attachment:', error);
        }
    };

    const handleAttachmentClick = (attachment: Attachment) => {
        if (isImageFile(attachment.original_filename)) {
            setSelectedAttachment(attachment);
            setIsAttachmentDialogOpen(true);
        } else {
            handleDownloadAttachment(attachment.id);
        }
    };

    const handleSubIssueClick = (subIssueId: number) => {
        if (onNavigateToIssue) {
            onNavigateToIssue(subIssueId);
        }
    };

    const handleCreateSubIssue = () => {
        if (onCreateSubIssue && issue) {
            onCreateSubIssue(issue.id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading issue details...</div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Issue not found</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <IssueHeader
                canEdit={canEdit}
                canDelete={canDelete}
                onBack={onBack}
                onEdit={handleOpenEditSheet}
                onDelete={handleDeleteIssue}
            />

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    <IssueCard
                        issue={issue}
                        isAuthenticated={isAuthenticated}
                        isVoting={isVoting}
                        onToggleVote={handleToggleVote}
                    />
                </div>
                <div className="lg:w-80 lg:flex-shrink-0">
                    <IssueMetadata issue={issue}/>
                </div>
            </div>

            <AttachmentsList
                attachments={attachments}
                canEdit={canEdit}
                onAttachmentClick={handleAttachmentClick}
                onDownload={handleDownloadAttachment}
                onDelete={handleDeleteAttachment}
            />

            {!issue.parent_issue_id && (
                <SubIssues
                    issue={issue}
                    onSubIssueClick={handleSubIssueClick}
                    onCreateSubIssue={handleCreateSubIssue}
                />
            )}

            <CommentsList
                comments={comments}
                editingComment={editingComment}
                editCommentText={editCommentText}
                setEditingComment={setEditingComment}
                setEditCommentText={setEditCommentText}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onAttachmentClick={handleAttachmentClick}
                onDownloadAttachment={handleDownloadAttachment}
            />

            {isAuthenticated && (
                <CommentForm
                    newComment={newComment}
                    setNewComment={setNewComment}
                    commentAttachments={commentAttachments}
                    setCommentAttachments={setCommentAttachments}
                    onSubmit={handleSubmitComment}
                    isSubmitting={isSubmittingComment}
                    onAlert={alert}
                />
            )}

            <AttachmentDialog
                isOpen={isAttachmentDialogOpen}
                onClose={() => setIsAttachmentDialogOpen(false)}
                attachment={selectedAttachment}
                canEdit={canEdit}
                onDownload={handleDownloadAttachment}
                onDelete={handleDeleteAttachment}
            />

            <EditIssueSheet
                isOpen={isEditSheetOpen}
                onClose={() => setIsEditSheetOpen(false)}
                onSave={handleSaveIssue}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                editIsPrivate={editIsPrivate}
                setEditIsPrivate={setEditIsPrivate}
                editPriority={editPriority}
                setEditPriority={setEditPriority}
                editIssueType={editIssueType}
                setEditIssueType={setEditIssueType}
                editAssigneeId={editAssigneeId}
                setEditAssigneeId={setEditAssigneeId}
                editStoryPoints={editStoryPoints}
                setEditStoryPoints={setEditStoryPoints}
                editTimeEstimate={editTimeEstimate}
                setEditTimeEstimate={setEditTimeEstimate}
                editDueDate={editDueDate}
                setEditDueDate={setEditDueDate}
                editLabels={editLabels}
                setEditLabels={setEditLabels}
                newEditLabel={newEditLabel}
                setNewEditLabel={setNewEditLabel}
                canChangeStatus={canChangeStatus}
                canEditManagerFields={canEditManagerFields}
                projectMembers={projectMembers}
            />
        </div>
    );
};
