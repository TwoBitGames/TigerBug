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
    MoreVertical
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
import {useAuth} from '../contexts/AuthContext';
import {postsApi, commentsApi} from '../services/api';
import type {Post, Comment, UpdatePostData, CreateCommentData} from '../types';

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

            await commentsApi.create(projectId, issueId, commentData);
            setNewComment('');
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-zinc-400">Loading issue details...</div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-zinc-400">Issue not found</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
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
                            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
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
                                    className="text-zinc-400 hover:text-zinc-100"
                                >
                                    <MoreVertical className="h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
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
                </div>
            )}

            <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-xl">
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
                                        issue.user_voted ? 'bg-purple-600/20 text-purple-400 border-purple-600' : 'text-zinc-300'
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
                            <Button onClick={handleSaveIssue} size="sm" className="bg-purple-600 hover:bg-purple-700">
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

            <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-zinc-100">
                        <MessageSquare className="h-5 w-5"/>
                        <span>Comments ({comments.length})</span>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {isAuthenticated && (
                        <div className="space-y-3 p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/50">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                rows={3}
                                className="bg-zinc-800/60 border-zinc-700 text-zinc-100 resize-none"
                            />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSubmitComment}
                                    disabled={!newComment.trim() || isSubmittingComment}
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {isSubmittingComment ? 'Submitting...' : 'Add Comment'}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-zinc-400">
                                No comments yet. Be the first to comment!
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/50"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="/placeholder.svg"
                                                             alt={comment.author?.email || 'User'}/>
                                                <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                                                    {comment.author?.email?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="text-sm font-medium text-zinc-200">
                                                    {comment.author?.email || 'Unknown User'}
                                                </div>
                                                <div className="text-xs text-zinc-400">
                                                    {formatDistanceToNow(new Date(comment.created_at), {addSuffix: true})}
                                                </div>
                                            </div>
                                        </div>

                                        {isAuthenticated && (user?.id === comment.author_id || user?.is_admin) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-zinc-400 hover:text-zinc-100 h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4"/>
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
                                                        <Edit2 className="h-4 w-4 mr-2"/>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-zinc-700"/>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2"/>
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
                                                className="bg-zinc-800/60 border-zinc-700 text-zinc-100 resize-none"
                                            />
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    onClick={() => handleEditComment(comment.id, editCommentText)}
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700"
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
                                                    className="border-zinc-600 text-zinc-300"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                            {comment.message}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
