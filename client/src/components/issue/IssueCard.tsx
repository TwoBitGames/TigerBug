import { formatDistanceToNow } from 'date-fns';
import { User, Calendar, Tag, Lock, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PriorityBadge } from '../ui/priority-badge';
import { IssueTypeBadge } from '../ui/issue-type-badge';
import type { Post } from '../../types';

interface IssueCardProps {
    issue: Post;
    isAuthenticated: boolean;
    isVoting?: boolean;
    onToggleVote: () => void;
}

export const IssueCard = ({ issue, isAuthenticated, isVoting = false, onToggleVote }: IssueCardProps) => {
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Open':
                return 'outline';
            case 'In Progress':
                return 'secondary';
            case 'Closed':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open':
                return 'text-green-400 border-green-400';
            case 'In Progress':
                return 'text-yellow-400 border-yellow-400';
            case 'Closed':
                return 'text-gray-400 border-gray-400';
            default:
                return 'text-gray-400 border-gray-400';
        }
    };

    return (
        <Card className="bg-card border-border backdrop-blur-xl">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                        <div className="space-y-3">
                            <CardTitle className="text-xl text-foreground">{issue.title}</CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4"/>
                                    <span>{issue.author?.username || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4"/>
                                    <span>{formatDistanceToNow(new Date(issue.created_at), {addSuffix: true})}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Badge variant={getStatusBadgeVariant(issue.status)}
                                       className={getStatusColor(issue.status)}>
                                    <Tag className="h-3 w-3 mr-1"/>
                                    {issue.status}
                                </Badge>
                                <PriorityBadge priority={issue.priority || 'Medium'} size="sm"/>
                                <IssueTypeBadge issueType={issue.issue_type || 'Bug'} size="sm"/>
                                {issue.is_private && (
                                    <Badge variant="outline" className="text-orange-400 border-orange-400">
                                        <Lock className="h-3 w-3 mr-1"/>
                                        Private
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                        {isAuthenticated && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onToggleVote}
                                disabled={isVoting}
                                className={`border-border flex items-center space-x-1 cursor-pointer ${
                                    issue.user_voted ? 'bg-primary/20 text-primary border-primary' : 'text-muted-foreground'
                                }`}
                            >
                                {isVoting ? (
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                ) : (
                                    <ArrowUpFromLine className="h-4 w-4"/>
                                )}
                                <span>{issue.vote_count || 0}</span>
                            </Button>
                        )}

                        {!isAuthenticated && (
                            <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                                <ArrowUpFromLine className="h-4 w-4"/>
                                <span>{issue.vote_count || 0} votes</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {issue.description}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
