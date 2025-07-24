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
    Download
} from 'lucide-react';
import {Button} from './ui/button';
import {Card, CardContent, CardHeader, CardTitle} from './ui/card';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Textarea} from './ui/textarea';
import {Badge} from './ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
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
import {useAuth} from '../contexts/AuthContext';
import {postsApi, commentsApi, attachmentsApi} from '../services/api';
import type {Post, Comment, UpdatePostData, CreateCommentData, Attachment} from '../types';

interface IssueDetailProps {
    issueId: number;
    projectId: number;
    onBack: () => void;
    userRole?: 'Reporter' | 'Manager' | 'Administrator' | null;
}

export const IssueDetail = ({issueId, projectId, onBack}: IssueDetailProps) => {
    const {user, isAuthenticated} = useAuth();
    const [issue, setIssue] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStatus, setEditStatus] = useState<'Offen' | 'In Arbeit' | 'Geschlossen'>('Offen');
    const [editIsPrivate, setEditIsPrivate] = useState(false);

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
    const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);

    const [commentAttachments, setCommentAttachments] = useState<File[]>([]);

    const canEdit = isAuthenticated && (
        user?.is_admin ||
        issue?.author_id === user?.id
    );

    const canDelete = isAuthenticated && (
        user?.is_admin ||
        issue?.author_id === user?.id
    );

    useEffect(() => {
        loadIssue();
        loadComments();
    }, [issueId, projectId]);

    const loadIssue = async () => {
        try {
            setIsLoading(true);
            const data = await postsApi.getById(projectId, issueId);
            setIssue(data);
            setEditTitle(data.title);
            setEditDescription(data.description);
            setEditStatus(data.status);
            setEditIsPrivate(data.is_private);

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
                status: editStatus,
                is_private: editIsPrivate,
            };

            const updatedIssue = await postsApi.update(projectId, issueId, updateData);
            setIssue(updatedIssue);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update issue:', error);
            setError('Failed to update issue');
        }
    };

    const handleDeleteIssue = async () => {
        if (!issue || !window.confirm('Are you sure you want to delete this issue?')) return;

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
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

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
        if (!window.confirm('Are you sure you want to delete this attachment?')) return;

        try {
            await attachmentsApi.delete(attachmentId);
            await loadIssue();
        } catch (error) {
            console.error('Failed to delete attachment:', error);
        }
    };

    const handleCommentFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const {valid, invalid} = validateFiles(files);

        if (invalid.length > 0) {
            alert(`Some files were not added:\n${invalid.map(f => `- ${f.name} (${f.size > 10 * 1024 * 1024 ? 'too large' : 'invalid type'})`).join('\n')}`);
        }

        setCommentAttachments(prev => [...prev, ...valid]);
        event.target.value = '';
    };

    const removeCommentAttachment = (index: number) => {
        setCommentAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Offen':
                return 'default';
            case 'In Arbeit':
                return 'secondary';
            case 'Geschlossen':
                return 'outline';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Offen':
                return 'text-green-400';
            case 'In Arbeit':
                return 'text-yellow-400';
            case 'Geschlossen':
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
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Back to Issues
                </Button>

                <div className="flex items-center space-x-2">
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            className="border-border text-muted-foreground hover:bg-accent"
                        >
                            {isEditing ? (
                                <>
                                    <X className="h-4 w-4 mr-2"/>
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Edit2 className="h-4 w-4 mr-2"/>
                                    Edit
                                </>
                            )}
                        </Button>
                    )}

                    {canDelete && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <MoreVertical className="h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                                <DropdownMenuItem
                                    onClick={handleDeleteIssue}
                                    className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
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
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="title" className="text-zinc-300">Title</Label>
                                        <Input
                                            id="title"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="bg-zinc-800/60 border-zinc-700 text-zinc-100"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="status" className="text-zinc-300">Status</Label>
                                            <Select value={editStatus}
                                                    onValueChange={(value: any) => setEditStatus(value)}>
                                                <SelectTrigger className="bg-zinc-800/60 border-zinc-700 text-zinc-100">
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                                    <SelectItem value="Offen">Offen</SelectItem>
                                                    <SelectItem value="In Arbeit">In Arbeit</SelectItem>
                                                    <SelectItem value="Geschlossen">Geschlossen</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-end">
                                            <Button
                                                variant="outline"
                                                onClick={() => setEditIsPrivate(!editIsPrivate)}
                                                className={`border-zinc-600 ${
                                                    editIsPrivate ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-300'
                                                }`}
                                            >
                                                {editIsPrivate ? (
                                                    <>
                                                        <Lock className="h-4 w-4 mr-2"/>
                                                        Private
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock className="h-4 w-4 mr-2"/>
                                                        Public
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <CardTitle className="text-xl text-zinc-100">{issue.title}</CardTitle>
                                    <div className="flex items-center space-x-4 text-sm text-zinc-400">
                                        <div className="flex items-center space-x-2">
                                            <User className="h-4 w-4"/>
                                            <span>{issue.author?.email || 'Unknown'}</span>
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
                                        {issue.is_private && (
                                            <Badge variant="outline" className="text-orange-400 border-orange-400">
                                                <Lock className="h-3 w-3 mr-1"/>
                                                Private
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                            {isAuthenticated && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleToggleVote}
                                    className={`border-zinc-600 flex items-center space-x-1 ${
                                        issue.user_voted ? 'bg-primary/20 text-primary border-primary' : 'text-zinc-300'
                                    }`}
                                >
                                    <ChevronUp className="h-4 w-4"/>
                                    <span>{issue.vote_count || 0}</span>
                                </Button>
                            )}

                            {!isAuthenticated && (
                                <div className="flex items-center space-x-1 text-zinc-400 text-sm">
                                    <ChevronUp className="h-4 w-4"/>
                                    <span>{issue.vote_count || 0} votes</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex items-center space-x-2 pt-4">
                            <Button onClick={handleSaveIssue} size="sm" className="bg-primary hover:bg-primary/90">
                                <Save className="h-4 w-4 mr-2"/>
                                Save Changes
                            </Button>
                        </div>
                    )}
                </CardHeader>

                <CardContent>
                    {isEditing ? (
                        <div>
                            <Label htmlFor="description" className="text-zinc-300">Description</Label>
                            <Textarea
                                id="description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={6}
                                className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-2"
                            />
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {issue.description}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {attachments.length > 0 && (
                <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-zinc-100">
                            <Paperclip className="h-5 w-5"/>
                            <span>Attachments ({attachments.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className={`group relative overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-800/40 transition-all hover:border-zinc-600 ${
                                    isImageFile(attachment.original_filename) ? 'cursor-pointer hover:scale-105' : ''
                                }`}
                                onClick={() => handleAttachmentClick(attachment)}
                            >
                                {isImageFile(attachment.original_filename) ? (
                                    <div
                                        className="aspect-video bg-zinc-800/60 flex items-center justify-center relative">
                                        <img
                                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/attachments/${attachment.id}`}
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
                                    <div className="aspect-video bg-zinc-800/60 flex items-center justify-center">
                                        <span className="text-4xl">{getFileIcon(attachment.original_filename)}</span>
                                    </div>
                                )}

                                <div className="p-3">
                                    <div className="text-sm text-zinc-200 truncate">{attachment.original_filename}</div>
                                    <div className="text-xs text-zinc-400 mt-1">
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
                                            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 h-7 px-2"
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
                                                className="text-red-400 hover:text-red-300 hover:bg-zinc-700/60 h-7 px-2"
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
                <div className="flex items-center space-x-2 text-zinc-100 mb-6">
                    <MessageSquare className="h-5 w-5"/>
                    <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
                </div>
                {isAuthenticated && (
                    <div className="space-y-4 p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                        <div className="space-y-3">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                rows={3}
                                className="bg-zinc-800/60 border-zinc-700 text-zinc-100 resize-none focus:border-primary/60 focus:ring-primary/20"
                            />

                            {commentAttachments.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm text-zinc-300">Attachments
                                            ({commentAttachments.length})</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCommentAttachments([])}
                                            className="text-zinc-400 hover:text-red-400 h-6 text-xs"
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

                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                            <p className="text-lg font-medium">No comments yet</p>
                            <p className="text-sm">Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment, index) => (
                                <div key={comment.id} className="group relative">
                                    {index < comments.length - 1 && (
                                        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-zinc-700/50"></div>
                                    )}

                                    <div className="flex space-x-4">
                                        <div className="flex-shrink-0">
                                            <Avatar className="h-10 w-10 ring-2 ring-zinc-700/50">
                                                <AvatarImage
                                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.author?.email || 'User'}`}
                                                    alt={comment.author?.email || 'User'}
                                                />
                                                <AvatarFallback
                                                    className="bg-gradient-to-br from-primary/20 to-orange-500/20 text-zinc-300 text-sm font-medium">
                                                    {comment.author?.email?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="bg-zinc-800/60 rounded-xl border border-zinc-700/50 p-4 group-hover:border-zinc-600/50 transition-colors">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-zinc-200 text-sm">
                                                                {comment.author?.email?.split('@')[0] || 'Unknown User'}
                                                            </span>
                                                        <span className="text-zinc-400 text-xs">•</span>
                                                        <span className="text-zinc-400 text-xs">
                                                                {formatDistanceToNow(new Date(comment.created_at), {addSuffix: true})}
                                                            </span>
                                                    </div>

                                                    {isAuthenticated && (user?.id === comment.author_id || user?.is_admin) && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-100 h-7 w-7 p-0 transition-opacity"
                                                                >
                                                                    <MoreVertical className="h-3 w-3"/>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end"
                                                                                 className="bg-zinc-800 border-zinc-700">
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setEditingComment(comment.id);
                                                                        setEditCommentText(comment.message);
                                                                    }}
                                                                    className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700"
                                                                >
                                                                    <Edit2 className="h-3 w-3 mr-2"/>
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-zinc-700"/>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
                                                                >
                                                                    <Trash2 className="h-3 w-3 mr-2"/>
                                                                    Delete
                                                                </DropdownMenuItem>
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
                                                            className="bg-zinc-700/60 border-zinc-600 text-zinc-100 resize-none focus:border-primary/60"
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
                                                                className="border-zinc-600 text-zinc-300 h-7"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
                                                            {comment.message}
                                                        </p>
                                                        {comment.attachments && comment.attachments.length > 0 && (
                                                            <div className="border-t border-zinc-700/50 pt-3 mt-3">
                                                                <div className="space-y-2">
                                                                    {comment.attachments.filter(att => att.original_filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)).length > 0 && (
                                                                        <div
                                                                            className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                            {comment.attachments
                                                                                .filter(att => att.original_filename.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                                                                                .map((attachment) => (
                                                                                    <div
                                                                                        key={attachment.id}
                                                                                        className="relative aspect-square rounded-lg overflow-hidden bg-zinc-700/40 border border-zinc-600/30 cursor-pointer group"
                                                                                        onClick={() => handleAttachmentClick(attachment)}
                                                                                    >
                                                                                        <img
                                                                                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/attachments/${attachment.id}`}
                                                                                            alt={attachment.original_filename}
                                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                                            loading="lazy"
                                                                                            onError={(e) => {
                                                                                                const target = e.target as HTMLImageElement;
                                                                                                target.style.display = 'none';
                                                                                                const parent = target.parentElement;
                                                                                                if (parent) {
                                                                                                    parent.innerHTML = `
                                                                                        <div class="w-full h-full flex items-center justify-center bg-zinc-700/60">
                                                                                            <div class="text-zinc-400 text-center">
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
                                                                                        className="flex items-center space-x-2 p-2 bg-zinc-700/30 rounded-lg border border-zinc-600/30 hover:border-zinc-500/50 transition-colors cursor-pointer"
                                                                                        onClick={() => handleAttachmentClick(attachment)}
                                                                                    >
                                                                                        <div
                                                                                            className="text-lg">{getFileIcon(attachment.original_filename)}</div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-xs text-zinc-300 truncate">{attachment.original_filename}</p>
                                                                                            <p className="text-xs text-zinc-500">
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
                                                                                            className="text-zinc-400 hover:text-zinc-200 h-6 w-6 p-0"
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
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/attachments/${selectedAttachment.id}`}
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
        </div>
    );
};
