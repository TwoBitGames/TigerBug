import {formatDistanceToNow} from 'date-fns';
import {MessageSquare, Edit2, Trash2, MoreVertical, Download} from 'lucide-react';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {Textarea} from '../ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {MarkdownRenderer} from '../MarkdownRenderer';
import type {Comment, Attachment, User as UserType} from '../../types';
import {getFileIcon, isImageFile} from './fileUtils';

interface CommentsListProps {
    comments: Comment[];
    editingComment: number | null;
    editCommentText: string;
    setEditingComment: (id: number | null) => void;
    setEditCommentText: (text: string) => void;
    onEditComment: (commentId: number, message: string) => void;
    onDeleteComment: (commentId: number) => void;
    onAttachmentClick: (attachment: Attachment) => void;
    onDownloadAttachment: (attachmentId: number) => void;
}

export const CommentsList = ({
                                 comments,
                                 editingComment,
                                 editCommentText,
                                 setEditingComment,
                                 setEditCommentText,
                                 onEditComment,
                                 onDeleteComment,
                                 onAttachmentClick,
                                 onDownloadAttachment
                             }: CommentsListProps) => {
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

    return (
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
                                                src={comment.author?.profile_picture || undefined}
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
                                                                    onClick={() => onDeleteComment(comment.id)}
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
                                                            onClick={() => onEditComment(comment.id, editCommentText)}
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
                                                    <MarkdownRenderer 
                                                        content={comment.message} 
                                                        className="text-sm"
                                                    />
                                                    {comment.attachments && comment.attachments.length > 0 && (
                                                        <div className="border-t border-border pt-3 mt-3">
                                                            <div className="space-y-2">
                                                                {comment.attachments.filter(att => isImageFile(att.original_filename)).length > 0 && (
                                                                    <div
                                                                        className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                        {comment.attachments
                                                                            .filter(att => isImageFile(att.original_filename))
                                                                            .map((attachment) => (
                                                                                <div
                                                                                    key={attachment.id}
                                                                                    className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border cursor-pointer group"
                                                                                    onClick={() => onAttachmentClick(attachment)}
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

                                                                {comment.attachments.filter(att => !isImageFile(att.original_filename)).length > 0 && (
                                                                    <div className="space-y-1">
                                                                        {comment.attachments
                                                                            .filter(att => !isImageFile(att.original_filename))
                                                                            .map((attachment) => (
                                                                                <div
                                                                                    key={attachment.id}
                                                                                    className="flex items-center space-x-2 p-2 bg-muted rounded-lg border border-border hover:border-accent transition-colors cursor-pointer"
                                                                                    onClick={() => onAttachmentClick(attachment)}
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
                                                                                            onDownloadAttachment(attachment.id);
                                                                                        }}
                                                                                        className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                                                                    >
                                                                                        <Download className="h-3 w-3"/>
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
    );
};
