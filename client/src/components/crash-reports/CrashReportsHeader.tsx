import { Button } from '@/components/ui/button';
import { RefreshCw, Bug, Trash2 } from 'lucide-react';
import type { Project } from '@/types';

interface CrashReportsHeaderProps {
  onRefresh: () => void;
  onClearAll: () => void;
  crashReportsCount: number;
  project?: Project | null;
}

export const CrashReportsHeader = ({ onRefresh, onClearAll, crashReportsCount, project }: CrashReportsHeaderProps) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Bug className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crash Reports</h1>
            <p className="text-muted-foreground text-lg">
              Monitor and manage application crashes across your projects.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button 
            variant="outline" 
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {crashReportsCount > 0 && project?.crash_reports_enabled && (
            <Button 
              variant="destructive" 
              onClick={onClearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All ({crashReportsCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
