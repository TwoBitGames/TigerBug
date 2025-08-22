import {useState, useEffect, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Activity} from 'lucide-react';
import {crashReportsApi, projectsApi} from '@/services/api';
import {useDialog} from '@/contexts/DialogContext';
import type {CrashReport, CrashReportFilters, ConvertToIssueData, Project} from '@/types';
import {
    CrashReportsHeader,
    CrashReportsStats,
    CrashReportsFilters,
    CrashReportsTable,
    CrashReportDetailDialog,
    ConvertToIssueDialog
} from '@/components/crash-reports';

export const CrashReportsPage = () => {
    const {projectId} = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const {toast, confirm} = useDialog();

    const [project, setProject] = useState<Project | null>(null);
    const [crashReports, setCrashReports] = useState<CrashReport[]>([]);
    const [selectedCrash, setSelectedCrash] = useState<CrashReport | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showConvertDialog, setShowConvertDialog] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [filters, setFilters] = useState<CrashReportFilters>({
        status: 'all',
        sort: 'created_at',
        order: 'DESC',
        page: 1,
        limit: 25
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    });

    const loadProject = useCallback(async () => {
        if (!projectId) return;

        try {
            const projectData = await projectsApi.getById(parseInt(projectId));
            setProject(projectData);
        } catch (error) {
            console.error('Failed to load project:', error);
            toast('Failed to load project information', {variant: 'destructive'});
        }
    }, [projectId, toast]);

    const loadCrashReports = useCallback(async () => {
        if (!projectId) return;

        try {
            const response = await crashReportsApi.getAll(parseInt(projectId), {
                ...filters,
                search: searchTerm
            });
            setCrashReports(response.crash_reports);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Failed to load crash reports:', error);
            toast('Failed to load crash reports', {variant: 'destructive'});
        } finally {
            if (initialLoading) {
                setInitialLoading(false);
            }
        }
    }, [projectId, filters, searchTerm, toast, initialLoading]);

    useEffect(() => {
        loadProject();
        loadCrashReports();
    }, [loadProject, loadCrashReports]);

    useEffect(() => {
        if (project && project.crash_reports_enabled === false) {
            navigate(`/projects/${projectId}`);
            toast('Crash reports are disabled for this project', { variant: 'destructive' });
        }
    }, [project, projectId, navigate, toast]);

    const handleViewDetails = async (crash: CrashReport) => {
        if (!projectId) return;

        try {
            setLoadingDetails(true);
            const details = await crashReportsApi.getById(parseInt(projectId), crash.id);
            setSelectedCrash(details);
            setShowDetailDialog(true);
        } catch (error) {
            console.error('Failed to load crash details:', error);
            toast('Failed to load crash details', {variant: 'destructive'});
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedCrash || !projectId) return;

        try {
            setUpdatingStatus(true);
            const updatedCrash = await crashReportsApi.updateStatus(
                parseInt(projectId),
                selectedCrash.id,
                { status }
            );
            setSelectedCrash(updatedCrash);
            await loadCrashReports();
            toast('Status updated successfully');
        } catch (error) {
            console.error('Failed to update status:', error);
            toast('Failed to update status', {variant: 'destructive'});
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleConvertToIssue = async (convertData: ConvertToIssueData) => {
        if (!selectedCrash || !projectId) return;

        try {
            const response = await crashReportsApi.convertToIssue(
                parseInt(projectId),
                selectedCrash.id,
                convertData
            );

            setShowConvertDialog(false);
            setShowDetailDialog(false);

            await loadCrashReports();
            toast('Crash report converted to issue successfully');
            navigate(`/projects/${projectId}/issues/${response.issue.id}`);
        } catch (error) {
            console.error('Failed to convert crash report:', error);
            toast('Failed to convert crash report', {variant: 'destructive'});
        }
    };

    const handleDeleteCrashReport = async (crashId: number, crashError?: string) => {
        if (!projectId) return;

        const errorMessage = crashError ? ` (${crashError.substring(0, 50)}${crashError.length > 50 ? '...' : ''})` : '';
        const confirmed = await confirm(
            `Are you sure you want to delete crash report #${crashId}${errorMessage}? This action cannot be undone and all associated data will be permanently removed.`,
            'Delete Crash Report'
        );

        if (!confirmed) return;

        try {
            await crashReportsApi.delete(parseInt(projectId), crashId);
            setCrashReports(reports => reports.filter(r => r.id !== crashId));

            if (selectedCrash?.id === crashId) {
                setShowDetailDialog(false);
                setSelectedCrash(null);
            }

            toast('Crash report deleted successfully');
            await loadCrashReports();
        } catch (error) {
            console.error('Failed to delete crash report:', error);
            toast('Failed to delete crash report', {variant: 'destructive'});
        }
    };

    const handleClearAllCrashReports = async () => {
        if (!projectId) return;

        const confirmed = await confirm(
            `Are you sure you want to delete ALL ${pagination.total} crash reports for this project? This action cannot be undone and all crash report data will be permanently removed.`,
            'Clear All Crash Reports'
        );

        if (!confirmed) return;

        try {
            const response = await crashReportsApi.clearAll(parseInt(projectId));
            setCrashReports([]);
            setShowDetailDialog(false);
            setSelectedCrash(null);
            
            toast(response.message);
            await loadCrashReports();
        } catch (error) {
            console.error('Failed to clear all crash reports:', error);
            toast('Failed to clear all crash reports', {variant: 'destructive'});
        }
    };

    const handleFilterChange = (key: keyof CrashReportFilters, value: any) => {
        setFilters(prev => ({...prev, [key]: value, page: 1}));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({...prev, page: newPage}));
    };

    const handleNotesChange = async (newNotes: string) => {
        if (!selectedCrash || !projectId) return;

        try {
            const updatedCrash = await crashReportsApi.updateStatus(
                parseInt(projectId),
                selectedCrash.id,
                { notes: newNotes }
            );
            
            setSelectedCrash(updatedCrash);
        } catch (error) {
            console.error('Failed to save notes:', error);
            toast('Failed to save notes', { variant: 'destructive' });
        }
    };

    if (initialLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Activity className="h-8 w-8 animate-spin mx-auto mb-4"/>
                        <p className="text-muted-foreground">Loading crash reports...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
                <CrashReportsHeader
                    onRefresh={loadCrashReports}
                    onClearAll={handleClearAllCrashReports}
                    crashReportsCount={pagination.total}
                    project={project}
                />            <CrashReportsStats
                crashReports={crashReports}
                totalCount={pagination.total}
            />

            <CrashReportsFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            <CrashReportsTable
                crashReports={crashReports}
                pagination={pagination}
                onViewDetails={handleViewDetails}
                onDeleteCrashReport={handleDeleteCrashReport}
                onPageChange={handlePageChange}
            />

            <CrashReportDetailDialog
                open={showDetailDialog}
                onOpenChange={setShowDetailDialog}
                crashReport={selectedCrash}
                loading={loadingDetails}
                onNotesChange={handleNotesChange}
                onStatusUpdate={handleUpdateStatus}
                onConvertToIssue={() => setShowConvertDialog(true)}
                updatingStatus={updatingStatus}
            />

            <ConvertToIssueDialog
                open={showConvertDialog}
                onOpenChange={setShowConvertDialog}
                crashReport={selectedCrash}
                onConvert={handleConvertToIssue}
            />
        </div>
    );
};
