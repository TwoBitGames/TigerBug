import React, {useState, useEffect} from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Textarea} from '@/components/ui/textarea';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Bug, Info, AlertTriangle} from 'lucide-react';
import {useDialog} from '@/contexts/DialogContext';
import {projectsApi} from '@/services/api';
import type {Project} from '@/types';

interface CrashReportsConfig {
    crash_reports_enabled: boolean;
    crash_reports_template: string;
    crash_reports_min_version: string;
}

interface CrashReportsConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project | null;
    onConfigUpdate: (project: Project) => void;
}

export const CrashReportsConfigDialog: React.FC<CrashReportsConfigDialogProps> = ({
                                                                                      open,
                                                                                      onOpenChange,
                                                                                      project,
                                                                                      onConfigUpdate,
                                                                                  }) => {
    const {toast} = useDialog();
    const [config, setConfig] = useState<CrashReportsConfig>({
        crash_reports_enabled: true,
        crash_reports_template: '',
        crash_reports_min_version: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (project && open) {
            setConfig({
                crash_reports_enabled: (project as any).crash_reports_enabled ?? true,
                crash_reports_template: (project as any).crash_reports_template ?? '',
                crash_reports_min_version: (project as any).crash_reports_min_version ?? '',
            });
        }
    }, [project, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;

        if (config.crash_reports_min_version && !isValidSemver(config.crash_reports_min_version)) {
            toast('Please enter a valid semantic version (e.g., 1.0.0, 2.1.3)', {variant: 'destructive'});
            return;
        }

        setIsSubmitting(true);
        try {
            const updatedProject = await projectsApi.updateCrashReportsConfig(project.id, config);

            onConfigUpdate(updatedProject);
            onOpenChange(false);
            toast('Crash reports configuration updated successfully!');
        } catch (error) {
            console.error('Failed to update crash reports config:', error);
            toast('Failed to update crash reports configuration.', {variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValidSemver = (version: string): boolean => {
        const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*|[0-9a-zA-Z-]*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*|[0-9a-zA-Z-]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
        return semverRegex.test(version);
    };

    const templateVariables = [
        {name: '%error%', description: 'The main error message'},
        {name: '%stack_trace%', description: 'The stack trace information'},
        {name: '%script%', description: 'Script or file name where error occurred'},
        {name: '%line%', description: 'Line number where error occurred'},
        {name: '%any%', description: 'Matches any content (wildcard)'},
    ];

    const templateExample = `Error: %error%
Stack Trace:
%stack_trace%

Additional Info:
%any%`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Bug className="h-5 w-5 text-red-500"/>
                        </div>
                        <div>
                            <DialogTitle>Crash Reports Configuration</DialogTitle>
                            <DialogDescription>
                                Configure crash reporting settings for {project?.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="crash-reports-enabled" className="text-sm font-medium">
                                    Enable Crash Reports
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Allow this project to receive and process crash reports
                                </p>
                            </div>
                            <Switch
                                id="crash-reports-enabled"
                                checked={config.crash_reports_enabled}
                                onCheckedChange={(checked) =>
                                    setConfig({...config, crash_reports_enabled: checked})
                                }
                            />
                        </div>

                        {!config.crash_reports_enabled && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4"/>
                                <AlertDescription className="text-sm">
                                    When disabled, all crash reports sent to this project will be rejected,
                                    and the Crash Reports section will be hidden from the UI.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <Separator/>

                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="min-version" className="text-sm font-medium">
                                Minimum Required Version (Optional)
                            </Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Block crash reports from versions below this requirement. Use semantic versioning (e.g.,
                                1.2.3)
                            </p>
                            <Input
                                id="min-version"
                                value={config.crash_reports_min_version}
                                onChange={(e) =>
                                    setConfig({...config, crash_reports_min_version: e.target.value})
                                }
                                placeholder="1.0.0"
                                disabled={!config.crash_reports_enabled}
                            />
                        </div>

                        {config.crash_reports_min_version && !isValidSemver(config.crash_reports_min_version) && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4"/>
                                <AlertDescription className="text-sm">
                                    Please enter a valid semantic version (e.g., 1.0.0, 2.1.3)
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <Separator/>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="template" className="text-sm font-medium">
                                Custom Error Template (Optional)
                            </Label>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500"/>
                                <span className="text-sm font-medium">Available Variables</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {templateVariables.map((variable) => (
                                    <div key={variable.name} className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {variable.name}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {variable.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Textarea
                            id="template"
                            value={config.crash_reports_template}
                            onChange={(e) =>
                                setConfig({...config, crash_reports_template: e.target.value})
                            }
                            placeholder={templateExample}
                            rows={8}
                            disabled={!config.crash_reports_enabled}
                            className="font-mono text-sm"
                        />
                    </div>

                    <Separator/>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || (!!config.crash_reports_min_version && !isValidSemver(config.crash_reports_min_version))}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};