import {useState, useEffect} from 'react';
import {Button} from './ui/button';
import {Label} from './ui/label';
import {Switch} from './ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card';
import {Separator} from './ui/separator';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from './ui/select';
import {useDialog} from '../contexts/DialogContext';
import {notificationApi} from '../services/api';
import type {NotificationPreferences, UpdateNotificationPreferencesData} from '../types';
import {
    Bell,
    MessageSquare,
    FileText,
    Users,
    Volume,
    VolumeX,
    Volume1
} from 'lucide-react';

interface NotificationSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationSettingsDialog({isOpen, onClose}: NotificationSettingsDialogProps) {
    const {toast} = useDialog();
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPreferences();
        }
    }, [isOpen]);

    const loadPreferences = async () => {
        setIsLoading(true);
        try {
            const prefs = await notificationApi.getPreferences();
            setPreferences(prefs);
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
            toast('Failed to load notification preferences', {variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreferenceChange = (key: keyof UpdateNotificationPreferencesData, value: boolean | string) => {
        if (!preferences) return;

        setPreferences({...preferences, [key]: value});
    };

    const handleSave = async () => {
        if (!preferences) return;

        setIsSaving(true);
        try {
            const updateData: UpdateNotificationPreferencesData = {
                notification_level: preferences.notification_level,
                post_created: preferences.post_created,
                post_assigned: preferences.post_assigned,
                post_status_changed: preferences.post_status_changed,
                comment_on_my_post: preferences.comment_on_my_post,
                admin_comment: preferences.admin_comment,
                added_to_project: preferences.added_to_project,
                removed_from_project: preferences.removed_from_project,
            };

            await notificationApi.updatePreferences(updateData);
            toast('Notification preferences updated successfully!', {variant: 'success'});
            onClose();
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
            toast('Failed to update notification preferences', {variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div
                                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
                            <p className="text-muted-foreground">Loading notification settings...</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!preferences) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <div className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">Failed to load notification preferences</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5"/>
                        Email Notification Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure which email notifications you want to receive. You can customize your
                        notification preferences to stay informed about the activities that matter most to you.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="notification_level"
                                       className="flex items-center gap-2 text-base font-medium">
                                    <VolumeX className="h-4 w-4"/>
                                    Notification Level
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Choose your overall email notification preference
                                </p>
                            </div>
                            <Select
                                value={preferences.notification_level}
                                onValueChange={(value: 'off' | 'important_only' | 'all') =>
                                    handlePreferenceChange('notification_level', value)
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select level"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="off">
                                        <div className="flex items-center gap-2">
                                            <VolumeX className="h-4 w-4"/>
                                            <span>Off</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="important_only">
                                        <div className="flex items-center gap-2">
                                            <Volume1 className="h-4 w-4"/>
                                            <span>Important Only</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <Volume className="h-4 w-4"/>
                                            <span>All</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator/>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-4 w-4"/>
                                Post Notifications
                            </CardTitle>
                            <CardDescription>
                                Receive emails about posts in projects you're a member of
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="post_created">New posts created</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when new posts are created in your projects
                                    </p>
                                </div>
                                <Switch
                                    id="post_created"
                                    checked={preferences.post_created}
                                    onCheckedChange={(checked: boolean) => handlePreferenceChange('post_created', checked)}
                                    disabled={preferences.notification_level === 'off'}
                                />
                            </div>


                            <Separator/>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="post_assigned">Posts assigned to me</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when you are assigned to a post (Important)
                                    </p>
                                </div>
                                <Switch
                                    id="post_assigned"
                                    checked={preferences.post_assigned}
                                    onCheckedChange={(checked: boolean) => handlePreferenceChange('post_assigned', checked)}
                                    disabled={preferences.notification_level === 'off'}
                                />
                            </div>

                            <Separator/>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="post_status_changed">Post status changes</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when posts are closed, fixed, or status changes (Important)
                                    </p>
                                </div>
                                <Switch
                                    id="post_status_changed"
                                    checked={preferences.post_status_changed}
                                    onCheckedChange={(checked: boolean) => handlePreferenceChange('post_status_changed', checked)}
                                    disabled={preferences.notification_level === 'off'}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="h-4 w-4"/>
                                Comment Notifications
                            </CardTitle>
                            <CardDescription>
                                Receive emails about comments on posts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="comment_on_my_post">Comments on my posts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when someone comments on posts you created
                                    </p>
                                </div>
                                <Switch
                                    id="comment_on_my_post"
                                    checked={preferences.comment_on_my_post}
                                    onCheckedChange={(checked: boolean) => handlePreferenceChange('comment_on_my_post', checked)}
                                    disabled={preferences.notification_level === 'off'}
                                />
                            </div>


                            <Separator/>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="admin_comment">Admin comments</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when administrators comment on posts (Important)
                                    </p>
                                </div>
                                <Switch
                                    id="admin_comment"
                                    checked={preferences.admin_comment}
                                    onCheckedChange={(checked: boolean) => handlePreferenceChange('admin_comment', checked)}
                                    disabled={preferences.notification_level === 'off'}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-4 w-4"/>
                                Project Notifications
                            </CardTitle>
                            <CardDescription>
                                Receive emails about project membership changes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="added_to_project">Added to project</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when you are added to a project (Important)
                                    </p>
                                </div>
                                <Switch
                                    id="added_to_project"
                                    checked={preferences.added_to_project}
                                    onCheckedChange={(checked: boolean) => handlePreferenceChange('added_to_project', checked)}
                                    disabled={preferences.notification_level === 'off'}
                                />
                            </div>

                            <Separator/>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="removed_from_project">Removed from project</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when you are removed from a project (Important)
                                    </p>
                                </div>
                                <Switch
                                    id="removed_from_project"
                                    checked={preferences.removed_from_project}
                                    onCheckedChange={(checked: boolean) => handlePreferenceChange('removed_from_project', checked)}
                                    disabled={preferences.notification_level === 'off'}
                                />
                            </div>
                        </CardContent>
                    </Card>


                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <div
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>
                                Saving...
                            </>
                        ) : (
                            'Save Preferences'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
