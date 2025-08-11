import {
    ArrowUpFromLine,
    Circle,
    Clock,
    CheckCircle,
    User,
    Calendar,
    Target,
    Search,
    Filter,
    X,
    Loader2,
    GitBranch,
    Lock,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import {Button} from './ui/button';
import {Card, CardContent} from './ui/card';
import {Badge} from './ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {Input} from './ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from './ui/select';
import {PriorityBadge} from './ui/priority-badge';
import {IssueTypeBadge} from './ui/issue-type-badge';
import {ProjectLogo} from './ui/project-logo';
import type {Post, Project} from '../types';
import {useState, useEffect, useCallback} from 'react';
import {postsApi} from '../services/api';
import {useDebounce} from '../hooks/use-debounce';

interface IssueListProps {
    project: Project;
    filterType: 'all' | 'open' | 'closed';
    viewMode: 'list' | 'kanban';
    votingPosts?: Set<number>;
    onFilterChange: (filter: 'all' | 'open' | 'closed') => void;
    onUpvote: (postId: number) => Promise<void>;
    onStatusChange: (postId: number, status: 'Open' | 'In Progress' | 'Closed') => void;
    onIssueClick: (postId: number) => void;
}

export const IssueList = ({
                              project,
                              filterType,
                              viewMode,
                              votingPosts = new Set(),
                              onFilterChange,
                              onUpvote,
                              onStatusChange,
                              onIssueClick,
                          }: IssueListProps) => {
    const [draggedPost, setDraggedPost] = useState<number | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    const [posts, setPosts] = useState<Post[]>([]);
    const [kanbanData, setKanbanData] = useState<any>(null);
    const [pagination, setPagination] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [columnPages, setColumnPages] = useState({
        'Open': 1,
        'In Progress': 1,
        'Closed': 1
    });
    const [uniqueAssignees, setUniqueAssignees] = useState<any[]>([]);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const loadPosts = useCallback(async (page: number = 1, resetPage: boolean = false, silent: boolean = false) => {
        if (viewMode === 'kanban') {
            return loadKanbanData(undefined, undefined, silent);
        }

        if (!silent) {
            setIsLoading(true);
        }
        try {
            const params: any = {
                page: resetPage ? 1 : page,
                limit: 25,
                status: filterType === 'all' ? undefined : filterType,
                search: debouncedSearchQuery || undefined,
                priority: priorityFilter === 'all' ? undefined : priorityFilter,
                issue_type: typeFilter === 'all' ? undefined : typeFilter,
                assignee_id: assigneeFilter === 'all' ? undefined : assigneeFilter,
                sort: sortBy,
                order: sortOrder,
                view_mode: 'list',
            };

            const response = await postsApi.getAll(project.id, params);
            setPosts(response.posts);
            setPagination(response.pagination);

            if (resetPage) {
                setCurrentPage(1);
            } else {
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
            setPosts([]);
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    }, [project.id, filterType, debouncedSearchQuery, priorityFilter, typeFilter, assigneeFilter, sortBy, sortOrder, viewMode]);

    const loadKanbanData = useCallback(async (columnToUpdate?: string, page?: number, silent: boolean = false) => {
        if (columnToUpdate) {
            setLoadingColumns(prev => new Set(prev).add(columnToUpdate));
        } else if (!silent) {
            setIsLoading(true);
        }

        try {
            const params: any = {
                search: debouncedSearchQuery || undefined,
                priority: priorityFilter === 'all' ? undefined : priorityFilter,
                issue_type: typeFilter === 'all' ? undefined : typeFilter,
                assignee_id: assigneeFilter === 'all' ? undefined : assigneeFilter,
                column_page: columnToUpdate ? (page || columnPages[columnToUpdate as keyof typeof columnPages]) : 1,
                column_limit: 20,
            };

            const response = await postsApi.getKanban(project.id, params);

            if (columnToUpdate && page && page > 1) {
                setKanbanData((prev: any) => {
                    if (!prev) return response;

                    return {
                        ...response,
                        columns: {
                            ...prev.columns,
                            [columnToUpdate]: {
                                ...response.columns[columnToUpdate as keyof typeof response.columns],
                                posts: [
                                    ...prev.columns[columnToUpdate].posts,
                                    ...response.columns[columnToUpdate as keyof typeof response.columns].posts
                                ]
                            }
                        }
                    };
                });
                setColumnPages(prev => ({
                    ...prev,
                    [columnToUpdate]: page
                }));
            } else {
                setKanbanData(response);
                if (!silent) {
                    setColumnPages({'Open': 1, 'In Progress': 1, 'Closed': 1});
                }
            }
        } catch (error) {
            console.error('Failed to load kanban data:', error);
            setKanbanData(null);
        } finally {
            if (columnToUpdate) {
                setLoadingColumns(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(columnToUpdate);
                    return newSet;
                });
            } else if (!silent) {
                setIsLoading(false);
            }
        }
    }, [project.id, debouncedSearchQuery, priorityFilter, typeFilter, assigneeFilter, columnPages]);

    const loadUniqueAssignees = useCallback(async () => {
        try {
            const response = await postsApi.getAll(project.id, {
                limit: 1000,
                view_mode: 'list'
            });

            const assignees = response.posts
                .filter(post => post.assignee)
                .map(post => post.assignee!)
                .filter((assignee, index, self) =>
                    index === self.findIndex(a => a.id === assignee.id)
                );

            setUniqueAssignees(assignees);
        } catch (error) {
            console.error('Failed to load assignees:', error);
        }
    }, [project.id]);

    useEffect(() => {
        loadPosts(1, true);
    }, [filterType, debouncedSearchQuery, priorityFilter, typeFilter, assigneeFilter, sortBy, sortOrder, viewMode]);

    useEffect(() => {
        loadUniqueAssignees();
    }, [loadUniqueAssignees]);

    const handleDragStart = (e: React.DragEvent, postId: number) => {
        setDraggedPost(postId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnd = () => {
        setDraggedPost(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, columnStatus: 'Open' | 'In Progress' | 'Closed') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverColumn(columnStatus);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverColumn(null);
        }
    };

    const handleDrop = async (e: React.DragEvent, newStatus: 'Open' | 'In Progress' | 'Closed') => {
        e.preventDefault();
        if (draggedPost) {
            await onStatusChange(draggedPost, newStatus);
            setDraggedPost(null);
            setDragOverColumn(null);
            if (viewMode === 'kanban') {
                loadKanbanData(undefined, undefined, true);
            } else {
                loadPosts(currentPage, true);
            }
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setPriorityFilter('all');
        setTypeFilter('all');
        setAssigneeFilter('all');
        setSortBy('created_at');
        setSortOrder('DESC');
    };

    const hasActiveFilters = searchQuery || priorityFilter !== 'all' || typeFilter !== 'all' || assigneeFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'DESC';

    const handlePageChange = (page: number) => {
        loadPosts(page);
    };

    const handleLoadMoreInColumn = (columnStatus: string) => {
        const nextPage = columnPages[columnStatus as keyof typeof columnPages] + 1;

        const columnElement = document.querySelector(`[data-column="${columnStatus}"]`);
        const scrollTop = columnElement?.scrollTop || 0;

        loadKanbanData(columnStatus, nextPage).then(() => {
            setTimeout(() => {
                if (columnElement) {
                    columnElement.scrollTop = scrollTop;
                }
            }, 50);
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

    const kanbanColumns = [
        {id: 'open', title: 'Open', status: 'Open' as const},
        {id: 'in-progress', title: 'In Progress', status: 'In Progress' as const},
        {id: 'closed', title: 'Closed', status: 'Closed' as const},
    ];

    const getPostsByStatus = (status: string) => {
        if (viewMode === 'kanban' && kanbanData) {
            return kanbanData.columns[status]?.posts || [];
        }
        return posts.filter(post => post.status === status);
    };

    const getColumnInfo = (status: string) => {
        if (viewMode === 'kanban' && kanbanData) {
            return kanbanData.columns[status] || {total: 0, hasMore: false};
        }
        return {total: posts.filter(post => post.status === status).length, hasMore: false};
    };

    const renderPagination = () => {
        if (!pagination || viewMode !== 'list') return null;

        const {page, totalPages, hasNext, hasPrev} = pagination;

        return (
            <div className="flex items-center justify-between px-2 py-3 mt-6">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>
                        Page {page} of {totalPages} ({pagination.total} total issues)
                    </span>
                </div>
                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={!hasPrev || isLoading}
                    >
                        <ChevronsLeft className="h-4 w-4"/>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!hasPrev || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!hasNext || isLoading}
                    >
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={!hasNext || isLoading}
                    >
                        <ChevronsRight className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <main className="container py-6 px-4">
            <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                    <ProjectLogo project={project} size="sm"/>
                    <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                </div>
                <p className="text-muted-foreground">{project.description}</p>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                    Issues ({
                    viewMode === 'kanban' && kanbanData
                        ? kanbanData.columns['Open'].total + kanbanData.columns['In Progress'].total + kanbanData.columns['Closed'].total
                        : pagination?.total || posts.length
                })
                </h2>
                <div className="flex items-center space-x-1">
                    <Button
                        variant={filterType === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFilterChange("all")}
                        className={
                            filterType === "all"
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border-border text-muted-foreground hover:bg-accent hover:border-accent-foreground bg-transparent"
                        }
                    >
                        All
                    </Button>
                    <Button
                        variant={filterType === "open" ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFilterChange("open")}
                        className={
                            filterType === "open"
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border-border text-muted-foreground hover:bg-accent hover:border-accent-foreground bg-transparent"
                        }
                    >
                        Open
                    </Button>
                    <Button
                        variant={filterType === "closed" ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFilterChange("closed")}
                        className={
                            filterType === "closed"
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border-border text-muted-foreground hover:bg-accent hover:border-accent-foreground bg-transparent"
                        }
                    >
                        Closed
                    </Button>
                </div>
            </div>

            <div className="mb-6 space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                        <Input
                            placeholder="Search issues by title, description, author, assignee, or labels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background border-border"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3"/>
                            </Button>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="border-border text-muted-foreground hover:bg-accent"
                        >
                            <X className="h-3 w-3 mr-1"/>
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-muted-foreground"/>
                        <span className="text-sm text-muted-foreground">Filters:</span>
                    </div>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[120px] h-8 bg-background border-border">
                            <SelectValue placeholder="Priority"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[110px] h-8 bg-background border-border">
                            <SelectValue placeholder="Type"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Bug">Bug</SelectItem>
                            <SelectItem value="Feature">Feature</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger className="w-[130px] h-8 bg-background border-border">
                            <SelectValue placeholder="Assignee"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Assignees</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {uniqueAssignees.map((assignee) => (
                                <SelectItem key={assignee.id} value={assignee.id.toString()}>
                                    {assignee.username}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {viewMode === 'list' && (
                        <>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[120px] h-8 bg-background border-border">
                                    <SelectValue placeholder="Sort by"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="created_at">Created</SelectItem>
                                    <SelectItem value="updated_at">Updated</SelectItem>
                                    <SelectItem value="title">Title</SelectItem>
                                    <SelectItem value="vote_count">Votes</SelectItem>
                                    <SelectItem value="priority">Priority</SelectItem>
                                    <SelectItem value="due_date">Due Date</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortOrder}
                                    onValueChange={(value: string) => setSortOrder(value as 'ASC' | 'DESC')}>
                                <SelectTrigger className="w-[90px] h-8 bg-background border-border">
                                    <SelectValue placeholder="Order"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DESC">Desc</SelectItem>
                                    <SelectItem value="ASC">Asc</SelectItem>
                                </SelectContent>
                            </Select>
                        </>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin"/>
                    <span className="ml-2 text-muted-foreground">Loading issues...</span>
                </div>
            )}

            {!isLoading && viewMode === "list" && (
                <div className="space-y-2">
                    {posts.map((post) => (
                        <Card
                            key={post.id}
                            className="hover:shadow-lg transition-shadow bg-card border-border hover:border-accent backdrop-blur-sm hover:bg-accent/5 cursor-pointer py-0"
                            onClick={() => onIssueClick(post.id)}
                        >
                            <CardContent className="p-3">
                                <div className="flex items-center space-x-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={votingPosts.has(post.id)}
                                        className="flex-col h-auto p-1.5 min-w-[50px] text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await onUpvote(post.id);
                                            loadPosts(currentPage, true);
                                        }}
                                    >
                                        {votingPosts.has(post.id) ? (
                                            <Loader2 className="h-3.5 w-3.5 mb-0.5 animate-spin"/>
                                        ) : (
                                            <ArrowUpFromLine className="h-3.5 w-3.5 mb-0.5"/>
                                        )}
                                        <span className="text-xs font-medium">{post.vote_count || 0}</span>
                                    </Button>

                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(post.status)}
                                        <PriorityBadge priority={post.priority || 'Medium'} size="sm"/>
                                        <IssueTypeBadge issueType={post.issue_type || 'Bug'} size="sm"/>
                                        {post.is_private && (
                                            <div title="Private Issue">
                                                <Lock className="h-3 w-3 text-orange-400"/>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm leading-tight mb-1 text-card-foreground">{post.title}</h3>
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                                            <Avatar className="h-4 w-4">
                                                <AvatarImage src={post.author?.profile_picture || undefined}
                                                             alt={post.author?.username || 'User'}/>
                                                <AvatarFallback
                                                    className="text-[10px] bg-secondary text-secondary-foreground">
                                                    {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{post.author?.username || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                            {post.assignee && (
                                                <div className="flex items-center space-x-1">
                                                    <Avatar className="h-3 w-3">
                                                        <AvatarImage src={post.assignee?.profile_picture || undefined}
                                                                     alt={post.assignee?.username || 'User'}/>
                                                        <AvatarFallback
                                                            className="text-[8px] bg-secondary text-secondary-foreground">
                                                            {post.assignee?.username?.charAt(0).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{post.assignee.username}</span>
                                                </div>
                                            )}
                                            {post.story_points && (
                                                <div className="flex items-center space-x-1">
                                                    <Target className="h-3 w-3"/>
                                                    <span>{post.story_points} pts</span>
                                                </div>
                                            )}
                                            {post.due_date && (
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="h-3 w-3"/>
                                                    <span>{new Date(post.due_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {post.sub_issue_count && post.sub_issue_count > 0 && (
                                                <div className="flex items-center space-x-1">
                                                    <GitBranch className="h-3 w-3"/>
                                                    <span>{post.sub_issues_closed_count || 0}/{post.sub_issue_count} sub-issues</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {renderPagination()}
                </div>
            )}

            {!isLoading && viewMode === "kanban" && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {kanbanColumns.map((column) => {
                            const columnInfo = getColumnInfo(column.status);
                            const columnPosts = getPostsByStatus(column.status);

                            return (
                                <div key={column.id} className="space-y-3">
                                    <div className="flex items-center space-x-2 mb-4">
                                        {getStatusIcon(column.status)}
                                        <h3 className="font-semibold text-foreground">{column.title}</h3>
                                        <Badge variant="secondary"
                                               className="bg-secondary text-secondary-foreground border-border">
                                            {columnInfo.total}
                                        </Badge>
                                        {column.status === 'Closed' && kanbanData?.columns['Closed'].note && (
                                            <span className="text-xs text-muted-foreground">
                                                (showing {kanbanData.columns['Closed'].totalShowing})
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        data-column={column.status}
                                        className={`space-y-3 min-h-[400px] max-h-[70vh] bg-muted/30 rounded-lg p-4 border-2 transition-colors backdrop-blur-sm overflow-y-auto custom-scrollbar ${
                                            dragOverColumn === column.status
                                                ? "border-primary/60 bg-primary/10"
                                                : "border-border border-dashed"
                                        }`}
                                        onDragOver={(e) => handleDragOver(e, column.status)}
                                        onDragLeave={(e) => handleDragLeave(e)}
                                        onDrop={(e) => handleDrop(e, column.status)}
                                    >
                                        {columnPosts.map((post: Post) => (
                                            <Card
                                                key={post.id}
                                                className={`cursor-move transition-shadow bg-card border-border hover:border-accent backdrop-blur-sm hover:bg-accent/5 py-0 hover:shadow-lg ${
                                                    draggedPost === post.id ? "opacity-50 rotate-2 scale-105" : ""
                                                }`}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, post.id)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => onIssueClick(post.id)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <h4 className="font-medium text-sm leading-tight text-card-foreground pr-2">{post.title}</h4>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={votingPosts.has(post.id)}
                                                                className="flex-col h-auto p-1 min-w-[40px] text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await onUpvote(post.id);
                                                                    loadKanbanData(undefined, undefined, true);
                                                                }}
                                                            >
                                                                {votingPosts.has(post.id) ? (
                                                                    <Loader2 className="h-3 w-3 mb-0.5 animate-spin"/>
                                                                ) : (
                                                                    <ArrowUpFromLine className="h-3 w-3 mb-0.5"/>
                                                                )}
                                                                <span
                                                                    className="text-xs font-medium">{post.vote_count || 0}</span>
                                                            </Button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <PriorityBadge priority={post.priority || 'Medium'}
                                                                               size="sm"/>
                                                                <IssueTypeBadge issueType={post.issue_type || 'Bug'}
                                                                                size="sm"/>
                                                                {post.is_private && (
                                                                    <div title="Private Issue">
                                                                        <Lock className="h-3 w-3 text-orange-400"/>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div
                                                                className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                                <Avatar className="h-3 w-3">
                                                                    <AvatarImage
                                                                        src={post.author?.profile_picture || undefined}
                                                                        alt={post.author?.username || 'User'}/>
                                                                    <AvatarFallback
                                                                        className="text-[8px] bg-secondary text-secondary-foreground">
                                                                        {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span
                                                                    className="truncate max-w-[80px]">{post.author?.username || 'Unknown'}</span>
                                                            </div>
                                                        </div>

                                                        {(post.assignee || post.story_points || post.due_date || (post.sub_issue_count && post.sub_issue_count > 0)) && (
                                                            <div
                                                                className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                                                                <div className="flex items-center space-x-2">
                                                                    {post.assignee && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <User className="h-3 w-3"/>
                                                                            <span
                                                                                className="truncate max-w-[60px]">{post.assignee.username}</span>
                                                                        </div>
                                                                    )}
                                                                    {post.story_points && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <Target className="h-3 w-3"/>
                                                                            <span>{post.story_points}</span>
                                                                        </div>
                                                                    )}
                                                                    {post.sub_issue_count && post.sub_issue_count > 0 && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <GitBranch className="h-3 w-3"/>
                                                                            <span
                                                                                className="text-[10px]">{post.sub_issues_closed_count || 0}/{post.sub_issue_count}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {post.due_date && (
                                                                    <div className="flex items-center space-x-1">
                                                                        <Calendar className="h-3 w-3"/>
                                                                        <span>{new Date(post.due_date).toLocaleDateString()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {columnInfo.hasMore && (
                                            <div className="flex flex-col items-center pt-2 space-y-2">
                                                {loadingColumns.has(column.status) && (
                                                    <div
                                                        className="flex items-center space-x-2 text-xs text-muted-foreground">
                                                        <Loader2 className="h-3 w-3 animate-spin"/>
                                                        <span>Loading more...</span>
                                                    </div>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleLoadMoreInColumn(column.status)}
                                                    disabled={loadingColumns.has(column.status)}
                                                    className="text-xs w-full"
                                                >
                                                    Load More ({columnInfo.total - columnPosts.length} remaining)
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </main>
    );
}
