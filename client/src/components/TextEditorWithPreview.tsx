import {useState} from 'react';
import {Eye, Edit3} from 'lucide-react';
import {Button} from './ui/button';
import {Textarea} from './ui/textarea';
import {MarkdownRenderer} from './MarkdownRenderer';
import {cn} from '../lib/utils';

interface TextEditorWithPreviewProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    id?: string;
    disabled?: boolean;
}

export const TextEditorWithPreview = ({
                                          value,
                                          onChange,
                                          placeholder = 'Write your content...',
                                          rows = 6,
                                          className,
                                          id,
                                          disabled = false
                                      }: TextEditorWithPreviewProps) => {
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    return (
        <div className={cn(
            "relative border border-border rounded-lg overflow-hidden bg-background transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary",
            className
        )}>
            <div className="relative">
                {activeTab === 'edit' ? (
                    <Textarea
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={rows}
                        disabled={disabled}
                        className="border-0 resize-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none bg-transparent outline-none p-3 min-h-[140px]"
                    />
                ) : (
                    <div
                        className="p-3 min-h-[140px] bg-background rounded-t-lg"
                        style={{minHeight: `${rows * 1.5}em`}}
                    >
                        {value.trim() ? (
                            <MarkdownRenderer
                                content={value}
                                className="text-sm"
                            />
                        ) : (
                            <div className="text-muted-foreground text-sm italic">
                                Nothing to preview. Switch to edit mode to add content.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {(activeTab === 'edit' && value.length > 0) || activeTab === 'preview' ? (
                <div className="px-3 py-1.5 border-t border-border bg-muted/20 flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                        {activeTab === 'edit' && `${value.length} characters • Supports markdown formatting`}
                        {activeTab === 'preview' && 'Preview mode'}
                    </div>
                    <div
                        className="flex bg-background/90 backdrop-blur-sm rounded border border-border shadow-sm overflow-hidden">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('edit')}
                            className={cn(
                                "h-6 px-2 text-xs rounded-r-none border-r border-border transition-all",
                                activeTab === 'edit'
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                            disabled={disabled}
                        >
                            <Edit3 className="h-3 w-3 mr-1"/>
                            Edit
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('preview')}
                            className={cn(
                                "h-6 px-2 text-xs rounded-l-none transition-all",
                                activeTab === 'preview'
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                            disabled={disabled}
                        >
                            <Eye className="h-3 w-3 mr-1"/>
                            Preview
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};