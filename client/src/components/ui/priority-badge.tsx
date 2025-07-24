import React from 'react';
import { Badge } from './badge';
import { AlertTriangle, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface PriorityBadgeProps {
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  size?: 'sm' | 'default';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'default' }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return {
          variant: 'destructive' as const,
          icon: Zap,
          className: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20',
        };
      case 'High':
        return {
          variant: 'secondary' as const,
          icon: ArrowUp,
          className: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20',
        };
      case 'Medium':
        return {
          variant: 'outline' as const,
          icon: AlertTriangle,
          className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20',
        };
      case 'Low':
        return {
          variant: 'outline' as const,
          icon: ArrowDown,
          className: 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20',
        };
      default:
        return {
          variant: 'outline' as const,
          icon: AlertTriangle,
          className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <Badge variant={config.variant} className={`${config.className} ${size === 'sm' ? 'text-xs' : ''}`}>
      <Icon className={`${iconSize} mr-1`} />
      {priority}
    </Badge>
  );
};
