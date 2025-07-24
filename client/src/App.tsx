import {useState, useEffect} from 'react';
import {useAuth} from './contexts/AuthContext';
import {Navigation} from './components/Navigation';
import {ProjectList} from './components/ProjectList';
import {IssueList} from './components/IssueList';
import {IssueDetail} from './components/IssueDetail';
import {CreateIssue} from './components/CreateIssue';
import {Footer} from './components/Footer';
import {projectsApi, postsApi} from './services/api';
import type {Project, Post, CreatePostData} from './types';

const App = () => {
    const {isAuthenticated, isLoading} = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
    const [showCreateIssue, setShowCreateIssue] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'open' | 'closed'>('all');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    useEffect(() => {
        // Load projects for both authenticated and guest users
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadPosts(selectedProject.id);
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
        const project = projectId ? projects.find(p => p.id === projectId) || null : null;
        setSelectedProject(project);
        setSelectedIssueId(null);
        setShowCreateIssue(false);
    };

    const handleViewModeChange = (mode: 'list' | 'kanban') => {
        setViewMode(mode);
    };

    const handleCreateIssue = () => {
        setShowCreateIssue(true);
    };

    const handleSubmitIssue = async (projectId: number, data: CreatePostData, files: File[]) => {
        try {
            await postsApi.create(projectId, data);

            if (files.length > 0) {
                console.log('File upload not implemented yet:', files);
            }

            if (selectedProject?.id === projectId) {
                await loadPosts(projectId);
            }

            setShowCreateIssue(false);
        } catch (error) {
            throw error;
        }
    };

    const handleUpvote = async (postId: number) => {
        if (!isAuthenticated) {
            alert('Please login to vote on issues');
            return;
        }

        if (!selectedProject) return;

        try {
            await postsApi.toggleVote(selectedProject.id, postId);
            await loadPosts(selectedProject.id);
        } catch (error) {
            console.error('Failed to toggle vote:', error);
        }
    };

    const handleStatusChange = async (postId: number, status: 'Offen' | 'In Arbeit' | 'Geschlossen') => {
        if (!isAuthenticated) {
            alert('Please login to change issue status');
            return;
        }

        if (!selectedProject) return;

        try {
            await postsApi.update(selectedProject.id, postId, {status});
            await loadPosts(selectedProject.id);
        } catch (error) {
            console.error('Failed to update post status:', error);
        }
    };

    const handleIssueClick = (postId: number) => {
        setSelectedIssueId(postId);
    };

    const handleBackToIssueList = () => {
        setSelectedIssueId(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    const selectedProjectData = selectedProject;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navigation
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onCreateIssue={handleCreateIssue}
            />

            <div className="flex-1">
                {showCreateIssue ? (
                    <CreateIssue
                        projects={projects}
                        selectedProject={selectedProject?.id || null}
                        onSubmit={handleSubmitIssue}
                        onCancel={() => setShowCreateIssue(false)}
                    />
                ) : selectedProject && selectedProjectData ? (
                    isLoadingPosts ? (
                        <div className="container py-8 px-4 text-center">
                            <div
                                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading issues...</p>
                        </div>
                    ) : (
                        <div className="container py-8 px-4">
                            {selectedIssueId ? (
                                <IssueDetail
                                    issueId={selectedIssueId}
                                    projectId={selectedProject.id}
                                    onBack={handleBackToIssueList}
                                />
                            ) : (
                                <IssueList
                                    project={selectedProjectData}
                                    posts={posts}
                                    filterType={filterType}
                                    viewMode={viewMode}
                                    onFilterChange={setFilterType}
                                    onUpvote={handleUpvote}
                                    onStatusChange={handleStatusChange}
                                    onIssueClick={handleIssueClick}
                                />
                            )}
                        </div>
                    )
                ) : (
                    isLoadingProjects ? (
                        <div className="container py-8 px-4 text-center">
                            <div
                                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading projects...</p>
                        </div>
                    ) : (
                        <div className="container py-8 px-4">
                            {/* Hero Section */}
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-xl mb-6 border border-primary/20">
                                    <img src="/favicon.png" alt="TigerBug" className="h-12 w-12 mr-3" />
                                    <div className="text-left">
                                        <h1 className="text-3xl font-bold text-foreground">TigerBug</h1>
                                        <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-orange-400 rounded-full mt-1"></div>
                                    </div>
                                </div>
                                <h2 className="text-lg font-medium text-muted-foreground mb-3">
                                    Open source bug reporting system for video games
                                </h2>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Projects</h2>
                                {!isAuthenticated && (
                                    <div className="text-sm text-muted-foreground">
                                        Login to create issues and vote
                                    </div>
                                )}
                            </div>
                            <ProjectList
                                projects={projects}
                                onProjectSelect={handleProjectSelect}
                            />
                        </div>
                    )
                )}
            </div>

            <Footer/>
        </div>
    );
}

export default App;
