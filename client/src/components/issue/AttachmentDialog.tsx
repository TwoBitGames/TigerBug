import {Download, X, FileText} from 'lucide-react';
import {useState, useEffect} from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {Button} from '../ui/button';
import type {Attachment} from '@/types';
import {isImageFile, isTextFile} from './fileUtils';

interface AttachmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    attachment: Attachment | null;
    canEdit: boolean;
    onDownload: (attachmentId: number) => void;
    onDelete: (attachmentId: number) => void;
}

interface TextPreview {
    content: string;
    filename: string;
    size: number;
}

export const AttachmentDialog = ({
                                     isOpen,
                                     onClose,
                                     attachment,
                                     canEdit,
                                     onDownload,
                                     onDelete
                                 }: AttachmentDialogProps) => {
    const [textPreview, setTextPreview] = useState<TextPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    useEffect(() => {
        if (attachment && isTextFile(attachment.original_filename) && isOpen) {
            loadTextPreview(attachment.id);
        } else {
            setTextPreview(null);
            setPreviewError(null);
        }
    }, [attachment, isOpen]);

    const loadTextPreview = async (attachmentId: number) => {
        setIsLoadingPreview(true);
        setPreviewError(null);
        
        try {
            const response = await fetch(`/api/attachments/${attachmentId}/preview`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load preview');
            }
            
            const preview = await response.json();
            setTextPreview(preview);
        } catch (error) {
            console.error('Failed to load text preview:', error);
            setPreviewError(error instanceof Error ? error.message : 'Failed to load preview');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const renderContent = () => {
        if (!attachment) return null;

        if (isImageFile(attachment.original_filename)) {
            return (
                <div className="flex items-center justify-center p-4">
                    <img
                        src={`/api/attachments/${attachment.id}`}
                        alt={attachment.original_filename}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                </div>
            );
        }

        if (isTextFile(attachment.original_filename)) {
            if (isLoadingPreview) {
                return (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-muted-foreground">Loading preview...</div>
                    </div>
                );
            }

            if (previewError) {
                return (
                    <div className="p-4">
                        <div className="flex items-center justify-center p-8 border border-red-500/20 rounded-lg bg-red-500/10">
                            <div className="text-center">
                                <FileText className="h-12 w-12 text-red-400 mx-auto mb-2" />
                                <div className="text-red-400 font-medium">Preview not available</div>
                                <div className="text-red-300 text-sm mt-1">{previewError}</div>
                            </div>
                        </div>
                    </div>
                );
            }

            if (textPreview) {
                return (
                    <div className="p-4 w-full">
                        <div className="bg-muted/30 rounded-lg border border-border overflow-hidden w-full">
                            <div className="bg-muted/60 px-3 py-2 border-b border-border">
                                <div className="text-xs text-muted-foreground">
                                    {textPreview.size} bytes
                                </div>
                            </div>
                            <div className="max-h-[60vh] overflow-auto w-full">
                                <pre className="text-sm p-4 whitespace-pre-wrap font-mono leading-relaxed break-all overflow-x-auto w-full min-w-0">
                                    {textPreview.content}
                                </pre>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <div className="text-muted-foreground">Preview not available for this file type</div>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] bg-zinc-900/95 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">
                        {attachment?.original_filename}
                    </DialogTitle>
                </DialogHeader>
                
                {renderContent()}
                
                <div className="flex justify-center space-x-2 pb-4">
                    <Button
                        variant="outline"
                        onClick={() => attachment && onDownload(attachment.id)}
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                    >
                        <Download className="h-4 w-4 mr-2"/>
                        Download
                    </Button>
                    {canEdit && attachment && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                onDelete(attachment.id);
                                onClose();
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
    );
};
