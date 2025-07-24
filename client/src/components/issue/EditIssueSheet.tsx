import { Save, Edit2, Lock, Unlock, UserIcon, Target, Clock, Calendar, Hash, X, Bug, Lightbulb } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import type { User as UserType } from '../../types';

interface EditIssueSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;

    editTitle: string;
    setEditTitle: (value: string) => void;
    editDescription: string;
    setEditDescription: (value: string) => void;
    editStatus: 'Open' | 'In Progress' | 'Closed';
    setEditStatus: (value: 'Open' | 'In Progress' | 'Closed') => void;
    editIsPrivate: boolean;
    setEditIsPrivate: (value: boolean) => void;
    editPriority: 'Low' | 'Medium' | 'High' | 'Critical';
    setEditPriority: (value: 'Low' | 'Medium' | 'High' | 'Critical') => void;
    editIssueType: 'Bug' | 'Feature';
    setEditIssueType: (value: 'Bug' | 'Feature') => void;
    editAssigneeId: string;
    setEditAssigneeId: (value: string) => void;
    editStoryPoints: string;
    setEditStoryPoints: (value: string) => void;
    editTimeEstimate: string;
    setEditTimeEstimate: (value: string) => void;
    editDueDate: string;
    setEditDueDate: (value: string) => void;
    editLabels: string[];
    setEditLabels: (value: string[]) => void;
    newEditLabel: string;
    setNewEditLabel: (value: string) => void;

    canChangeStatus: boolean;
    canEditManagerFields: boolean;

    projectMembers: UserType[];
}

export const EditIssueSheet = ({
    isOpen,
    onClose,
    onSave,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editStatus,
    setEditStatus,
    editIsPrivate,
    setEditIsPrivate,
    editPriority,
    setEditPriority,
    editIssueType,
    setEditIssueType,
    editAssigneeId,
    setEditAssigneeId,
    editStoryPoints,
    setEditStoryPoints,
    editTimeEstimate,
    setEditTimeEstimate,
    editDueDate,
    setEditDueDate,
    editLabels,
    setEditLabels,
    newEditLabel,
    setNewEditLabel,
    canChangeStatus,
    canEditManagerFields,
    projectMembers
}: EditIssueSheetProps) => {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] px-0 flex flex-col">
                <SheetHeader className="px-6 pb-6 border-b border-border">
                    <SheetTitle className="flex items-center gap-2 text-lg">
                        <Edit2 className="h-5 w-5"/>
                        Edit Issue
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                        Make changes to your issue. Click save when you're done.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title" className="text-foreground font-medium">
                                Title
                            </Label>
                            <Input
                                id="edit-title"
                                placeholder="Brief description of the issue"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description" className="text-foreground font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="edit-description"
                                placeholder="Provide detailed information about the issue..."
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={6}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                            />
                        </div>

                        {canChangeStatus && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-status" className="text-foreground font-medium">
                                    Status
                                </Label>
                                <Select value={editStatus} onValueChange={(value: any) => setEditStatus(value)}>
                                    <SelectTrigger className="bg-input border-border text-foreground">
                                        <SelectValue placeholder="Select status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Open">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                Open
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="In Progress">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                In Progress
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Closed">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                Closed
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-priority" className="text-foreground font-medium">
                                    Priority
                                </Label>
                                <Select value={editPriority} onValueChange={(value: any) => setEditPriority(value)}>
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

                            <div className="space-y-2">
                                <Label htmlFor="edit-issue-type" className="text-foreground font-medium">
                                    Issue Type
                                </Label>
                                <Select value={editIssueType} onValueChange={(value: any) => setEditIssueType(value)}>
                                    <SelectTrigger className="bg-input border-border text-foreground">
                                        <SelectValue placeholder="Select type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Bug">
                                            <div className="flex items-center gap-2">
                                                <Bug className="h-4 w-4 text-red-400"/>
                                                Bug
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Feature">
                                            <div className="flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4 text-primary"/>
                                                Feature
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {canEditManagerFields && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-foreground font-medium">Privacy</Label>
                                    <div className="flex items-center space-x-3">
                                        <Button
                                            type="button"
                                            variant={!editIsPrivate ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setEditIsPrivate(false)}
                                            className="flex-1 h-10"
                                        >
                                            <Unlock className="h-4 w-4 mr-2"/>
                                            Public
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={editIsPrivate ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setEditIsPrivate(true)}
                                            className="flex-1 h-10"
                                        >
                                            <Lock className="h-4 w-4 mr-2"/>
                                            Private
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {editIsPrivate ? 'Only you can see this issue' : 'Everyone can see this issue'}
                                    </p>
                                </div>

                                {projectMembers.length > 0 && (
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-assignee" className="text-foreground font-medium flex items-center gap-2">
                                            <UserIcon className="h-4 w-4"/>
                                            Assignee
                                        </Label>
                                        <Select value={editAssigneeId} onValueChange={setEditAssigneeId}>
                                            <SelectTrigger className="bg-input border-border text-foreground">
                                                <SelectValue placeholder="Assign to..."/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {projectMembers.map((member) => (
                                                    <SelectItem key={member.id} value={member.id.toString()}>
                                                        <div className="flex items-center space-x-2">
                                                            <Avatar className="h-4 w-4">
                                                                <AvatarImage src={member.profile_picture || undefined} alt={member.username} />
                                                                <AvatarFallback className="text-xs">
                                                                    {member.username.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span>{member.username}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-story-points" className="text-foreground font-medium flex items-center gap-2">
                                            <Target className="h-4 w-4"/>
                                            Story Points
                                        </Label>
                                        <Input
                                            id="edit-story-points"
                                            type="number"
                                            min="1"
                                            max="100"
                                            placeholder="1-100"
                                            value={editStoryPoints}
                                            onChange={(e) => setEditStoryPoints(e.target.value)}
                                            className="bg-input border-border text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-time-estimate" className="text-foreground font-medium flex items-center gap-2">
                                            <Clock className="h-4 w-4"/>
                                            Time (hours)
                                        </Label>
                                        <Input
                                            id="edit-time-estimate"
                                            type="number"
                                            min="0"
                                            max="999"
                                            placeholder="0-999"
                                            value={editTimeEstimate}
                                            onChange={(e) => setEditTimeEstimate(e.target.value)}
                                            className="bg-input border-border text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-due-date" className="text-foreground font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4"/>
                                            Due Date
                                        </Label>
                                        <Input
                                            id="edit-due-date"
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                            className="bg-input border-border text-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-foreground font-medium flex items-center gap-2">
                                        <Hash className="h-4 w-4"/>
                                        Labels
                                    </Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {editLabels.map((label) => (
                                            <Badge key={label} variant="secondary" className="bg-secondary/60 text-secondary-foreground">
                                                {label}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditLabels(editLabels.filter(l => l !== label))}
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
                                            value={newEditLabel}
                                            onChange={(e) => setNewEditLabel(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && newEditLabel.trim() && !editLabels.includes(newEditLabel.trim())) {
                                                    setEditLabels([...editLabels, newEditLabel.trim()]);
                                                    setNewEditLabel('');
                                                }
                                            }}
                                            className="bg-input border-border text-foreground flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                if (newEditLabel.trim() && !editLabels.includes(newEditLabel.trim())) {
                                                    setEditLabels([...editLabels, newEditLabel.trim()]);
                                                    setNewEditLabel('');
                                                }
                                            }}
                                            disabled={!newEditLabel.trim()}
                                            className="border-border text-foreground"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t border-border flex-shrink-0">
                    <Button variant="outline" onClick={onClose} className="flex-1 h-11">
                        Cancel
                    </Button>
                    <Button onClick={onSave} className="bg-primary hover:bg-primary/90 flex-1 h-11 ml-3">
                        <Save className="h-4 w-4 mr-2"/>
                        Save Changes
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
