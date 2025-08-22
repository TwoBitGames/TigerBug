import {Paperclip, X} from 'lucide-react';
import {Button} from '../ui/button';
import {Label} from '../ui/label';
import {TextEditorWithPreview} from '../TextEditorWithPreview';
import {validateFiles, getFileIcon, formatFileSize} from './fileUtils';

interface CommentFormProps {
    newComment: string;
    setNewComment: (value: string) => void;
    commentAttachments: File[];
    setCommentAttachments: React.Dispatch<React.SetStateAction<File[]>>;
    onSubmit: () => void;
    isSubmitting: boolean;
    onAlert: (message: string) => Promise<void>;
}

export const CommentForm = ({
                                newComment,
                                setNewComment,
                                commentAttachments,
                                setCommentAttachments,
                                onSubmit,
                                isSubmitting,
                                onAlert
                            }: CommentFormProps) => {
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const {valid, invalid} = validateFiles(files);

        if (invalid.length > 0) {
            await onAlert(`Some files were not added:\n${invalid.map(f => `- ${f.name} (${f.size > 10 * 1024 * 1024 ? 'too large' : 'invalid type'})`).join('\n')}`);
        }

        setCommentAttachments(prev => [...prev, ...valid]);
        event.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setCommentAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 p-7 bg-muted/40 rounded-xl border border-border">
            <div className="space-y-3">
                <TextEditorWithPreview
                    value={newComment}
                    onChange={setNewComment}
                    placeholder="Write a comment..."
                    rows={3}
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
                                                onClick={() => removeAttachment(index)}
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
                                                onClick={() => removeAttachment(index)}
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
                        onChange={handleFileUpload}
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
                </div>
                <Button
                    onClick={onSubmit}
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                >
                    {isSubmitting ? 'Submitting...' : 'Add Comment'}
                </Button>
            </div>
        </div>
    );
};
