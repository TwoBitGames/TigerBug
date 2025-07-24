import React from 'react';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {
    ChevronRight,
    Plus,
    Target,
    GitBranch,
    Circle,
    CheckCircle,
    Clock
} from 'lucide-react';
import {PriorityBadge} from '../ui/priority-badge';
import {IssueTypeBadge} from '../ui/issue-type-badge';
import type {Post} from '@/types';
import {formatDistanceToNow} from 'date-fns';

interface SubIssuesProps {
    issue: Post;
    onSubIssueClick: (subIssueId: number) => void;
    onCreateSubIssue: () => void;
}

export const SubIssues: React.FC<SubIssuesProps> = ({
                                                        issue,
                                                        onSubIssueClick,
                                                        onCreateSubIssue
                                                    }) => {
    const subIssues = issue.sub_issues || [];
    const canCreateSubIssue = issue.can_create_sub_issue;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Open':
                return <Circle className="h-3 w-3 text-blue-400"/>;
            case 'In Progress':
                return <Clock className="h-3 w-3 text-yellow-400"/>;
            case 'Closed':
                return <CheckCircle className="h-3 w-3 text-green-400"/>;
            default:
                return <Circle className="h-3 w-3 text-gray-400"/>;
        }
    };

    if (subIssues.length === 0 && !canCreateSubIssue) {
        return null;
    }

    const completionPercentage = subIssues.length > 0 ? ((issue.sub_issues_closed_count || 0) / subIssues.length) * 100 : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary"/>
                        Sub-Issues
                        {subIssues.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                                {issue.sub_issues_closed_count || 0} / {subIssues.length}
                            </Badge>
                        )}
                    </h3>
                    {subIssues.length > 0 && (
                        <div className="flex-1 max-w-32">
                            <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 ease-out"
                                    style={{width: `${completionPercentage}%`}}
                                />
                            </div>
                        </div>
                    )}
                </div>
                {canCreateSubIssue && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCreateSubIssue}
                        className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2"/>
                        Add Sub-Issue
                    </Button>
                )}
            </div>

            {subIssues.length > 0 && (
                <div className="relative">
                    <div
                        className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent"></div>

                    <div className="space-y-2">
                        {subIssues.map((subIssue) => (
                            <div key={subIssue.id} className="relative group">
                                <div
                                    className="absolute left-5 top-3 w-2.5 h-2.5 rounded-full bg-primary/80 border-2 border-background shadow-sm group-hover:bg-primary group-hover:scale-110 transition-all duration-200"></div>

                                <div
                                    className="absolute left-7 top-4 w-4 h-0.5 bg-gradient-to-r from-primary/60 to-primary/20"></div>

                                <div
                                    className="ml-12 p-3 rounded-lg border border-border/50 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:bg-gradient-to-r hover:from-card hover:to-card/80 group"
                                    onClick={() => onSubIssueClick(subIssue.id)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-2 mb-2">
                                                {getStatusIcon(subIssue.status)}
                                                <h4 className="font-medium text-sm text-foreground leading-tight flex-1 truncate group-hover:text-primary transition-colors">
                                                    {subIssue.title}
                                                </h4>
                                                <ChevronRight
                                                    className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all transform group-hover:translate-x-1"/>
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center space-x-2">
                                                    <PriorityBadge priority={subIssue.priority || 'Medium'} size="sm"/>
                                                    <IssueTypeBadge issueType={subIssue.issue_type || 'Bug'} size="sm"/>

                                                    {subIssue.assignee && (
                                                        <div
                                                            className="flex items-center space-x-1 text-muted-foreground">
                                                            <Avatar className="h-3 w-3">
                                                                <AvatarImage
                                                                    src={subIssue.assignee.profile_picture || undefined}
                                                                    alt={subIssue.assignee.username}
                                                                />
                                                                <AvatarFallback className="text-[8px] bg-secondary">
                                                                    {subIssue.assignee.username.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span
                                                                className="truncate max-w-20">{subIssue.assignee.username}</span>
                                                        </div>
                                                    )}

                                                    {subIssue.story_points && (
                                                        <div
                                                            className="flex items-center space-x-1 text-muted-foreground">
                                                            <Target className="h-3 w-3"/>
                                                            <span>{subIssue.story_points}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="text-muted-foreground">
                                                    {formatDistanceToNow(new Date(subIssue.created_at), {addSuffix: true})}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
