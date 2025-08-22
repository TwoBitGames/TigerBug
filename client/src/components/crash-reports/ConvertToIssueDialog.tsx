import {useState, useEffect} from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {TextEditorWithPreview} from '@/components/TextEditorWithPreview';
import {GitBranch, Bug, Package, Lock, Unlock} from 'lucide-react';
import type {ConvertToIssueData, CrashReport} from '@/types';

interface ConvertToIssueDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    crashReport?: CrashReport | null;
    onConvert: (data: ConvertToIssueData) => void;
}

const priorityOptions = [
    {value: 'Low', label: 'Low'},
    {value: 'Medium', label: 'Medium'},
    {value: 'High', label: 'High'},
    {value: 'Critical', label: 'Critical'}
];

export const ConvertToIssueDialog = ({
                                         open,
                                         onOpenChange,
                                         crashReport,
                                         onConvert
                                     }: ConvertToIssueDialogProps) => {
    const [convertData, setConvertData] = useState<ConvertToIssueData>({
        priority: 'High',
        issue_type: 'Bug',
        is_private: false
    });

    useEffect(() => {
        if (crashReport && open) {
            const defaultTitle = `Crash Report #${crashReport.id}: ${crashReport.error_message || 'Application Crash'}`;
            const defaultDescription = generateDefaultDescription(crashReport);

            setConvertData({
                title: defaultTitle,
                description: defaultDescription,
                priority: 'High',
                issue_type: 'Bug',
                is_private: false
            });
        }
    }, [crashReport, open]);

    const generateDefaultDescription = (crash: CrashReport): string => {
        let description = `# Crash Report Analysis\n\n`;
        description += `**Crash Report ID:** ${crash.id}\n`;
        description += `**Frequency:** ${crash.crash_frequency} occurrence(s)\n`;
        description += `**First Reported:** ${new Date(crash.created_at).toLocaleDateString()}\n\n`;

        if (crash.error_message) {
            description += `## Error Message\n\`\`\`\n${crash.error_message}\n\`\`\`\n\n`;
        }

        if (crash.script_line) {
            description += `**Script:Line:** ${crash.script_line}\n\n`;
        }

        if (crash.stack_trace) {
            description += `\n## Stack Trace\n\`\`\`\n${crash.stack_trace}\n\`\`\`\n\n`;
        }

        description += `\n## Additional Information\n`;
        description += `The complete crash data has been attached to this issue for detailed analysis.\n`;
        description += `\n*Please add any additional context, steps to reproduce, or notes about this crash below.*`;

        return description;
    };

    const handleConvert = () => {
        onConvert(convertData);
        setConvertData({
            priority: 'High',
            issue_type: 'Bug',
            is_private: false
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="pb-6 border-b flex-shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <GitBranch className="h-5 w-5 text-primary"/>
                        </div>
                        <span className="text-foreground font-semibold">Convert to Issue</span>
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground mt-3">
                        Create a new issue from crash report #{crashReport?.id}. The crash data and stack trace will be
                        automatically attached to help with debugging.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6 overflow-y-auto flex-1 min-h-0">
                    <div className="space-y-3">
                        <Label htmlFor="title" className="text-sm font-medium">Issue Title</Label>
                        <Input
                            id="title"
                            value={convertData.title || ''}
                            onChange={(e) => setConvertData(prev => ({...prev, title: e.target.value}))}
                            placeholder={`Crash Report #${crashReport?.id}: ${crashReport?.error_message || 'Application Crash'}`}
                            className="text-base h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                            Title has been pre-filled based on the crash error message
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <TextEditorWithPreview
                            id="description"
                            value={convertData.description || ''}
                            onChange={(value) => setConvertData(prev => ({...prev, description: value}))}
                            placeholder="Description has been pre-filled with crash report details..."
                            rows={5}
                        />
                        <p className="text-xs text-muted-foreground">
                            Description has been pre-filled with crash report analysis and details
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Privacy</Label>
                        <div className="flex items-center space-x-3">
                            <Button
                                type="button"
                                variant={!convertData.is_private ? "default" : "outline"}
                                size="sm"
                                onClick={() => setConvertData(prev => ({...prev, is_private: false}))}
                                className="flex-1 h-10"
                            >
                                <Unlock className="h-4 w-4 mr-2"/>
                                Public
                            </Button>
                            <Button
                                type="button"
                                variant={convertData.is_private ? "default" : "outline"}
                                size="sm"
                                onClick={() => setConvertData(prev => ({...prev, is_private: true}))}
                                className="flex-1 h-10"
                            >
                                <Lock className="h-4 w-4 mr-2"/>
                                Private
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {convertData.is_private ? 'Only your team can see this issue' : 'Everyone can see this issue'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                            <Select value={convertData.priority} onValueChange={(value) => setConvertData(prev => ({
                                ...prev,
                                priority: value as any
                            }))}>
                                <SelectTrigger className="h-11">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {priorityOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    option.value === 'Critical' ? 'bg-destructive' :
                                                        option.value === 'High' ? 'bg-orange-500' :
                                                            option.value === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}></div>
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="issue_type" className="text-sm font-medium">Type</Label>
                            <Select value={convertData.issue_type} onValueChange={(value) => setConvertData(prev => ({
                                ...prev,
                                issue_type: value as any
                            }))}>
                                <SelectTrigger className="h-11">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bug">
                                        <div className="flex items-center gap-2">
                                            <Bug className="h-3 w-3 text-destructive/70"/>
                                            Bug
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="Feature">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-3 w-3 text-primary/70"/>
                                            Feature
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter className="pt-6 border-t gap-3 flex-shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} size="lg" className="min-w-24">
                        Cancel
                    </Button>
                    <Button onClick={handleConvert} className="bg-primary hover:bg-primary/90" size="lg">
                        <GitBranch className="h-4 w-4 mr-2"/>
                        Convert to Issue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
