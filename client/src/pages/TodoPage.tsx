import React, {useState, useEffect} from 'react';
import {
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    Circle,
    Target,
    Filter,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpFromLine,
    Loader2,
    BarChart3,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Card, CardContent} from '../components/ui/card';
import {Badge} from '../components/ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '../components/ui/avatar';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../components/ui/select';
import {PriorityBadge} from '../components/ui/priority-badge';
import {IssueTypeBadge} from '../components/ui/issue-type-badge';
import {useAuth} from '../contexts/AuthContext';
import {todoApi, postsApi} from '../services/api';
import type {Post} from '../types';
import {useNavigate} from 'react-router-dom';

interface TodoData {
    tasks: Post[];
    groupedTasks: {
        overdue: Post[];
        today: Post[];
        tomorrow: Post[];
        thisWeek: Post[];
        later: Post[];
        noDueDate: Post[];
    };
    projects: { id: number; name: string }[];
    summary: {
        total: number;
        overdue: number;
        today: number;
        thisWeek: number;
        open: number;
        closed: number;
    };
}

export const TodoPage = () => {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [todoData, setTodoData] = useState<TodoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [votingPosts, setVotingPosts] = useState<Set<number>>(new Set());

    const [statusFilter, setStatusFilter] = useState('open');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [sortBy, setSortBy] = useState('due_date');

    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [sectionPages, setSectionPages] = useState<{ [key: string]: number }>({
        'overdue': 1,
        'today': 1,
        'tomorrow': 1,
        'thisWeek': 1,
        'later': 1,
        'noDueDate': 1
    });

    const ITEMS_PER_PAGE = 25;

    const fetchTodoData = async () => {
        try {
            setLoading(true);
            const data = await todoApi.getTasks({
                status: statusFilter,
                priority: priorityFilter,
                project: projectFilter,
                sort: sortBy,
            });
            setTodoData(data);
            setError(null);
            setSectionPages({
                'overdue': 1,
                'today': 1,
                'tomorrow': 1,
                'thisWeek': 1,
                'later': 1,
                'noDueDate': 1
            });
        } catch (err) {
            console.error('Error fetching todo data:', err);
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTodoData();
        }
    }, [user, statusFilter, priorityFilter, projectFilter, sortBy]);

    const handleUpvote = async (postId: number) => {
        if (!todoData) return;

        const post = todoData.tasks.find(p => p.id === postId);
        if (!post) return;

        try {
            setVotingPosts(prev => new Set(prev).add(postId));
            await postsApi.toggleVote(post.project_id, postId);
            await fetchTodoData();
        } catch (error) {
            console.error('Error voting on post:', error);
        } finally {
            setVotingPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };

    const handleStatusChange = async (postId: number, newStatus: 'Open' | 'In Progress' | 'Closed') => {
        if (!todoData) return;

        const post = todoData.tasks.find(p => p.id === postId);
        if (!post) return;

        try {
            await postsApi.update(post.project_id, postId, {status: newStatus});
            await fetchTodoData();
        } catch (error) {
            console.error('Error updating post status:', error);
        }
    };

    const handleIssueClick = (postId: number) => {
        if (!todoData) return;

        const post = todoData.tasks.find(p => p.id === postId);
        if (post) {
            navigate(`/projects/${post.project_id}/issues/${postId}`);
        }
    };

    const toggleSection = (sectionName: string) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionName)) {
                newSet.delete(sectionName);
            } else {
                newSet.add(sectionName);
            }
            return newSet;
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Open':
                return <Circle className="h-4 w-4 text-red-400"/>;
            case 'In Progress':
                return <Clock className="h-4 w-4 text-orange-400"/>;
            case 'Closed':
                return <CheckCircle className="h-4 w-4 text-green-400"/>;
            default:
                return <Circle className="h-4 w-4 text-gray-400"/>;
        }
    };

    const formatDueDate = (dueDate: string) => {
        const date = new Date(dueDate);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else {
            return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        }
    };

    const TaskCard = ({post}: { post: Post }) => (
        <Card
            key={post.id}
            className="hover:shadow-lg transition-shadow bg-card border-border hover:border-accent backdrop-blur-sm hover:bg-accent/5 cursor-pointer py-0"
            onClick={() => handleIssueClick(post.id)}
        >
            <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={votingPosts.has(post.id)}
                        className="flex-col h-auto p-1.5 min-w-[50px] text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(post.id);
                        }}
                    >
                        {votingPosts.has(post.id) ? (
                            <Loader2 className="h-3.5 w-3.5 mb-0.5 animate-spin"/>
                        ) : (
                            <ArrowUpFromLine className="h-3.5 w-3.5 mb-0.5"/>
                        )}
                        <span className="text-xs font-medium">{post.vote_count || 0}</span>
                    </Button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(post.status)}
                            <PriorityBadge priority={post.priority || 'Medium'} size="sm"/>
                            <IssueTypeBadge issueType={post.issue_type || 'Bug'} size="sm"/>
                            <Badge variant="outline" className="text-xs">
                                {post.Project?.name}
                            </Badge>
                        </div>

                        <h3 className="font-medium text-sm leading-tight mb-2 text-card-foreground">
                            {post.title}
                        </h3>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src="/placeholder.svg" alt={post.author?.username || 'User'}/>
                                        <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                                            {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{post.author?.username || 'Unknown'}</span>
                                </div>

                                {post.story_points && (
                                    <div className="flex items-center space-x-1">
                                        <Target className="h-3 w-3"/>
                                        <span>{post.story_points} pts</span>
                                    </div>
                                )}
                            </div>

                            {post.due_date && (
                                <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3"/>
                                    <span className={new Date(post.due_date) < new Date() ? 'text-red-500' : ''}>
                    {formatDueDate(post.due_date)}
                  </span>
                                </div>
                            )}
                        </div>

                        {/* Status change buttons */}
                        <div className="flex items-center space-x-1 mt-3">
                            {post.status !== 'Open' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(post.id, 'Open');
                                    }}
                                >
                                    Reopen
                                </Button>
                            )}
                            {post.status !== 'In Progress' && post.status !== 'Closed' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(post.id, 'In Progress');
                                    }}
                                >
                                    Start Work
                                </Button>
                            )}
                            {post.status !== 'Closed' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(post.id, 'Closed');
                                    }}
                                >
                                    Complete
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const TaskSection = ({
                             title,
                             tasks,
                             icon,
                             color,
                             sectionKey,
                             description
                         }: {
        title: string;
        tasks: Post[];
        icon: React.ReactNode;
        color: string;
        sectionKey: string;
        description?: string;
    }) => {
        if (tasks.length === 0) return null;

        const isCollapsed = collapsedSections.has(sectionKey);
        const currentPage = sectionPages[sectionKey] || 1;
        const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);
        const showPagination = tasks.length > ITEMS_PER_PAGE;
        
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentTasks = tasks.slice(startIndex, endIndex);

        const handlePageChange = (newPage: number) => {
            setSectionPages(prev => ({
                ...prev,
                [sectionKey]: newPage
            }));
        };

        const handlePrevPage = () => {
            if (currentPage > 1) {
                handlePageChange(currentPage - 1);
            }
        };

        const handleNextPage = () => {
            if (currentPage < totalPages) {
                handlePageChange(currentPage + 1);
            }
        };

        return (
            <div className="space-y-2">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection(sectionKey)}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`p-1.5 rounded-lg ${color}`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base text-foreground flex items-center space-x-2">
                                <span>{title}</span>
                                <Badge variant="secondary"
                                       className="bg-secondary text-secondary-foreground border-border text-xs">
                                    {tasks.length}
                                </Badge>
                                {showPagination && !isCollapsed && (
                                    <Badge variant="outline" className="text-xs">
                                        Page {currentPage} of {totalPages}
                                    </Badge>
                                )}
                            </h3>
                            {description && (
                                <p className="text-xs text-muted-foreground">{description}</p>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="sm">
                        {isCollapsed ? <ChevronDown className="h-4 w-4"/> : <ArrowUpFromLine className="h-4 w-4"/>}
                    </Button>
                </div>

                {!isCollapsed && (
                    <div className="space-y-2 ml-8">
                        <div className="space-y-2">
                            {currentTasks.map(task => (
                                <TaskCard key={task.id} post={task}/>
                            ))}
                        </div>

                        {showPagination && (
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="h-8"
                                        title="First page"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="h-8"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="h-8"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="h-8"
                                        title="Last page"
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Showing {startIndex + 1}-{Math.min(endIndex, tasks.length)} of {tasks.length} tasks
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!user) {
        return (
            <div className="container py-8 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please log in to view your tasks</h1>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container py-8 px-4">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin"/>
                    <span className="ml-2">Loading your tasks...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-8 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
                    <p>{error}</p>
                    <Button onClick={fetchTodoData} className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (!todoData) {
        return null;
    }

    return (
        <main className="container py-4 px-4 max-w-6xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center space-x-3 mb-3">
                    <div
                        className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-primary"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">My To-Do</h1>
                        <p className="text-sm text-muted-foreground">Manage your assigned tasks and track progress</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <Card className="bg-card border-border py-0">
                        <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4 text-blue-500"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Tasks</p>
                                    <p className="text-xl font-bold">{todoData.summary.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border py-0">
                        <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-red-500"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Overdue</p>
                                    <p className="text-xl font-bold text-red-500">{todoData.summary.overdue}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border py-0">
                        <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-orange-500"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Due Today</p>
                                    <p className="text-xl font-bold text-orange-500">{todoData.summary.today}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border py-0">
                        <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-blue-500"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">This Week</p>
                                    <p className="text-xl font-bold">{todoData.summary.thisWeek}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border py-0">
                        <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                    <p className="text-xl font-bold text-green-500">{todoData.summary.closed}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center space-x-3 flex-wrap gap-2 mb-6">
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-muted-foreground"/>
                        <span className="text-sm text-muted-foreground">Filters:</span>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px] h-8 bg-background border-border">
                            <SelectValue placeholder="Status"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="open">Open & In Progress</SelectItem>
                            <SelectItem value="closed">Completed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[120px] h-8 bg-background border-border">
                            <SelectValue placeholder="Priority"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                        <SelectTrigger className="w-[140px] h-8 bg-background border-border">
                            <SelectValue placeholder="Project"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {todoData.projects.map(project => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[120px] h-8 bg-background border-border">
                            <SelectValue placeholder="Sort by"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="due_date">Due Date</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                            <SelectItem value="story_points">Story Points</SelectItem>
                            <SelectItem value="created_date">Created Date</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-6">
                <TaskSection
                    title="Overdue"
                    tasks={todoData.groupedTasks.overdue}
                    icon={<AlertTriangle className="h-5 w-5 text-white"/>}
                    color="bg-red-500"
                    sectionKey="overdue"
                    description="Tasks that are past their due date"
                />

                <TaskSection
                    title="Due Today"
                    tasks={todoData.groupedTasks.today}
                    icon={<Clock className="h-5 w-5 text-white"/>}
                    color="bg-orange-500"
                    sectionKey="today"
                    description="Tasks due today"
                />

                <TaskSection
                    title="Due Tomorrow"
                    tasks={todoData.groupedTasks.tomorrow}
                    icon={<Calendar className="h-5 w-5 text-white"/>}
                    color="bg-yellow-500"
                    sectionKey="tomorrow"
                    description="Tasks due tomorrow"
                />

                <TaskSection
                    title="This Week"
                    tasks={todoData.groupedTasks.thisWeek}
                    icon={<Calendar className="h-5 w-5 text-white"/>}
                    color="bg-blue-500"
                    sectionKey="thisWeek"
                    description="Tasks due within the next 7 days"
                />

                <TaskSection
                    title="Later"
                    tasks={todoData.groupedTasks.later}
                    icon={<Calendar className="h-5 w-5 text-white"/>}
                    color="bg-gray-500"
                    sectionKey="later"
                    description="Tasks due after this week"
                />

                <TaskSection
                    title="No Due Date"
                    tasks={todoData.groupedTasks.noDueDate}
                    icon={<AlertCircle className="h-5 w-5 text-white"/>}
                    color="bg-gray-400"
                    sectionKey="noDueDate"
                    description="Tasks without a due date set"
                />
            </div>

            {todoData.summary.total === 0 && (
                <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
                    <p className="text-muted-foreground">You have no assigned tasks at the moment.</p>
                </div>
            )}
        </main>
    );
};
