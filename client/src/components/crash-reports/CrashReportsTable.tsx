import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {
    Activity,
    Bug,
    Eye,
    Monitor,
    Clock,
    Trash2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import type {CrashReport} from '@/types';

interface CrashReportsTableProps {
    crashReports: CrashReport[];
    loading: boolean;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    onViewDetails: (crash: CrashReport) => void;
    onDeleteCrashReport: (crashId: number, crashError?: string) => void;
    onPageChange: (newPage: number) => void;
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'New':
            return 'default';
        case 'Reviewing':
            return 'secondary';
        case 'Converted':
            return 'default';
        case 'Ignored':
            return 'outline';
        default:
            return 'outline';
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

const getStatusBadge = (status: string) => (
    <Badge variant={getStatusVariant(status) as any}>
        {status}
    </Badge>
);

export const CrashReportsTable = ({
                                      crashReports,
                                      loading,
                                      pagination,
                                      onViewDetails,
                                      onDeleteCrashReport,
                                      onPageChange
                                  }: CrashReportsTableProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5"/>
                    Crash Reports
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Error Message</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="w-[100px] text-center">Frequency</TableHead>
                                <TableHead className="w-[150px]">Version</TableHead>
                                <TableHead className="w-[120px]">OS</TableHead>
                                <TableHead className="w-[160px]">Date</TableHead>
                                <TableHead className="w-[140px] text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {crashReports.map((crash) => (
                                <TableRow key={crash.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-mono text-sm">
                                        #{crash.id}
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium truncate">
                                                {crash.error_message || 'Unknown Error'}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(crash.status)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center">
                                            <Badge variant="outline" className="font-mono">
                                                {crash.crash_frequency}x
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {crash.application_version || 'Unknown'}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <div className="flex items-center gap-1">
                                            <Monitor className="h-3 w-3 text-muted-foreground"/>
                                            {crash.operating_system || 'Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3"/>
                                            {formatDate(crash.created_at)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewDetails(crash)}
                                                className="h-8"
                                            >
                                                <Eye className="h-4 w-4 mr-1"/>
                                                View
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onDeleteCrashReport(crash.id, crash.error_message)}
                                                className="h-8 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1"/>
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-6 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} results
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                            >
                                <ChevronLeft className="h-4 w-4"/>
                                Previous
                            </Button>
                            <span className="text-sm font-medium px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                            >
                                Next
                                <ChevronRight className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                )}

                {crashReports.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Bug className="h-12 w-12 text-muted-foreground mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No Crash Reports</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            No crash reports found for this project. When crashes occur, they'll appear here for review
                            and management.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
