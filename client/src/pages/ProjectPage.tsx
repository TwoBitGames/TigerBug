import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useDialog} from '../contexts/DialogContext';
import {useViewMode} from '../contexts/ViewModeContext';
import {IssueList} from '../components/IssueList';
import {projectsApi, postsApi} from '../services/api';
import type {Project} from '../types';

export const ProjectPage = () => {
    const {projectId} = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const {isAuthenticated} = useAuth();
    const {alert} = useDialog();
    const {viewMode} = useViewMode();

    const [project, setProject] = useState<Project | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'open' | 'in progress' | 'closed'>('all');
    const [isLoadingProject, setIsLoadingProject] = useState(false);
    const [votingPosts, setVotingPosts] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (projectId) {
            loadProject();
        }
    }, [projectId]);

    const loadProject = async () => {
        if (!projectId) return;

        setIsLoadingProject(true);
        try {
            const projects = await projectsApi.getAll();
            const foundProject = projects.find((p: Project) => p.id === parseInt(projectId));
            setProject(foundProject || null);
        } catch (error) {
            console.error('Failed to load project:', error);
            setProject(null);
        } finally {
            setIsLoadingProject(false);
        }
    };

    const handleUpvote = async (postId: number): Promise<void> => {
        if (!isAuthenticated) {
            await alert('Please login to vote on issues');
            return;
        }

        if (!projectId) return;

        try {
            setVotingPosts(prev => new Set(prev).add(postId));
            await postsApi.toggleVote(parseInt(projectId), postId);
        } catch (error) {
            console.error('Failed to toggle vote:', error);
        } finally {
            setVotingPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };

    const handleStatusChange = async (postId: number, status: 'Open' | 'In Progress' | 'Closed') => {
        if (!isAuthenticated) {
            await alert('Please login to change issue status');
            return;
        }

        if (!projectId) return;

        try {
            await postsApi.update(parseInt(projectId), postId, {status});
        } catch (error) {
            console.error('Failed to update post status:', error);
        }
    };

    const handleIssueClick = (postId: number) => {
        navigate(`/projects/${projectId}/issues/${postId}`);
    };

    if (isLoadingProject) {
        return (
            <div className="container py-8 px-4 text-center">
                <div
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading project...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container py-8 px-4 text-center">
                <h1 className="text-2xl font-bold text-foreground mb-4">Project not found</h1>
                <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
            </div>
        );
    }

    return (
        <IssueList
            project={project}
            filterType={filterType}
            viewMode={viewMode}
            votingPosts={votingPosts}
            onFilterChange={setFilterType}
            onUpvote={handleUpvote}
            onStatusChange={handleStatusChange}
            onIssueClick={handleIssueClick}
        />
    );
};
