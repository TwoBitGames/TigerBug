import {useState, useEffect} from 'react';
import {Bug, Lightbulb, Upload, X, Calendar, Clock, Target, User as UserIcon, Hash, Lock, Unlock} from 'lucide-react';
import {Button} from './ui/button';
import {Card, CardContent} from './ui/card';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Textarea} from './ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from './ui/select';
import {Badge} from './ui/badge';
import {DatePicker} from './ui/date-picker';
import {useDialog} from '../contexts/DialogContext';
import {useAuth} from '../contexts/AuthContext';
import {projectsApi} from '../services/api';
import type {Project, CreatePostData, User as UserType, Post} from '../types';

interface CreateIssueProps {
    projects: Project[];
    selectedProject: number | null;
    parentIssue?: Post | null;
    onSubmit: (projectId: number, data: CreatePostData, files: File[]) => Promise<void>;
    onCancel: () => void;
}

export const CreateIssue = ({projects, selectedProject, parentIssue, onSubmit, onCancel}: CreateIssueProps) => {
    const {alert} = useDialog();
    const {user} = useAuth();
    const [projectId, setProjectId] = useState<string>(selectedProject?.toString() || '');
    const [issueType, setIssueType] = useState<'Bug' | 'Feature' | ''>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [isPrivate, setIsPrivate] = useState(false);
    const [assigneeId, setAssigneeId] = useState<string>('unassigned');
    const [storyPoints, setStoryPoints] = useState<string>('');
    const [timeEstimate, setTimeEstimate] = useState<string>('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [projectMembers, setProjectMembers] = useState<UserType[]>([]);

    const canEditManagerFields = user?.is_admin || false;

    useEffect(() => {
        if (parentIssue) {
            setProjectId(parentIssue.project_id.toString());
            setTitle(`[SUB] ${parentIssue.title} - `);
            setPriority(parentIssue.priority || 'Medium');
        }
    }, [parentIssue]);

    useEffect(() => {
        if (projectId) {
            loadProjectMembers();
        }
    }, [projectId]);

    const loadProjectMembers = async () => {
        try {
            const members = await projectsApi.getMembers(parseInt(projectId));
            setProjectMembers(members);
        } catch (error) {
            console.error('Failed to load project members:', error);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFiles = (files: File[]): { valid: File[], invalid: File[] } => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'text/plain', 'application/pdf', 'application/zip',
            'application/x-zip-compressed', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        const valid: File[] = [];
        const invalid: File[] = [];

        files.forEach(file => {
            if (file.size <= maxSize && allowedTypes.includes(file.type)) {
                valid.push(file);
            } else {
                invalid.push(file);
            }
        });

        return { valid, invalid };
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const { valid, invalid } = validateFiles(files);
        
        if (invalid.length > 0) {
            await alert(`Some files were not added:\n${invalid.map(f => `- ${f.name} (${f.size > 10*1024*1024 ? 'too large' : 'invalid type'})`).join('\n')}`);
        }
        
        setAttachments(prev => [...prev, ...valid]);

        event.target.value = '';
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
        
        const files = Array.from(event.dataTransfer.files);
        const { valid, invalid } = validateFiles(files);
        
        if (invalid.length > 0) {
            await alert(`Some files were not added:\n${invalid.map(f => `- ${f.name} (${f.size > 10*1024*1024 ? 'too large' : 'invalid type'})`).join('\n')}`);
        }
        
        setAttachments(prev => [...prev, ...valid]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const addLabel = () => {
        if (newLabel.trim() && !labels.includes(newLabel.trim())) {
            setLabels([...labels, newLabel.trim()]);
            setNewLabel('');
        }
    };

    const removeLabel = (labelToRemove: string) => {
        setLabels(labels.filter(label => label !== labelToRemove));
    };

    const handleSubmit = async () => {
        if (!projectId || !issueType || !title.trim() || !description.trim()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const postData: CreatePostData = {
                title,
                description,
                is_private: isPrivate,
                issue_type: issueType,
                priority,
            };

            if (parentIssue) {
                postData.parent_issue_id = parentIssue.id;
            }

            if (canEditManagerFields) {
                if (assigneeId && assigneeId !== "unassigned") postData.assignee_id = parseInt(assigneeId);
                if (storyPoints) postData.story_points = parseInt(storyPoints);
                if (timeEstimate) postData.time_estimate = parseInt(timeEstimate);
                if (dueDate) postData.due_date = dueDate.toISOString().split('T')[0];
                if (labels.length > 0) postData.labels = labels;
            }

            await onSubmit(parseInt(projectId), postData, attachments);

            setProjectId(selectedProject?.toString() || '');
            setIssueType('');
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setIsPrivate(false);
            setAssigneeId('unassigned');
            setStoryPoints('');
            setTimeEstimate('');
            setDueDate(undefined);
            setLabels([]);
            setAttachments([]);
        } catch (error) {
            console.error('Failed to create issue:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="container py-8 px-4 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
                    {parentIssue ? 'Create Sub-Issue' : 'Create New Issue'}
                </h1>
                <p className="text-muted-foreground">
                    {parentIssue 
                        ? `Create a sub-issue for: ${parentIssue.title}` 
                        : 'Report a bug or request a new feature'
                    }
                </p>                </div>

                {parentIssue && (
                    <div className="bg-accent/30 border border-accent/50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="text-sm text-muted-foreground">Parent Issue:</div>
                            <div className="flex-1">
                                <div className="font-medium text-sm text-foreground">{parentIssue.title}</div>
                                <div className="text-xs text-muted-foreground">#{parentIssue.id}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                <div className={`grid gap-6 ${canEditManagerFields ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                    <div className="space-y-2">
                        <Label htmlFor="project-select" className="text-foreground font-medium">
                            Select Project
                        </Label>
                        <Select value={projectId} onValueChange={setProjectId} disabled={!!parentIssue}>
                            <SelectTrigger className="bg-secondary border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                                <SelectValue placeholder="Choose a project"/>
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border backdrop-blur-xl">
                                {projects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={project.id.toString()}
                                        className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span>{project.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority" className="text-foreground font-medium">
                            Priority
                        </Label>
                        <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                            <SelectTrigger className="bg-input border-border text-foreground">
                                <SelectValue placeholder="Select priority"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Low
                                    </div>
                                </SelectItem>
                                <SelectItem value="Medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        Medium
                                    </div>
                                </SelectItem>
                                <SelectItem value="High">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        High
                                    </div>
                                </SelectItem>
                                <SelectItem value="Critical">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        Critical
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {canEditManagerFields && (
                        <div className="space-y-2">
                            <Label className="text-foreground font-medium">Privacy</Label>
                            <div className="flex items-center space-x-3">
                                <Button
                                    type="button"
                                    variant={!isPrivate ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsPrivate(false)}
                                    className="flex-1 h-10"
                                >
                                    <Unlock className="h-4 w-4 mr-2"/>
                                    Public
                                </Button>
                                <Button
                                    type="button"
                                    variant={isPrivate ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsPrivate(true)}
                                    className="flex-1 h-10"
                                >
                                    <Lock className="h-4 w-4 mr-2"/>
                                    Private
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isPrivate ? 'Only your team can see this issue' : 'Everyone can see this issue'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <Label className="text-foreground font-medium">Issue Type</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                        <Card
                            className={`cursor-pointer transition-all bg-card border-border backdrop-blur-sm ${
                                issueType === "Bug"
                                    ? "ring-2 ring-red-500/60 bg-red-950/30 border-red-500/40"
                                    : "hover:border-accent hover:bg-accent/50"
                            }`}
                            onClick={() => setIssueType("Bug")}>
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                                        <Bug className="h-5 w-5 text-red-400"/>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm mb-1 text-card-foreground">Bug</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Something isn't working as expected. Report crashes, errors, or unexpected behavior.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className={`cursor-pointer transition-all bg-card border-border backdrop-blur-sm ${
                                issueType === "Feature"
                                    ? "ring-2 ring-primary/60 bg-orange-950/30 border-primary/40"
                                    : "hover:border-accent hover:bg-accent/50"
                            }`}
                            onClick={() => setIssueType("Feature")}>
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                                        <Lightbulb className="h-5 w-5 text-primary"/>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm mb-1 text-card-foreground">Feature</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Suggest new functionality or improvements to enhance the user experience.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="issue-title" className="text-foreground font-medium">
                        Title
                    </Label>
                    <Input
                        id="issue-title"
                        placeholder="Brief description of the issue"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="issue-description" className="text-foreground font-medium">
                        Description
                    </Label>
                    <Textarea
                        id="issue-description"
                        placeholder="Provide detailed information about the issue. Include steps to reproduce for bugs or detailed requirements for features."
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        rows={6}
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                    />
                </div>

                {canEditManagerFields && projectMembers.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="assignee" className="text-foreground font-medium flex items-center gap-2">
                            <UserIcon className="h-4 w-4"/>
                            Assignee
                        </Label>
                        <Select value={assigneeId || "unassigned"} onValueChange={setAssigneeId}>
                            <SelectTrigger className="bg-input border-border text-foreground">
                                <SelectValue placeholder="Assign to..."/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {projectMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                        {member.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {canEditManagerFields && (
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="story-points" className="text-foreground font-medium flex items-center gap-2">
                                <Target className="h-4 w-4"/>
                                Story Points
                            </Label>
                            <Input
                                id="story-points"
                                type="number"
                                min="1"
                                max="100"
                                placeholder="1-100"
                                value={storyPoints}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoryPoints(e.target.value)}
                                className="bg-input border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time-estimate" className="text-foreground font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4"/>
                                Time (hours)
                            </Label>
                            <Input
                                id="time-estimate"
                                type="number"
                                min="0"
                                max="999"
                                placeholder="0-999"
                                value={timeEstimate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeEstimate(e.target.value)}
                                className="bg-input border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due-date" className="text-foreground font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4"/>
                                Due Date
                            </Label>
                            <DatePicker
                                id="due-date"
                                date={dueDate}
                                onDateChange={setDueDate}
                                placeholder="Select due date"
                                className="bg-input border-border text-foreground"
                            />
                        </div>
                    </div>
                )}

                {canEditManagerFields && (
                    <div className="space-y-3">
                        <Label className="text-foreground font-medium flex items-center gap-2">
                            <Hash className="h-4 w-4"/>
                            Labels
                        </Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {labels.map((label) => (
                                <Badge key={label} variant="secondary" className="bg-secondary/60 text-secondary-foreground">
                                    {label}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLabel(label)}
                                        className="ml-1 h-4 w-4 p-0 hover:bg-destructive/20"
                                    >
                                        <X className="h-3 w-3"/>
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add label..."
                                value={newLabel}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLabel(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addLabel()}
                                className="bg-input border-border text-foreground flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addLabel}
                                disabled={!newLabel.trim()}
                                className="border-border text-foreground"
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <Label className="text-foreground font-medium">Attachments</Label>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center bg-secondary/30 hover:border-accent transition-colors backdrop-blur-sm ${
                            isDragOver ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                    >
                        <Upload className="h-8 w-8 text-zinc-500 mx-auto mb-2"/>
                        <p className="text-sm text-zinc-400 mb-2">
                            {isDragOver ? 'Drop files here' : 'Drag and drop files here, or click to browse'}
                        </p>
                        <Input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload"/>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("file-upload")?.click()}
                            className="border-zinc-600/60 text-zinc-300 hover:bg-zinc-700/60 hover:border-zinc-500/60 bg-transparent"
                        >
                            Choose Files
                        </Button>
                    </div>

                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            {attachments.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-zinc-800/60 rounded border border-zinc-700/60 backdrop-blur-sm"
                                >
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm truncate text-zinc-200 block">{file.name}</span>
                                        <span className="text-xs text-zinc-400">{formatFileSize(file.size)}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeAttachment(index)}
                                        className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 ml-2"
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="border-zinc-600/60 text-zinc-300 hover:bg-zinc-700/60 bg-transparent hover:border-zinc-500/60">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!projectId || !issueType || !title.trim() || !description.trim() || isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Issue'}
                    </Button>
                </div>
            </div>
        </main>
    );
}
