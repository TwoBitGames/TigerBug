import {useState, useEffect} from 'react';
import {formatDistanceToNow} from 'date-fns';
import {
    ArrowLeft,
    Edit2,
    Save,
    X,
    MessageSquare,
    User,
    Calendar,
    Tag,
    Lock,
    Unlock,
    Trash2,
    ChevronUp,
    MoreVertical,
    Paperclip,
    Download,
    Clock,
    Target,
    UserIcon,
    Hash,
    Bug,
    Lightbulb,
} from 'lucide-react';
import {Button} from './ui/button';
import {Card, CardContent, CardHeader, CardTitle} from './ui/card';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Textarea} from './ui/textarea';
import {Badge} from './ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {PriorityBadge} from './ui/priority-badge';
import {IssueTypeBadge} from './ui/issue-type-badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from './ui/sheet';
import {useAuth} from '../contexts/AuthContext';
import {useDialog} from '../contexts/DialogContext';
import {postsApi, commentsApi, attachmentsApi, projectsApi} from '../services/api';
import type {Post, Comment, UpdatePostData, CreateCommentData, Attachment, User as UserType} from '../types';

interface IssueDetailProps {
    issueId: number;
    projectId: number;
    onBack: () => void;
}

export const IssueDetail = ({issueId, projectId, onBack}: IssueDetailProps) => {
    const {isAuthenticated} = useAuth();
    const {confirm, alert} = useDialog();
    const [issue, setIssue] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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
    const [editDueDate, setEditDueDate] = useState<string>('');
    const [editLabels, setEditLabels] = useState<string[]>([]);
    const [newEditLabel, setNewEditLabel] = useState('');

    const [projectMembers, setProjectMembers] = useState<UserType[]>([]);

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
    const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);

    const [commentAttachments, setCommentAttachments] = useState<File[]>([]);

    const canEdit = issue?.can_edit || false;
    const canDelete = issue?.can_delete || false;
    const canChangeStatus = issue?.can_change_status || false;
    const canEditManagerFields = issue?.can_edit_manager_fields || false;

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
            setEditDueDate(data.due_date ? data.due_date.split('T')[0] : '');
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
                updateData.due_date = editDueDate || undefined;
                updateData.labels = editLabels;
            }

            const updatedIssue = await postsApi.update(projectId, issueId, updateData);
            setIssue(updatedIssue);
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
            setEditDueDate(issue.due_date ? issue.due_date.split('T')[0] : '');
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
            await postsApi.toggleVote(projectId, issueId);
            await loadIssue();
        } catch (error) {
            console.error('Failed to toggle vote:', error);
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
            await loadIssue();
        } catch (error) {
            console.error('Failed to delete attachment:', error);
        }
    };

    const handleCommentFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const {valid, invalid} = validateFiles(files);

        if (invalid.length > 0) {
            await alert(`Some files were not added:\n${invalid.map(f => `- ${f.name} (${f.size > 10 * 1024 * 1024 ? 'too large' : 'invalid type'})`).join('\n')}`);
        }

        setCommentAttachments(prev => [...prev, ...valid]);
        event.target.value = '';
    };

    const removeCommentAttachment = (index: number) => {
        setCommentAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Open':
                return 'default';
            case 'In Progress':
                return 'secondary';
            case 'Closed':
                return 'outline';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open':
                return 'text-green-400';
            case 'In Progress':
                return 'text-yellow-400';
            case 'Closed':
                return 'text-gray-400';
            default:
                return 'text-gray-400';
        }
    };

    const isImageFile = (filename: string) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return imageExtensions.includes(ext);
    };

    const getFileIcon = (filename: string) => {
        if (isImageFile(filename)) {
            return '🖼️';
        }
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        switch (ext) {
            case '.pdf':
                return '📄';
            case '.zip':
            case '.rar':
                return '📦';
            case '.doc':
            case '.docx':
                return '📝';
            case '.txt':
                return '📃';
            default:
                return '📎';
        }
    };

    const validateFiles = (files: File[]): { valid: File[], invalid: File[] } => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'text/plain', 'application/pdf', 'application/zip',
            'application/x-zip-compressed', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        const valid: File[] = [];
        const invalid: File[] = [];

        files.forEach(file => {
            if (file.size <= maxSize && allowedTypes.includes(file.type)) {
                valid.push(file);
            } else {
                invalid.push(file);
            }
        });

        return {valid, invalid};
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getUserRoleLabel = (user: UserType | undefined): {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline'
    } | null => {
        if (!user) return null;

        if (user.is_admin) {
            return {label: 'Admin', variant: 'destructive'};
        }

        if (user.is_project_member) {
            return {label: 'Manager', variant: 'default'};
        }

        return {label: 'User', variant: 'outline'};
    };

    const handleAttachmentClick = (attachment: Attachment) => {
        if (isImageFile(attachment.original_filename)) {
            setSelectedAttachment(attachment);
            setIsAttachmentDialogOpen(true);
        } else {
            handleDownloadAttachment(attachment.id);
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
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Back to Issues
                </Button>

                <div className="flex items-center space-x-2">
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenEditSheet}
                            className="border-border text-muted-foreground hover:bg-accent cursor-pointer"
                        >
                            <Edit2 className="h-4 w-4 mr-2"/>
                            Edit Issue
                        </Button>
                    )}

                    {canDelete && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <MoreVertical className="h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                                <DropdownMenuItem
                                    onClick={handleDeleteIssue}
                                    className="text-red-400 hover:text-red-300 hover:bg-zinc-700 cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4 mr-2"/>
                                    Delete Issue
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                </div>)}

            <Card className="bg-card border-border backdrop-blur-xl">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                            <div className="space-y-3">
                                <CardTitle className="text-xl text-foreground">{issue.title}</CardTitle>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4"/>
                                        <span>{issue.author?.username || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4"/>
                                        <span>{formatDistanceToNow(new Date(issue.created_at), {addSuffix: true})}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge variant={getStatusBadgeVariant(issue.status)}
                                           className={getStatusColor(issue.status)}>
                                        <Tag className="h-3 w-3 mr-1"/>
                                        {issue.status}
                                    </Badge>
                                    <PriorityBadge priority={issue.priority || 'Medium'} size="sm"/>
                                    <IssueTypeBadge issueType={issue.issue_type || 'Bug'} size="sm"/>
                                    {issue.is_private && (
                                        <Badge variant="outline" className="text-orange-400 border-orange-400">
                                            <Lock className="h-3 w-3 mr-1"/>
                                            Private
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                            {isAuthenticated && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleToggleVote}
                                    className={`border-border flex items-center space-x-1 cursor-pointer ${
                                        issue.user_voted ? 'bg-primary/20 text-primary border-primary' : 'text-muted-foreground'
                                    }`}
                                >
                                    <ChevronUp className="h-4 w-4"/>
                                    <span>{issue.vote_count || 0}</span>
                                </Button>
                            )}

                            {!isAuthenticated && (
                                <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                                    <ChevronUp className="h-4 w-4"/>
                                    <span>{issue.vote_count || 0} votes</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="prose prose-sm max-w-none">
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {issue.description}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {(issue.assignee || issue.story_points || issue.time_estimate || issue.due_date || (issue.labels && issue.labels.length > 0)) && (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {issue.assignee && (
                        <Card className="bg-muted/30 border-border">
                            <CardContent className="p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                    <UserIcon className="h-3 w-3 text-muted-foreground"/>
                                    <span className="text-xs font-medium text-muted-foreground">Assignee</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${issue.assignee.username}`}
                                            alt={issue.assignee.username}
                                        />
                                        <AvatarFallback className="text-xs">
                                            {issue.assignee.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-foreground truncate">{issue.assignee.username}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {issue.story_points && (
                        <Card className="bg-muted/30 border-border">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Target className="h-3 w-3 text-muted-foreground"/>
                                        <span className="text-xs font-medium text-muted-foreground">Story Points</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs h-5 px-2">
                                        {issue.story_points}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {issue.time_estimate && (
                        <Card className="bg-muted/30 border-border">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-3 w-3 text-muted-foreground"/>
                                        <span className="text-xs font-medium text-muted-foreground">Estimate</span>
                                    </div>
                                    <span className="text-sm text-foreground font-medium">{issue.time_estimate}h</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {issue.due_date && (
                        <Card className="bg-muted/30 border-border">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-3 w-3 text-muted-foreground"/>
                                        <span className="text-xs font-medium text-muted-foreground">Due Date</span>
                                    </div>
                                    <span className="text-sm text-foreground font-medium">
                                        {new Date(issue.due_date).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {issue.labels && issue.labels.length > 0 && (
                        <Card className="bg-muted/30 border-border md:col-span-2 lg:col-span-3 xl:col-span-4">
                            <CardContent className="p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Hash className="h-3 w-3 text-muted-foreground"/>
                                    <span className="text-xs font-medium text-muted-foreground">Labels</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {issue.labels.map((label) => (
                                        <Badge key={label} variant="outline" className="text-xs h-5 px-2">
                                            {label}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {attachments.length > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-foreground">
                            <Paperclip className="h-5 w-5"/>
                            <span>Attachments ({attachments.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className={`group relative overflow-hidden rounded-lg border border-border bg-muted/40 transition-colors hover:border-accent ${
                                    isImageFile(attachment.original_filename) ? 'cursor-pointer hover:bg-muted/60' : ''
                                }`}
                                onClick={() => handleAttachmentClick(attachment)}
                            >
                                {isImageFile(attachment.original_filename) ? (
                                    <div
                                        className="aspect-video bg-muted flex items-center justify-center relative">
                                        <img
                                            src={`/api/attachments/${attachment.id}`}
                                            alt={attachment.original_filename}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling!.classList.remove('hidden');
                                            }}
                                        />
                                        <div className="hidden flex items-center justify-center w-full h-full">
                                            <span
                                                className="text-4xl">{getFileIcon(attachment.original_filename)}</span>
                                        </div>
                                        <div
                                            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="text-white text-sm font-medium">Click to view</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-muted flex items-center justify-center">
                                        <span className="text-4xl">{getFileIcon(attachment.original_filename)}</span>
                                    </div>
                                )}

                                <div className="p-3">
                                    <div
                                        className="text-sm text-foreground truncate">{attachment.original_filename}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(attachment.uploaded_at), {addSuffix: true})}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadAttachment(attachment.id);
                                            }}
                                            className="text-muted-foreground hover:text-foreground hover:bg-accent h-7 px-2"
                                        >
                                            <Download className="h-3 w-3 mr-1"/>
                                            Download
                                        </Button>
                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteAttachment(attachment.id);
                                                }}
                                                className="text-destructive hover:text-destructive/80 hover:bg-accent h-7 px-2"
                                            >
                                                <X className="h-3 w-3"/>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                <div className="flex items-center space-x-2 text-foreground mb-6">
                    <MessageSquare className="h-5 w-5"/>
                    <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
                </div>
                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                            <p className="text-lg font-medium">No comments yet</p>
                            <p className="text-sm">Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment, index) => (
                                <div key={comment.id} className="group relative">
                                    {index < comments.length - 1 && (
                                        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border"></div>
                                    )}

                                    <div className="flex space-x-4">
                                        <div className="flex-shrink-0">
                                            <Avatar className="h-10 w-10 ring-2 ring-border">
                                                <AvatarImage
                                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.author?.username || 'User'}`}
                                                    alt={comment.author?.username || 'User'}
                                                />
                                                <AvatarFallback
                                                    className="bg-gradient-to-br from-primary/20 to-orange-500/20 text-foreground text-sm font-medium">
                                                    {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="bg-muted rounded-xl border border-border p-4 group-hover:border-accent transition-colors">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-foreground text-sm">
                                                                {comment.author?.username || 'Unknown User'}
                                                            </span>
                                                        {(() => {
                                                            const roleInfo = getUserRoleLabel(comment.author);
                                                            return roleInfo ? (
                                                                <Badge variant={roleInfo.variant}
                                                                       className="text-xs h-5 px-2">
                                                                    {roleInfo.label}
                                                                </Badge>
                                                            ) : null;
                                                        })()}
                                                        <span className="text-muted-foreground text-xs">•</span>
                                                        <span className="text-muted-foreground text-xs">
                                                                {formatDistanceToNow(new Date(comment.created_at), {addSuffix: true})}
                                                            </span>
                                                    </div>

                                                    {(comment.can_edit || comment.can_delete) && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground h-7 w-7 p-0 transition-opacity"
                                                                >
                                                                    <MoreVertical className="h-3 w-3"/>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end"
                                                                                 className="bg-popover border-border">
                                                                {comment.can_edit && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setEditingComment(comment.id);
                                                                            setEditCommentText(comment.message);
                                                                        }}
                                                                        className="text-foreground hover:text-accent-foreground hover:bg-accent cursor-pointer"
                                                                    >
                                                                        <Edit2 className="h-3 w-3 mr-2"/>
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {comment.can_edit && comment.can_delete && (
                                                                    <DropdownMenuSeparator className="bg-border"/>
                                                                )}
                                                                {comment.can_delete && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteComment(comment.id)}
                                                                        className="text-red-400 hover:text-red-300 hover:bg-destructive/10 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="h-3 w-3 mr-2"/>
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>

                                                {editingComment === comment.id ? (
                                                    <div className="space-y-3">
                                                        <Textarea
                                                            value={editCommentText}
                                                            onChange={(e) => setEditCommentText(e.target.value)}
                                                            rows={3}
                                                            className="bg-input border-border text-foreground resize-none focus:border-primary/60"
                                                        />
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                onClick={() => handleEditComment(comment.id, editCommentText)}
                                                                size="sm"
                                                                className="bg-primary hover:bg-primary/90 h-7"
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setEditingComment(null);
                                                                    setEditCommentText('');
                                                                }}
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-border text-muted-foreground h-7"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">
                                                            {comment.message}
                                                        </p>
                                                        {comment.attachments && comment.attachments.length > 0 && (
                                                            <div className="border-t border-border pt-3 mt-3">
                                                                <div className="space-y-2">
                                                                    {comment.attachments.filter(att => att.original_filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)).length > 0 && (
                                                                        <div
                                                                            className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                            {comment.attachments
                                                                                .filter(att => att.original_filename.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                                                                                .map((attachment) => (
                                                                                    <div
                                                                                        key={attachment.id}
                                                                                        className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border cursor-pointer group"
                                                                                        onClick={() => handleAttachmentClick(attachment)}
                                                                                    >
                                                                                        <img
                                                                                            src={`/api/attachments/${attachment.id}`}
                                                                                            alt={attachment.original_filename}
                                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                                            loading="lazy"
                                                                                            onError={(e) => {
                                                                                                const target = e.target as HTMLImageElement;
                                                                                                target.style.display = 'none';
                                                                                                const parent = target.parentElement;
                                                                                                if (parent) {
                                                                                                    parent.innerHTML = `
                                                                                        <div class="w-full h-full flex items-center justify-center bg-muted">
                                                                                            <div class="text-muted-foreground text-center">
                                                                                                <div class="text-2xl mb-1">📁</div>
                                                                                                <div class="text-xs">${attachment.original_filename}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    `;
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"/>
                                                                                        <div
                                                                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <p className="text-xs text-white truncate">{attachment.original_filename}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                    )}

                                                                    {comment.attachments.filter(att => !att.original_filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)).length > 0 && (
                                                                        <div className="space-y-1">
                                                                            {comment.attachments
                                                                                .filter(att => !att.original_filename.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                                                                                .map((attachment) => (
                                                                                    <div
                                                                                        key={attachment.id}
                                                                                        className="flex items-center space-x-2 p-2 bg-muted rounded-lg border border-border hover:border-accent transition-colors cursor-pointer"
                                                                                        onClick={() => handleAttachmentClick(attachment)}
                                                                                    >
                                                                                        <div
                                                                                            className="text-lg">{getFileIcon(attachment.original_filename)}</div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-xs text-foreground truncate">{attachment.original_filename}</p>
                                                                                            <p className="text-xs text-muted-foreground">
                                                                                                {formatDistanceToNow(new Date(attachment.uploaded_at), {addSuffix: true})}
                                                                                            </p>
                                                                                        </div>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleDownloadAttachment(attachment.id);
                                                                                            }}
                                                                                            className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                                                                        >
                                                                                            <Download
                                                                                                className="h-3 w-3"/>
                                                                                        </Button>
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {isAuthenticated && (
                    <div className="space-y-4 p-7 bg-muted/40 rounded-xl border border-border">
                        <div className="space-y-3">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                rows={3}
                                className="bg-input border-border text-foreground resize-none focus:border-primary/60 focus:ring-primary/20"
                            />

                            {commentAttachments.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm text-foreground">Attachments
                                            ({commentAttachments.length})</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCommentAttachments([])}
                                            className="text-muted-foreground hover:text-red-400 h-6 text-xs"
                                        >
                                            Clear all
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {commentAttachments.map((file, index) => (
                                            <div key={index} className="relative group">
                                                {file.type.startsWith('image/') ? (
                                                    <div
                                                        className="relative aspect-square rounded-lg overflow-hidden bg-zinc-700/40 border border-zinc-600/30">
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt={file.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div
                                                            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"/>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeCommentAttachment(index)}
                                                            className="absolute top-1 right-1 text-white bg-black/50 hover:bg-red-500/80 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="h-3 w-3"/>
                                                        </Button>
                                                        <div
                                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                            <p className="text-xs text-white truncate">{file.name}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="flex items-center space-x-2 p-2 bg-zinc-700/40 rounded-lg border border-zinc-600/30 group-hover:border-zinc-500/50 transition-colors">
                                                        <div className="text-sm">{getFileIcon(file.name)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-zinc-300 truncate">{file.name}</p>
                                                            <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeCommentAttachment(index)}
                                                            className="text-zinc-400 hover:text-red-400 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="h-3 w-3"/>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleCommentFileUpload}
                                    className="hidden"
                                    id="comment-file-upload"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => document.getElementById("comment-file-upload")?.click()}
                                    className="text-zinc-400 hover:text-zinc-200 h-8 px-3"
                                >
                                    <Paperclip className="h-4 w-4 mr-1"/>
                                    Attach
                                </Button>
                                <div className="text-xs text-zinc-500">
                                    {newComment.length > 0 && `${newComment.length} characters`}
                                </div>
                            </div>
                            <Button
                                onClick={handleSubmitComment}
                                disabled={!newComment.trim() || isSubmittingComment}
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                            >
                                {isSubmittingComment ? 'Submitting...' : 'Add Comment'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] bg-zinc-900/95 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-zinc-100">
                            {selectedAttachment?.original_filename}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4">
                        {selectedAttachment && (
                            <img
                                src={`/api/attachments/${selectedAttachment.id}`}
                                alt={selectedAttachment.original_filename}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        )}
                    </div>
                    <div className="flex justify-center space-x-2 pb-4">
                        <Button
                            variant="outline"
                            onClick={() => selectedAttachment && handleDownloadAttachment(selectedAttachment.id)}
                            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                        >
                            <Download className="h-4 w-4 mr-2"/>
                            Download
                        </Button>
                        {canEdit && selectedAttachment && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleDeleteAttachment(selectedAttachment.id);
                                    setIsAttachmentDialogOpen(false);
                                }}
                                className="border-red-600 text-red-400 hover:bg-red-700/20"
                            >
                                <X className="h-4 w-4 mr-2"/>
                                Delete
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] px-0 flex flex-col">
                    <SheetHeader className="px-6 pb-6 border-b border-border">
                        <SheetTitle className="flex items-center gap-2 text-lg">
                            <Edit2 className="h-5 w-5"/>
                            Edit Issue
                        </SheetTitle>
                        <SheetDescription className="text-muted-foreground">
                            Make changes to your issue. Click save when you're done.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title" className="text-foreground font-medium">
                                    Title
                                </Label>
                                <Input
                                    id="edit-title"
                                    placeholder="Brief description of the issue"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description" className="text-foreground font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="edit-description"
                                    placeholder="Provide detailed information about the issue..."
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={6}
                                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                                />
                            </div>

                            {canChangeStatus && (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-status" className="text-foreground font-medium">
                                        Status
                                    </Label>
                                    <Select value={editStatus} onValueChange={(value: any) => setEditStatus(value)}>
                                        <SelectTrigger className="bg-input border-border text-foreground">
                                            <SelectValue placeholder="Select status"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    Open
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="In Progress">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                    In Progress
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Closed">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    Closed
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-priority" className="text-foreground font-medium">
                                        Priority
                                    </Label>
                                    <Select value={editPriority} onValueChange={(value: any) => setEditPriority(value)}>
                                        <SelectTrigger className="bg-input border-border text-foreground">
                                            <SelectValue placeholder="Select priority"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    Low
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                    Medium
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="High">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                    High
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Critical">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    Critical
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-issue-type" className="text-foreground font-medium">
                                        Issue Type
                                    </Label>
                                    <Select value={editIssueType}
                                            onValueChange={(value: any) => setEditIssueType(value)}>
                                        <SelectTrigger className="bg-input border-border text-foreground">
                                            <SelectValue placeholder="Select type"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bug">
                                                <div className="flex items-center gap-2">
                                                    <Bug className="h-4 w-4 text-red-400"/>
                                                    Bug
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Feature">
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-primary"/>
                                                    Feature
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {canEditManagerFields && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-foreground font-medium">Privacy</Label>
                                        <div className="flex items-center space-x-3">
                                            <Button
                                                type="button"
                                                variant={!editIsPrivate ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setEditIsPrivate(false)}
                                                className="flex-1 h-10"
                                            >
                                                <Unlock className="h-4 w-4 mr-2"/>
                                                Public
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={editIsPrivate ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setEditIsPrivate(true)}
                                                className="flex-1 h-10"
                                            >
                                                <Lock className="h-4 w-4 mr-2"/>
                                                Private
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {editIsPrivate ? 'Only you can see this issue' : 'Everyone can see this issue'}
                                        </p>
                                    </div>

                                    {projectMembers.length > 0 && (
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-assignee"
                                                   className="text-foreground font-medium flex items-center gap-2">
                                                <UserIcon className="h-4 w-4"/>
                                                Assignee
                                            </Label>
                                            <Select value={editAssigneeId} onValueChange={setEditAssigneeId}>
                                                <SelectTrigger className="bg-input border-border text-foreground">
                                                    <SelectValue placeholder="Assign to..."/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                                    {projectMembers.map((member) => (
                                                        <SelectItem key={member.id} value={member.id.toString()}>
                                                            {member.username}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="grid gap-6 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-story-points"
                                                   className="text-foreground font-medium flex items-center gap-2">
                                                <Target className="h-4 w-4"/>
                                                Story Points
                                            </Label>
                                            <Input
                                                id="edit-story-points"
                                                type="number"
                                                min="1"
                                                max="100"
                                                placeholder="1-100"
                                                value={editStoryPoints}
                                                onChange={(e) => setEditStoryPoints(e.target.value)}
                                                className="bg-input border-border text-foreground"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-time-estimate"
                                                   className="text-foreground font-medium flex items-center gap-2">
                                                <Clock className="h-4 w-4"/>
                                                Time (hours)
                                            </Label>
                                            <Input
                                                id="edit-time-estimate"
                                                type="number"
                                                min="0"
                                                max="999"
                                                placeholder="0-999"
                                                value={editTimeEstimate}
                                                onChange={(e) => setEditTimeEstimate(e.target.value)}
                                                className="bg-input border-border text-foreground"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-due-date"
                                                   className="text-foreground font-medium flex items-center gap-2">
                                                <Calendar className="h-4 w-4"/>
                                                Due Date
                                            </Label>
                                            <Input
                                                id="edit-due-date"
                                                type="date"
                                                value={editDueDate}
                                                onChange={(e) => setEditDueDate(e.target.value)}
                                                className="bg-input border-border text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-foreground font-medium flex items-center gap-2">
                                            <Hash className="h-4 w-4"/>
                                            Labels
                                        </Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {editLabels.map((label) => (
                                                <Badge key={label} variant="secondary"
                                                       className="bg-secondary/60 text-secondary-foreground">
                                                    {label}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditLabels(editLabels.filter(l => l !== label))}
                                                        className="ml-1 h-4 w-4 p-0 hover:bg-destructive/20"
                                                    >
                                                        <X className="h-3 w-3"/>
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add label..."
                                                value={newEditLabel}
                                                onChange={(e) => setNewEditLabel(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && newEditLabel.trim() && !editLabels.includes(newEditLabel.trim())) {
                                                        setEditLabels([...editLabels, newEditLabel.trim()]);
                                                        setNewEditLabel('');
                                                    }
                                                }}
                                                className="bg-input border-border text-foreground flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    if (newEditLabel.trim() && !editLabels.includes(newEditLabel.trim())) {
                                                        setEditLabels([...editLabels, newEditLabel.trim()]);
                                                        setNewEditLabel('');
                                                    }
                                                }}
                                                disabled={!newEditLabel.trim()}
                                                className="border-border text-foreground"
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <SheetFooter className="px-6 py-4 border-t border-border flex-shrink-0">
                        <Button variant="outline" onClick={() => setIsEditSheetOpen(false)} className="flex-1 h-11">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveIssue} className="bg-primary hover:bg-primary/90 flex-1 h-11 ml-3">
                            <Save className="h-4 w-4 mr-2"/>
                            Save Changes
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};
