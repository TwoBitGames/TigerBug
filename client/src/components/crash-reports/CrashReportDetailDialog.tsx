import {useState, useEffect} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
    Bug,
    Eye,
    Code,
    Monitor,
    Activity,
    AlertTriangle,
    FileText,
    Settings,
    Package,
    Clock,
    Globe,
    GitBranch
} from 'lucide-react';
import type {CrashReport} from '@/types';

interface CrashReportDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    crashReport: CrashReport | null;
    loading: boolean;
    onNotesChange: (notes: string) => void;
    onStatusUpdate: (status: string) => void;
    onConvertToIssue: () => void;
    updatingStatus: boolean;
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'New':
            return 'default';
        case 'Reviewing':
            return 'secondary';
        case 'Converted':
            return 'default';
        case 'Ignored':
            return 'outline';
        default:
            return 'outline';
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

export const CrashReportDetailDialog = ({
                                            open,
                                            onOpenChange,
                                            crashReport,
                                            loading,
                                            onNotesChange,
                                            onStatusUpdate,
                                            onConvertToIssue,
                                            updatingStatus
                                        }: CrashReportDetailDialogProps) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [localNotes, setLocalNotes] = useState('');
    const [lastSavedNotes, setLastSavedNotes] = useState('');

    useEffect(() => {
        if (open && crashReport) {
            const notesToLoad = crashReport.notes || '';
            setLocalNotes(notesToLoad);
            setLastSavedNotes(notesToLoad);
        }
    }, [open, crashReport]);

    useEffect(() => {
        if (!open) {
            setLocalNotes('');
            setLastSavedNotes('');
        }
    }, [open]);

    const handleNotesChange = (value: string) => {
        setLocalNotes(value);
    };

    const handleNotesBlur = () => {
        if (localNotes !== lastSavedNotes) {
            onNotesChange(localNotes);
            setLastSavedNotes(localNotes);
        }
    };

    if (!crashReport && !loading) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!w-[85vw] !max-w-[1200px] max-h-[90vh] overflow-hidden p-0 flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-background shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-muted rounded-xl border">
                                <Bug className="h-6 w-6 text-foreground"/>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                  <span className="text-foreground font-semibold text-xl">
                    {loading ? 'Loading...' : `Crash Report #${crashReport?.id || ''}`}
                  </span>
                                    {crashReport && !loading && (
                                        <Badge variant={getStatusVariant(crashReport.status) as any}
                                               className="text-xs">
                                            {crashReport.status}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm font-normal text-muted-foreground max-w-3xl">
                                    {loading ? (
                                        'Loading crash report details...'
                                    ) : (
                                        crashReport?.error_message && crashReport.error_message.length > 120
                                            ? `${crashReport.error_message.substring(0, 120)}...`
                                            : crashReport?.error_message || 'Application crashed unexpectedly'
                                    )}
                                </p>
                            </div>
                        </div>
                        {crashReport && !loading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4"/>
                                {formatDate(crashReport.created_at)}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="text-center">
                            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground"/>
                            <p className="text-muted-foreground">Loading crash details...</p>
                        </div>
                    </div>
                ) : crashReport ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 py-3 border-b bg-muted/30 shrink-0">
                            <TabsList className="h-10 grid w-full grid-cols-3">
                                <TabsTrigger value="overview"
                                             className="flex items-center gap-2 px-3 text-sm cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Eye className="h-4 w-4"/>
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="stacktrace"
                                             className="flex items-center gap-2 px-3 text-sm cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Code className="h-4 w-4"/>
                                    Stack Trace
                                </TabsTrigger>
                                <TabsTrigger value="environment"
                                             className="flex items-center gap-2 px-3 text-sm cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Monitor className="h-4 w-4"/>
                                    Environment
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0">
                            <TabsContent value="overview" className="p-6 space-y-6 m-0">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card
                                        className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20 py-0">
                                        <CardContent className="p-4 py-0">
                                            <div className="flex items-center gap-3 py-4">
                                                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                                    <Activity className="h-5 w-5 text-primary"/>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-primary/80 mb-1">Frequency</p>
                                                    <p className="text-2xl font-bold text-primary">
                                                        {crashReport.crash_frequency}x
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 border-emerald-200 dark:border-emerald-800 py-0">
                                        <CardContent className="p-4 py-0">
                                            <div className="flex items-center gap-3 py-4">
                                                <div
                                                    className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                    <Package
                                                        className="h-5 w-5 text-emerald-600 dark:text-emerald-400"/>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">Application
                                                        Version</p>
                                                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                                                        {crashReport.application_version || 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/50 border-violet-200 dark:border-violet-800 py-0">
                                        <CardContent className="p-4 py-0">
                                            <div className="flex items-center gap-3 py-4">
                                                <div
                                                    className="p-2 bg-violet-100 dark:bg-violet-900 rounded-lg border border-violet-200 dark:border-violet-800">
                                                    <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400"/>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">Source Location</p>
                                                    <p className="text-lg font-bold text-violet-900 dark:text-violet-200 font-mono">
                                                        {crashReport.script_line || 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1 space-y-6">
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Settings className="h-4 w-4"/>
                                                    Status & Investigation
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-medium">Status</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            {
                                                                value: 'New',
                                                                color: 'bg-blue-500',
                                                                icon: '🆕',
                                                                label: 'New'
                                                            },
                                                            {
                                                                value: 'Reviewing',
                                                                color: 'bg-yellow-500',
                                                                icon: '👁️',
                                                                label: 'Reviewing'
                                                            }
                                                        ].map((status) => (
                                                            <button
                                                                key={status.value}
                                                                onClick={() => onStatusUpdate(status.value)}
                                                                disabled={updatingStatus || crashReport.status === 'Converted'}
                                                                className={`
                                                                    relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                                                                    ${crashReport.status === status.value
                                                                    ? 'border-primary bg-primary/10 shadow-sm'
                                                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                                                }
                                                                    ${updatingStatus || crashReport.status === 'Converted'
                                                                    ? 'opacity-50 cursor-not-allowed'
                                                                    : 'cursor-pointer'
                                                                }
                                                                `}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={`w-2 h-2 ${status.color} rounded-full flex-shrink-0`}></div>
                                                                    <span
                                                                        className="text-sm font-medium">{status.label}</span>
                                                                </div>
                                                                {crashReport.status === status.value && (
                                                                    <div className="absolute top-1 right-1">
                                                                        <div
                                                                            className="w-2 h-2 bg-primary rounded-full"></div>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {crashReport.status === 'Converted' && (
                                                        <div
                                                            className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                                            <div
                                                                className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                                                <div
                                                                    className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                <span
                                                                    className="text-sm font-medium">Converted to Issue</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <Label htmlFor="notes" className="text-sm font-medium">Investigation
                                                        Notes</Label>
                                                    <Textarea
                                                        id="notes"
                                                        value={localNotes}
                                                        onChange={(e) => handleNotesChange(e.target.value)}
                                                        onBlur={handleNotesBlur}
                                                        placeholder="Add notes about this crash investigation..."
                                                        className="min-h-[120px] resize-none"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Document your investigation findings, reproduction steps, or any
                                                        relevant observations.
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="lg:col-span-2 space-y-6">
                                        {crashReport.error_message && (
                                            <Card className="border-destructive/20">
                                                <CardHeader className="pb-3">
                                                    <CardTitle
                                                        className="text-base flex items-center gap-2 text-destructive">
                                                        <AlertTriangle className="h-4 w-4"/>
                                                        Error Message
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div
                                                        className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                                                        <code
                                                            className="text-destructive/90 font-mono text-sm whitespace-pre-wrap leading-relaxed block">
                                                            {crashReport.error_message}
                                                        </code>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {crashReport.user_story && (
                                            <Card className="border-blue-200 dark:border-blue-800">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                                        <FileText className="h-4 w-4"/>
                                                        User Story
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                        <p className="text-blue-800 dark:text-blue-200 text-sm whitespace-pre-wrap leading-relaxed">
                                                            {crashReport.user_story}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <FileText className="h-4 w-4"/>
                                                    Crash Data Preview
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="bg-muted border rounded-lg max-h-64 overflow-auto">
                          <pre className="text-xs p-4 font-mono whitespace-pre-wrap text-foreground">
                            {crashReport.crash_data?.substring(0, 800)}
                              {crashReport.crash_data && crashReport.crash_data.length > 800 && '...'}
                          </pre>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Full crash data available in the Stack Trace tab
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="stacktrace" className="p-6 space-y-6 m-0">
                                <div className="space-y-6">
                                    {crashReport.stack_trace && (
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Code className="h-4 w-4"/>
                                                    Stack Trace
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div
                                                    className="bg-muted border rounded-lg max-h-[400px] overflow-auto w-full">
                          <pre className="text-xs p-4 font-mono whitespace-pre-wrap text-foreground w-full">
                            {crashReport.stack_trace}
                          </pre>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <FileText className="h-4 w-4"/>
                                                Complete Crash Data
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div
                                                className="bg-muted border rounded-lg max-h-[400px] overflow-auto w-full">
                        <pre className="text-xs p-4 font-mono whitespace-pre-wrap text-foreground w-full">
                          {crashReport.crash_data}
                        </pre>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="environment" className="p-6 space-y-6 m-0">
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Monitor className="h-4 w-4"/>
                                                System Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm font-medium text-muted-foreground">Operating System</span>
                                                    <span
                                                        className="text-sm font-semibold text-foreground">{crashReport.operating_system || 'Unknown'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm font-medium text-muted-foreground">Application Version</span>
                                                    <span
                                                        className="text-sm font-semibold text-foreground">{crashReport.application_version || 'Unknown'}</span>
                                                </div>
                                                {crashReport.script_line && (
                                                    <div className="flex justify-between items-center py-2 border-b">
                                                        <span className="text-sm font-medium text-muted-foreground">Source Location</span>
                                                        <span className="text-sm font-semibold text-foreground font-mono">
                                                            {crashReport.script_line}
                                                        </span>
                                                    </div>
                                                )}
                                                {crashReport.user_story && (
                                                    <div className="flex flex-col py-2 border-b">
                                                        <span className="text-sm font-medium text-muted-foreground mb-2">User Story</span>
                                                        <div className="bg-muted p-3 rounded border">
                                                            <p className="text-xs text-foreground whitespace-pre-wrap">
                                                                {crashReport.user_story}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm font-medium text-muted-foreground">Crash Frequency</span>
                                                    <Badge variant="outline" className="font-mono">
                                                        {crashReport.crash_frequency}x
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-sm font-medium text-muted-foreground">First Occurrence</span>
                                                    <span
                                                        className="text-sm font-semibold text-foreground">{formatDate(crashReport.created_at)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {(crashReport.ip_address || crashReport.user_agent) && (
                                        <Card className="lg:col-span-1">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Globe className="h-4 w-4"/>
                                                    Network Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-3">
                                                    {crashReport.ip_address && (
                                                        <div
                                                            className="flex justify-between items-center py-2 border-b">
                                                            <span className="text-sm font-medium text-muted-foreground">IP Address</span>
                                                            <span
                                                                className="text-sm font-mono text-foreground">{crashReport.ip_address}</span>
                                                        </div>
                                                    )}
                                                    {crashReport.user_agent && (
                                                        <div className="py-2">
                                                            <span
                                                                className="text-sm font-medium text-muted-foreground block mb-2">User Agent</span>
                                                            <p className="text-xs font-mono bg-muted p-3 rounded border text-foreground break-all">
                                                                {crashReport.user_agent}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card className="lg:col-span-1">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <GitBranch className="h-4 w-4"/>
                                                Additional Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm font-medium text-muted-foreground">Report ID</span>
                                                    <span
                                                        className="text-sm font-mono text-foreground">#{crashReport.id}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span
                                                        className="text-sm font-medium text-muted-foreground">Status</span>
                                                    <Badge variant={getStatusVariant(crashReport.status) as any}
                                                           className="text-xs">
                                                        {crashReport.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                                                    <span
                                                        className="text-sm text-foreground">{formatDate(crashReport.created_at)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                ) : null}

                <DialogFooter className="px-6 py-4 border-t bg-background flex justify-end items-center shrink-0">
                    <div className="flex gap-3">
                        {crashReport && crashReport.status !== 'Converted' && (
                            <Button
                                onClick={onConvertToIssue}
                                className="bg-primary hover:bg-primary/90"
                                size="default"
                            >
                                <GitBranch className="h-4 w-4 mr-2"/>
                                Convert to Issue
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => onOpenChange(false)} size="default"
                                className="min-w-20">
                            Close
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
