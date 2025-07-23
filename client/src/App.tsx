import {useState, useEffect} from 'react';
import {useAuth} from './contexts/AuthContext';
import {LoginForm} from './components/LoginForm';
import {Navigation} from './components/Navigation';
import {ProjectList} from './components/ProjectList';
import {IssueList} from './components/IssueList';
import {CreateIssue} from './components/CreateIssue';
import {Footer} from './components/Footer';
import {projectsApi, postsApi} from './services/api';
import type {Project, Post, CreatePostData} from './types';

const App = () => {
    const {isAuthenticated, isLoading} = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [showCreateIssue, setShowCreateIssue] = useState(false);
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [filterType, setFilterType] = useState<'all' | 'open' | 'closed'>('all');
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadProjects();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedProject) {
            loadPosts(selectedProject);
        }
    }, [selectedProject]);

    const loadProjects = async () => {
        setIsLoadingProjects(true);
        try {
            const projectData = await projectsApi.getAll();
            setProjects(Array.isArray(projectData) ? projectData : []);
        } catch (error) {
            console.error('Failed to load projects:', error);
            setProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const loadPosts = async (projectId: number) => {
        setIsLoadingPosts(true);
        try {
            const postData = await postsApi.getAll(projectId);
            setPosts(Array.isArray(postData) ? postData : []);
        } catch (error) {
            console.error('Failed to load posts:', error);
            setPosts([]);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const handleProjectSelect = (projectId: number | null) => {
        setSelectedProject(projectId);
        setShowCreateIssue(false);
    };

    const handleBackToProjects = () => {
        setSelectedProject(null);
        setShowCreateIssue(false);
        setPosts([]);
    };

    const handleCreateIssue = () => {
        setShowCreateIssue(true);
    };

    const handleBackFromCreateIssue = () => {
        setShowCreateIssue(false);
    };

    const handleShowAdminDashboard = () => {
        setShowAdminDashboard(true);
    };

    const handleSubmitIssue = async (projectId: number, data: CreatePostData, files: File[]) => {
        try {
            await postsApi.create(projectId, data);

            if (files.length > 0) {
                console.log('File upload not implemented yet:', files);
            }

            if (selectedProject === projectId) {
                await loadPosts(projectId);
            }

            setShowCreateIssue(false);
        } catch (error) {
            throw error;
        }
    };

    const handleUpvote = async (postId: number) => {
        if (!selectedProject) return;

        try {
            await postsApi.toggleVote(selectedProject, postId);
            await loadPosts(selectedProject);
        } catch (error) {
            console.error('Failed to toggle vote:', error);
        }
    };

    const handleStatusChange = async (postId: number, status: 'Offen' | 'In Arbeit' | 'Geschlossen') => {
        if (!selectedProject) return;

        try {
            await postsApi.update(selectedProject, postId, {status});
            await loadPosts(selectedProject);
        } catch (error) {
            console.error('Failed to update post status:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return <LoginForm/>;

    const selectedProjectData = Array.isArray(projects) ? projects.find(p => p.id === selectedProject) : undefined;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
            <Navigation
                selectedProject={selectedProject}
                projects={projects}
                showCreateIssue={showCreateIssue}
                viewMode={viewMode}
                onProjectSelect={handleProjectSelect}
                onBackToProjects={handleBackToProjects}
                onBackFromCreateIssue={handleBackFromCreateIssue}
                onCreateIssue={handleCreateIssue}
                onViewModeChange={setViewMode}
                onShowAdminDashboard={handleShowAdminDashboard}
            />

            <div className="flex-1">
                {showCreateIssue ? (
                    <CreateIssue
                        projects={projects}
                        selectedProject={selectedProject}
                        onSubmit={handleSubmitIssue}
                        onCancel={handleBackFromCreateIssue}
                    />
                ) : selectedProject && selectedProjectData ? (
                    isLoadingPosts ? (
                        <div className="container py-8 px-4 text-center">
                            <div
                                className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-zinc-400">Loading issues...</p>
                        </div>
                    ) : (
                        <IssueList
                            project={selectedProjectData}
                            posts={posts}
                            filterType={filterType}
                            viewMode={viewMode}
                            onFilterChange={setFilterType}
                            onUpvote={handleUpvote}
                            onStatusChange={handleStatusChange}
                        />
                    )
                ) : (
                    isLoadingProjects ? (
                        <div className="container py-8 px-4 text-center">
                            <div
                                className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-zinc-400">Loading projects...</p>
                        </div>
                    ) : (
                        <ProjectList
                            projects={projects}
                            onProjectSelect={handleProjectSelect}
                        />
                    )
                )}
            </div>

            <Footer/>
        </div>
    );
}

export default App;
