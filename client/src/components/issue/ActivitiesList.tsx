import {useState, useEffect} from 'react';
import {Badge} from '../ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {Activity as ActivityIcon} from 'lucide-react';
import {activitiesApi} from '../../services/api';
import type {Activity} from '@/types';

interface ActivitiesListProps {
    projectId: number;
    postId: number;
}

interface ActivityDisplayProps {
    activity: Activity;
}

const ActivityDisplay = ({activity}: ActivityDisplayProps) => {
    const parseValue = (value: string | null) => {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    };

    const oldValue = parseValue(activity.old_value);
    const newValue = parseValue(activity.new_value);

    const renderValue = (value: any, type: string) => {
        if (value === null || value === undefined) {
            return <span className="text-muted-foreground">none</span>;
        }

        switch (type) {
            case 'status_changed':
                const statusColors = {
                    'Open': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                    'In Progress': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
                    'Closed': 'bg-green-500/10 text-green-600 border-green-500/20'
                };
                return (
                    <Badge variant="outline" className={statusColors[value as keyof typeof statusColors] || ''}>
                        {value}
                    </Badge>
                );

            case 'priority_changed':
                const priorityColors = {
                    'Low': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
                    'Medium': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                    'High': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
                    'Critical': 'bg-red-500/10 text-red-600 border-red-500/20'
                };
                return (
                    <Badge variant="outline" className={priorityColors[value as keyof typeof priorityColors] || ''}>
                        {value}
                    </Badge>
                );

            case 'issue_type_changed':
                const typeColors = {
                    'Bug': 'bg-red-500/10 text-red-600 border-red-500/20',
                    'Feature': 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                };
                return (
                    <Badge variant="outline" className={typeColors[value as keyof typeof typeColors] || ''}>
                        {value}
                    </Badge>
                );

            case 'assignee_changed':
                if (typeof value === 'object' && value?.username) {
                    return <span className="font-medium">{value.username}</span>;
                }
                return <span className="font-medium">{value}</span>;

            case 'labels_added':
            case 'labels_removed':
                if (Array.isArray(value)) {
                    return (
                        <div className="flex flex-wrap gap-1">
                            {value.map((label) => (
                                <Badge key={label} variant="outline" className="text-xs">
                                    {label}
                                </Badge>
                            ))}
                        </div>
                    );
                }
                return <span>{value}</span>;

            case 'story_points_changed':
                return (
                    <Badge variant="secondary" className="text-xs">
                        {value}
                    </Badge>
                );

            default:
                return <span className="font-medium">{value}</span>;
        }
    };

    const getActivityMessage = () => {
        const username = activity.user?.username || 'Unknown';

        switch (activity.activity_type) {
            case 'status_changed':
                return (
                    <span>
                        <span
                            className="font-medium">{username}</span> changed status from {renderValue(oldValue, activity.activity_type)} to {renderValue(newValue, activity.activity_type)}
                    </span>
                );

            case 'priority_changed':
                return (
                    <span>
                        <span
                            className="font-medium">{username}</span> changed priority from {renderValue(oldValue, activity.activity_type)} to {renderValue(newValue, activity.activity_type)}
                    </span>
                );

            case 'assignee_changed':
                if (!newValue || (typeof newValue === 'object' && !newValue.id)) {
                    return (
                        <span>
                            <span
                                className="font-medium">{username}</span> unassigned {renderValue(oldValue, activity.activity_type)}
                        </span>
                    );
                }
                return (
                    <span>
                        <span
                            className="font-medium">{username}</span> assigned {renderValue(newValue, activity.activity_type)}
                    </span>
                );

            case 'issue_type_changed':
                return (
                    <span>
                        <span
                            className="font-medium">{username}</span> changed type from {renderValue(oldValue, activity.activity_type)} to {renderValue(newValue, activity.activity_type)}
                    </span>
                );

            case 'labels_added':
                return (
                    <span>
                        <span
                            className="font-medium">{username}</span> added label {renderValue(newValue, activity.activity_type)}
                    </span>
                );

            case 'labels_removed':
                return (
                    <span>
                        <span
                            className="font-medium">{username}</span> removed label {renderValue(oldValue, activity.activity_type)}
                    </span>
                );

            case 'due_date_changed':
                if (!newValue) {
                    return (
                        <span>
                            <span className="font-medium">{username}</span> removed due date
                        </span>
                    );
                }
                return (
                    <span>
                        <span className="font-medium">{username}</span> set due date to <span
                        className="font-medium">{new Date(newValue).toLocaleDateString()}</span>
                    </span>
                );

            case 'story_points_changed':
                if (!newValue) {
                    return (
                        <span>
                            <span className="font-medium">{username}</span> removed story points
                        </span>
                    );
                }
                return (
                    <span>
                        <span
                            className="font-medium">{username}</span> set story points to {renderValue(newValue, activity.activity_type)}
                    </span>
                );

            case 'time_estimate_changed':
                if (!newValue) {
                    return (
                        <span>
                            <span className="font-medium">{username}</span> removed time estimate
                        </span>
                    );
                }
                return (
                    <span>
                        <span className="font-medium">{username}</span> set time estimate to <span
                        className="font-medium">{newValue}h</span>
                    </span>
                );

            default:
                return (
                    <span>
                        <span className="font-medium">{username}</span> made changes
                    </span>
                );
        }
    };

    const getActivityTypeIcon = () => {
        switch (activity.activity_type) {
            case 'status_changed':
                return 'bg-blue-500';
            case 'priority_changed':
                return 'bg-orange-500';
            case 'assignee_changed':
                return 'bg-purple-500';
            case 'labels_added':
            case 'labels_removed':
                return 'bg-green-500';
            case 'due_date_changed':
                return 'bg-yellow-500';
            case 'story_points_changed':
            case 'time_estimate_changed':
                return 'bg-cyan-500';
            case 'issue_type_changed':
                return 'bg-red-500';
            default:
                return 'bg-primary';
        }
    };

    return (
        <div className="relative flex items-start space-x-4 pb-6 last:pb-0">
            <div className="absolute left-4 top-8 bottom-0 w-px bg-border last:hidden"></div>

            <div className="relative flex-shrink-0">
                <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                    <AvatarImage
                        src={activity.user?.profile_picture || undefined}
                        alt={activity.user?.username}
                    />
                    <AvatarFallback className="text-xs font-medium">
                        {activity.user?.username?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>
                <div
                    className={`absolute -right-1 -bottom-1 h-3 w-3 ${getActivityTypeIcon()} border-2 border-background rounded-full`}></div>
            </div>

            <div className="flex-1 min-w-0 bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-foreground leading-relaxed">
                    {getActivityMessage()}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground font-medium">
                        {new Date(activity.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                        {activity.activity_type.replace('_', ' ')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ActivitiesList = ({projectId, postId}: ActivitiesListProps) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadActivities();
    }, [projectId, postId]);

    const loadActivities = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await activitiesApi.getAll(projectId, postId);
            setActivities(data);
        } catch (error) {
            console.error('Failed to load activities:', error);
            setError('Failed to load activities');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                    <div
                        className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading activity timeline...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="text-destructive text-sm font-medium">{error}</div>
                    <button
                        onClick={loadActivities}
                        className="text-xs text-muted-foreground hover:text-foreground mt-1 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <ActivityIcon className="h-6 w-6 text-muted-foreground"/>
                </div>
                <div className="text-muted-foreground text-sm">No activities yet</div>
                <div className="text-xs text-muted-foreground mt-1">
                    Changes to this issue will appear here
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {activities.map((activity, index) => (
                <div key={activity.id} className="relative">
                    <ActivityDisplay activity={activity}/>
                    {index < activities.length - 1 && (
                        <div className="absolute left-4 top-16 w-px h-6 bg-border"></div>
                    )}
                </div>
            ))}
        </div>
    );
};