import {formatDistanceToNow} from 'date-fns';
import {Paperclip, Download, X} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import type {Attachment} from '@/types';
import {isImageFile, isTextFile, getFileIcon} from './fileUtils';

interface AttachmentsListProps {
    attachments: Attachment[];
    canEdit: boolean;
    onAttachmentClick: (attachment: Attachment) => void;
    onDownload: (attachmentId: number) => void;
    onDelete: (attachmentId: number) => void;
}

export const AttachmentsList = ({
                                    attachments,
                                    canEdit,
                                    onAttachmentClick,
                                    onDownload,
                                    onDelete
                                }: AttachmentsListProps) => {
    if (attachments.length === 0) {
        return null;
    }

    return (
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
                            isImageFile(attachment.original_filename) || isTextFile(attachment.original_filename) ? 'cursor-pointer hover:bg-muted/60' : ''
                        }`}
                        onClick={() => onAttachmentClick(attachment)}
                    >
                        {isImageFile(attachment.original_filename) ? (
                            <div className="aspect-video bg-muted flex items-center justify-center relative">
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
                                    <span className="text-4xl">{getFileIcon(attachment.original_filename)}</span>
                                </div>
                                <div
                                    className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-white text-sm font-medium">Click to view</div>
                                </div>
                            </div>
                        ) : isTextFile(attachment.original_filename) ? (
                            <div className="aspect-video bg-muted flex items-center justify-center relative">
                                <span className="text-4xl">{getFileIcon(attachment.original_filename)}</span>
                                <div
                                    className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-white text-sm font-medium">Click to preview</div>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video bg-muted flex items-center justify-center">
                                <span className="text-4xl">{getFileIcon(attachment.original_filename)}</span>
                            </div>
                        )}

                        <div className="p-3">
                            <div className="text-sm text-foreground truncate">{attachment.original_filename}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(attachment.uploaded_at), {addSuffix: true})}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDownload(attachment.id);
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
                                            onDelete(attachment.id);
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
    );
};
