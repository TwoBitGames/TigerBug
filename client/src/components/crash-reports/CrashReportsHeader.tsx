import { Button } from '@/components/ui/button';
import { RefreshCw, Bug } from 'lucide-react';

interface CrashReportsHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export const CrashReportsHeader = ({ loading, onRefresh }: CrashReportsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bug className="h-8 w-8 text-destructive" />
          Crash Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage application crashes
        </p>
      </div>
      <Button 
        variant="outline" 
        onClick={onRefresh}
        disabled={loading}
        className="self-start sm:self-auto"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};
