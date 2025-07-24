import {UserIcon, Target, Clock, Calendar, Hash} from 'lucide-react';
import {Card, CardContent} from '../ui/card';
import {Badge} from '../ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import type {Post} from '@/types';

interface IssueMetadataProps {
    issue: Post;
}

export const IssueMetadata = ({issue}: IssueMetadataProps) => {
    const hasMetadata = issue.assignee || issue.story_points || issue.time_estimate || issue.due_date || (issue.labels && issue.labels.length > 0);

    if (!hasMetadata) {
        return null;
    }

    return (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {issue.assignee && (
                <Card className="bg-muted/30 border-border">
                    <CardContent className="p-3">
                        <div className="flex items-center space-x-2 mb-2">
                            <UserIcon className="h-3 w-3 text-muted-foreground"/>
                            <span className="text-xs font-medium text-muted-foreground">Assignee</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${issue.assignee.username}`}
                                    alt={issue.assignee.username}
                                />
                                <AvatarFallback className="text-xs">
                                    {issue.assignee.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground truncate">{issue.assignee.username}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {issue.story_points && (
                <Card className="bg-muted/30 border-border">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Target className="h-3 w-3 text-muted-foreground"/>
                                <span className="text-xs font-medium text-muted-foreground">Story Points</span>
                            </div>
                            <Badge variant="secondary" className="text-xs h-5 px-2">
                                {issue.story_points}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {issue.time_estimate && (
                <Card className="bg-muted/30 border-border">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-3 w-3 text-muted-foreground"/>
                                <span className="text-xs font-medium text-muted-foreground">Estimate</span>
                            </div>
                            <span className="text-sm text-foreground font-medium">{issue.time_estimate}h</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {issue.due_date && (
                <Card className="bg-muted/30 border-border">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-3 w-3 text-muted-foreground"/>
                                <span className="text-xs font-medium text-muted-foreground">Due Date</span>
                            </div>
                            <span className="text-sm text-foreground font-medium">
                                {new Date(issue.due_date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {issue.labels && issue.labels.length > 0 && (
                <Card className="bg-muted/30 border-border md:col-span-2 lg:col-span-3 xl:col-span-4">
                    <CardContent className="p-3">
                        <div className="flex items-center space-x-2 mb-2">
                            <Hash className="h-3 w-3 text-muted-foreground"/>
                            <span className="text-xs font-medium text-muted-foreground">Labels</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {issue.labels.map((label) => (
                                <Badge key={label} variant="outline" className="text-xs h-5 px-2">
                                    {label}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
