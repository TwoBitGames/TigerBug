import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertTriangle, Eye, GitBranch } from 'lucide-react';
import type { CrashReport } from '@/types';

interface CrashReportsStatsProps {
  crashReports: CrashReport[];
  totalCount: number;
}

export const CrashReportsStats = ({ crashReports, totalCount }: CrashReportsStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="hover:shadow-md transition-shadow py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">New Reports</p>
              <p className="text-2xl font-bold text-blue-600">
                {crashReports.filter(r => r.status === 'New').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Under Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {crashReports.filter(r => r.status === 'Reviewing').length}
              </p>
            </div>
            <Eye className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Converted</p>
              <p className="text-2xl font-bold text-green-600">
                {crashReports.filter(r => r.status === 'Converted').length}
              </p>
            </div>
            <GitBranch className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
