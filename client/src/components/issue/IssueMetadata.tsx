import {UserIcon, Target, Clock, Calendar, Hash} from 'lucide-react';
import {Card, CardContent} from '../ui/card';
import {Badge} from '../ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {Separator} from '../ui/separator';
import type {Post} from '@/types';

interface IssueMetadataProps {
    issue: Post;
}

export const IssueMetadata = ({issue}: IssueMetadataProps) => {
    const metadataItems = [];

    if (issue.assignee) {
        metadataItems.push({
            type: 'assignee',
            icon: <UserIcon className="h-3 w-3 text-muted-foreground" />,
            label: 'Assignee',
            content: (
                <div className="flex items-center space-x-2">
                    <Avatar className="h-4 w-4">
                        <AvatarImage
                            src={issue.assignee.profile_picture || undefined}
                            alt={issue.assignee.username}
                        />
                        <AvatarFallback className="text-xs">
                            {issue.assignee.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">{issue.assignee.username}</span>
                </div>
            )
        });
    }

    if (issue.story_points) {
        metadataItems.push({
            type: 'story_points',
            icon: <Target className="h-3 w-3 text-muted-foreground" />,
            label: 'Story Points',
            content: (
                <Badge variant="secondary" className="text-xs h-5 px-2">
                    {issue.story_points}
                </Badge>
            )
        });
    }

    if (issue.time_estimate) {
        metadataItems.push({
            type: 'time_estimate',
            icon: <Clock className="h-3 w-3 text-muted-foreground" />,
            label: 'Estimate',
            content: <span className="text-sm text-foreground font-medium">{issue.time_estimate}h</span>
        });
    }

    if (issue.due_date) {
        metadataItems.push({
            type: 'due_date',
            icon: <Calendar className="h-3 w-3 text-muted-foreground" />,
            label: 'Due Date',
            content: (
                <span className="text-sm text-foreground font-medium">
                    {new Date(issue.due_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                    })}
                </span>
            )
        });
    }

    if (issue.labels && issue.labels.length > 0) {
        metadataItems.push({
            type: 'labels',
            icon: <Hash className="h-3 w-3 text-muted-foreground" />,
            label: 'Labels',
            content: (
                <div className="flex flex-wrap gap-1">
                    {issue.labels.map((label) => (
                        <Badge key={label} variant="outline" className="text-xs h-4 px-1.5">
                            {label}
                        </Badge>
                    ))}
                </div>
            )
        });
    }

    if (metadataItems.length === 0) {
        return null;
    }

    return (
        <Card className="bg-muted/30 border-border">
            <CardContent className="p-3">
                <div className="space-y-2">
                    {metadataItems.map((item, index) => (
                        <div key={item.type}>
                            <div className="flex items-center justify-between min-h-[24px]">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    {item.icon}
                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {item.label}
                                    </span>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                    {item.content}
                                </div>
                            </div>
                            {index < metadataItems.length - 1 && (
                                <Separator className="mt-2 bg-border/50" />
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
