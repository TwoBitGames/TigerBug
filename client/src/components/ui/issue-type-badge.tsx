import React from 'react';
import { Badge } from './badge';
import { Bug, Lightbulb } from 'lucide-react';

interface IssueTypeBadgeProps {
  issueType: 'Bug' | 'Feature';
  size?: 'sm' | 'default';
}

export const IssueTypeBadge: React.FC<IssueTypeBadgeProps> = ({ issueType, size = 'default' }) => {
  const getIssueTypeConfig = (type: string) => {
    switch (type) {
      case 'Bug':
        return {
          variant: 'destructive' as const,
          icon: Bug,
          className: 'bg-red-500/10 text-red-400 border-red-500/30',
        };
      case 'Feature':
        return {
          variant: 'default' as const,
          icon: Lightbulb,
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
      default:
        return {
          variant: 'outline' as const,
          icon: Bug,
          className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        };
    }
  };

  const config = getIssueTypeConfig(issueType);
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <Badge variant={config.variant} className={`${config.className} ${size === 'sm' ? 'text-xs' : ''}`}>
      <Icon className={`${iconSize} mr-1`} />
      {issueType}
    </Badge>
  );
};
