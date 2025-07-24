import {Download, X} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {Button} from '../ui/button';
import type {Attachment} from '@/types';

interface AttachmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    attachment: Attachment | null;
    canEdit: boolean;
    onDownload: (attachmentId: number) => void;
    onDelete: (attachmentId: number) => void;
}

export const AttachmentDialog = ({
                                     isOpen,
                                     onClose,
                                     attachment,
                                     canEdit,
                                     onDownload,
                                     onDelete
                                 }: AttachmentDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] bg-zinc-900/95 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">
                        {attachment?.original_filename}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center p-4">
                    {attachment && (
                        <img
                            src={`/api/attachments/${attachment.id}`}
                            alt={attachment.original_filename}
                            className="max-w-full max-h-[70vh] object-contain rounded-lg"
                        />
                    )}
                </div>
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
