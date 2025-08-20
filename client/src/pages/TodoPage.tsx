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
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpFromLine,
    Loader2,
    BarChart3,
    TrendingUp,
    AlertCircle,
    Search,
    X,
    RefreshCw
} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Card, CardContent} from '../components/ui/card';
import {Badge} from '../components/ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '../components/ui/avatar';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../components/ui/select';
import {Input} from '../components/ui/input';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '../components/ui/tooltip';
import {PriorityBadge} from '../components/ui/priority-badge';
import {IssueTypeBadge} from '../components/ui/issue-type-badge';
import {useAuth} from '../contexts/AuthContext';
import {todoApi, postsApi} from '../services/api';
import {useDebounce} from '../hooks/use-debounce';
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
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    summary: {
        total: number;
        overdue: number;
        today: number;
        thisWeek: number;
        open: number;
        closed: number;
        totalStoryPoints: number;
        completedStoryPoints: number;
        storyPointsProgress: number;
    };
}

export const TodoPage = () => {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [todoData, setTodoData] = useState<TodoData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [votingPosts, setVotingPosts] = useState<Set<number>>(new Set());
    const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set());

    const [statusFilter, setStatusFilter] = useState('open');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [sortBy, setSortBy] = useState('due_date');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRangeFilter, setDateRangeFilter] = useState('all');

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

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const fetchTodoData = async () => {
        try {
            const data = await todoApi.getTasks({
                status: statusFilter,
                priority: priorityFilter,
                project: projectFilter,
                sort: sortBy,
                search: debouncedSearchQuery,
                date_range: dateRangeFilter === 'all' ? undefined : dateRangeFilter,
                limit: 1000
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
        }
    };

    useEffect(() => {
        if (user) {
            fetchTodoData();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchTodoData();
        }
    }, [statusFilter, priorityFilter, projectFilter, sortBy, debouncedSearchQuery, dateRangeFilter]);

    const handleUpvote = async (postId: number) => {
        if (!todoData) return;

        const post = todoData.tasks.find(p => p.id === postId);
        if (!post) return;

        try {
            setVotingPosts(prev => new Set(prev).add(postId));
            await postsApi.toggleVote(post.project_id, postId);

            setTodoData(prevData => {
                if (!prevData) return prevData;

                const updatedTasks = prevData.tasks.map(task =>
                    task.id === postId
                        ? {
                            ...task,
                            vote_count: post.user_voted ? (task.vote_count || 1) - 1 : (task.vote_count || 0) + 1,
                            user_voted: !post.user_voted
                        }
                        : task
                );

                const updateGroupedTasks = (groupedTasks: any) => {
                    const updated = {...groupedTasks};
                    Object.keys(updated).forEach(key => {
                        updated[key] = updated[key].map((task: Post) =>
                            task.id === postId
                                ? {
                                    ...task,
                                    vote_count: post.user_voted ? (task.vote_count || 1) - 1 : (task.vote_count || 0) + 1,
                                    user_voted: !post.user_voted
                                }
                                : task
                        );
                    });
                    return updated;
                };

                return {
                    ...prevData,
                    tasks: updatedTasks,
                    groupedTasks: updateGroupedTasks(prevData.groupedTasks)
                };
            });
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

        setUpdatingStatus(prev => new Set(prev).add(postId));

        const optimisticUpdate = (prevData: TodoData) => {
            const updatedTasks = prevData.tasks.map(task =>
                task.id === postId ? {...task, status: newStatus} : task
            );

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const groupedTasks = {
                overdue: [] as Post[],
                today: [] as Post[],
                tomorrow: [] as Post[],
                thisWeek: [] as Post[],
                later: [] as Post[],
                noDueDate: [] as Post[]
            };

            updatedTasks.forEach(task => {
                if (!task.due_date) {
                    groupedTasks.noDueDate.push(task);
                } else {
                    const dueDate = new Date(task.due_date);
                    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

                    if (dueDateOnly < today) {
                        groupedTasks.overdue.push(task);
                    } else if (dueDateOnly.getTime() === today.getTime()) {
                        groupedTasks.today.push(task);
                    } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
                        groupedTasks.tomorrow.push(task);
                    } else if (dueDateOnly <= nextWeek) {
                        groupedTasks.thisWeek.push(task);
                    } else {
                        groupedTasks.later.push(task);
                    }
                }
            });

            const openCount = updatedTasks.filter(task => task.status !== 'Closed').length;
            const closedCount = updatedTasks.filter(task => task.status === 'Closed').length;

            return {
                ...prevData,
                tasks: updatedTasks,
                groupedTasks,
                summary: {
                    ...prevData.summary,
                    open: openCount,
                    closed: closedCount
                }
            };
        };

        setTodoData(prevData => {
            if (!prevData) return prevData;
            return optimisticUpdate(prevData);
        });

        try {
            await postsApi.update(post.project_id, postId, {status: newStatus});
        } catch (error) {
            console.error('Error updating post status:', error);
            await fetchTodoData();
        } finally {
            setUpdatingStatus(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
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

    const TaskCard = ({post}: { post: Post }) => {
        const isVoting = votingPosts.has(post.id);
        const isUpdatingStatus = updatingStatus.has(post.id);

        return (
            <Card
                key={post.id}
                className="hover:shadow-lg transition-all duration-200 bg-card border-border hover:border-accent backdrop-blur-sm hover:bg-accent/5 cursor-pointer py-0 group"
                onClick={() => handleIssueClick(post.id)}
            >
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isVoting}
                            className="flex-col h-auto p-1.5 min-w-[50px] text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleUpvote(post.id);
                            }}
                        >
                            {isVoting ? (
                                <Loader2 className="h-3.5 w-3.5 mb-0.5 animate-spin"/>
                            ) : (
                                <ArrowUpFromLine className="h-3.5 w-3.5 mb-0.5"/>
                            )}
                            <span className="text-xs font-medium">{post.vote_count || 0}</span>
                        </Button>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                {getStatusIcon(post.status)}
                                <PriorityBadge priority={post.priority || 'Medium'} size="sm"/>
                                <IssueTypeBadge issueType={post.issue_type || 'Bug'} size="sm"/>
                                <Badge variant="outline" className="text-xs">
                                    {post.Project?.name}
                                </Badge>
                                {post.is_private && (
                                    <Badge variant="destructive" className="text-xs">
                                        Private
                                    </Badge>
                                )}
                            </div>

                            <h3 className="font-medium text-sm leading-tight mb-2 text-card-foreground group-hover:text-foreground transition-colors">
                                {post.title}
                            </h3>

                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                <div className="flex items-center space-x-3 flex-wrap">
                                    <div className="flex items-center space-x-1">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage
                                                src={post.author?.profile_picture || "/placeholder.svg"}
                                                alt={post.author?.username || 'User'}
                                            />
                                            <AvatarFallback
                                                className="text-[10px] bg-secondary text-secondary-foreground">
                                                {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{post.author?.username || 'Unknown'}</span>
                                    </div>

                                    {post.assignee && post.assignee.id !== post.author?.id && (
                                        <div className="flex items-center space-x-1">
                                            <span>→</span>
                                            <Avatar className="h-4 w-4">
                                                <AvatarImage
                                                    src={post.assignee?.profile_picture || "/placeholder.svg"}
                                                    alt={post.assignee?.username || 'User'}
                                                />
                                                <AvatarFallback
                                                    className="text-[10px] bg-secondary text-secondary-foreground">
                                                    {post.assignee?.username?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{post.assignee?.username}</span>
                                        </div>
                                    )}

                                    {post.story_points && (
                                        <div className="flex items-center space-x-1">
                                            <Target className="h-3 w-3"/>
                                            <span>{post.story_points} pts</span>
                                        </div>
                                    )}

                                    {post.time_estimate && (
                                        <div className="flex items-center space-x-1">
                                            <Clock className="h-3 w-3"/>
                                            <span>{post.time_estimate}h</span>
                                        </div>
                                    )}
                                </div>

                                {post.due_date && (
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3"/>
                                        <span
                                            className={new Date(post.due_date) < new Date() ? 'text-red-500 font-medium' : ''}>
                                            {formatDueDate(post.due_date)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-1">
                                {isUpdatingStatus && (
                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin"/>
                                        <span>Updating...</span>
                                    </div>
                                )}
                                {!isUpdatingStatus && (
                                    <>
                                        {post.status !== 'Open' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
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
                                                className="h-6 px-2 text-xs hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
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
                                                className="h-6 px-2 text-xs hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(post.id, 'Closed');
                                                }}
                                            >
                                                Complete
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

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
                        {isCollapsed ? <ChevronDown className="h-4 w-4"/> : <ChevronUp className="h-4 w-4"/>}
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
                                        <ChevronsLeft className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="h-8"
                                    >
                                        <ChevronLeft className="h-4 w-4"/>
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
                                        <ChevronRight className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="h-8"
                                        title="Last page"
                                    >
                                        <ChevronsRight className="h-4 w-4"/>
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
        return (<></>);
    }

    if (error) {
        return (
            <div className="container py-8 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
                    <p>{error}</p>
                    <Button onClick={() => fetchTodoData()} className="mt-4">
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
        <main className="container py-4 px-4 max-w-7xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div
                            className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-primary"/>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">My To-Do</h1>
                            <p className="text-sm text-muted-foreground">Manage your assigned tasks and track
                                progress</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchTodoData()}
                        >
                            <RefreshCw className="h-4 w-4 mr-2"/>
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Card
                                    className={`py-0 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-800 cursor-pointer hover:shadow-md transition-all duration-200 ${
                                        statusFilter === 'all' && dateRangeFilter === 'all' ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setDateRangeFilter('all');
                                        setPriorityFilter('all');
                                        setProjectFilter('all');
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-500 rounded-lg">
                                                <TrendingUp className="h-4 w-4 text-white"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total
                                                    Tasks</p>
                                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{todoData.summary.total}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to view all tasks</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Card
                                    className={`py-0 bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-800 cursor-pointer hover:shadow-md transition-all duration-200 ${
                                        dateRangeFilter === 'overdue' ? 'ring-2 ring-red-500' : ''
                                    }`}
                                    onClick={() => {
                                        setDateRangeFilter('overdue');
                                        setStatusFilter('open');
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-red-500 rounded-lg">
                                                <AlertTriangle className="h-4 w-4 text-white"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Overdue</p>
                                                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{todoData.summary.overdue}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to view overdue tasks</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Card
                                    className={`py-0 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-800 cursor-pointer hover:shadow-md transition-all duration-200 ${
                                        dateRangeFilter === 'today' ? 'ring-2 ring-orange-500' : ''
                                    }`}
                                    onClick={() => {
                                        setDateRangeFilter('today');
                                        setStatusFilter('open');
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-orange-500 rounded-lg">
                                                <Clock className="h-4 w-4 text-white"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Due
                                                    Today</p>
                                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{todoData.summary.today}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to view tasks due today</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Card
                                    className={`py-0 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 dark:border-amber-800 cursor-pointer hover:shadow-md transition-all duration-200 ${
                                        dateRangeFilter === 'this_week' ? 'ring-2 ring-amber-500' : ''
                                    }`}
                                    onClick={() => {
                                        setDateRangeFilter('this_week');
                                        setStatusFilter('open');
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-amber-500 rounded-lg">
                                                <Calendar className="h-4 w-4 text-white"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">This
                                                    Week</p>
                                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{todoData.summary.thisWeek}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to view tasks due this week</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Card
                                    className={`py-0 bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:border-green-800 cursor-pointer hover:shadow-md transition-all duration-200 ${
                                        statusFilter === 'closed' ? 'ring-2 ring-green-500' : ''
                                    }`}
                                    onClick={() => {
                                        setStatusFilter('closed');
                                        setDateRangeFilter('all');
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-500 rounded-lg">
                                                <CheckCircle className="h-4 w-4 text-white"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Completed</p>
                                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{todoData.summary.closed}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to view completed tasks</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Card
                                    className={`py-0 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-800 cursor-pointer hover:shadow-md transition-all duration-200 ${
                                        sortBy === 'story_points' ? 'ring-2 ring-purple-500' : ''
                                    }`}
                                    onClick={() => {
                                        setSortBy('story_points');
                                        setStatusFilter('all');
                                        setDateRangeFilter('all');
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-purple-500 rounded-lg">
                                                <Target className="h-4 w-4 text-white"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Story
                                                    Points</p>
                                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                                    {todoData.summary.completedStoryPoints}/{todoData.summary.totalStoryPoints}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to sort by story points</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <Card className="mb-6 py-0">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Search tasks by title or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-10"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="h-3 w-3"/>
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center space-x-3 flex-wrap gap-2">
                                <div className="flex items-center space-x-2">
                                    <Filter className="h-4 w-4 text-muted-foreground"/>
                                    <span className="text-sm text-muted-foreground hidden md:inline">Filters:</span>
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="Status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="open">Open & In Progress</SelectItem>
                                        <SelectItem value="closed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger className="w-[130px] h-9">
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
                                    <SelectTrigger className="w-[150px] h-9">
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
                                    <SelectTrigger className="w-[130px] h-9">
                                        <SelectValue placeholder="Sort by"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="due_date">Due Date</SelectItem>
                                        <SelectItem value="priority">Priority</SelectItem>
                                        <SelectItem value="story_points">Story Points</SelectItem>
                                        <SelectItem value="created_date">Created Date</SelectItem>
                                        <SelectItem value="updated_date">Updated Date</SelectItem>
                                        <SelectItem value="title">Title</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="Date Range"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Dates</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="today">Due Today</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="no_due_date">No Due Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
