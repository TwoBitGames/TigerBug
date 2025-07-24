import {ChevronUp, Circle, Clock, CheckCircle} from 'lucide-react';
import {Button} from './ui/button';
import {Card, CardContent} from './ui/card';
import {Badge} from './ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import type {Post, Project} from '../types';
import {useState} from 'react';

interface IssueListProps {
    project: Project;
    posts: Post[];
    filterType: 'all' | 'open' | 'closed';
    viewMode: 'list' | 'kanban';
    onFilterChange: (filter: 'all' | 'open' | 'closed') => void;
    onUpvote: (postId: number) => void;
    onStatusChange: (postId: number, status: 'Offen' | 'In Arbeit' | 'Geschlossen') => void;
    onIssueClick: (postId: number) => void;
}

export const IssueList = ({
                              project,
                              posts,
                              filterType,
                              viewMode,
                              onFilterChange,
                              onUpvote,
                              onStatusChange,
                              onIssueClick,
                          }: IssueListProps) => {
    const [draggedPost, setDraggedPost] = useState<number | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, postId: number) => {
        setDraggedPost(postId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, columnStatus: 'Offen' | 'In Arbeit' | 'Geschlossen') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverColumn(columnStatus);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, newStatus: 'Offen' | 'In Arbeit' | 'Geschlossen') => {
        e.preventDefault();
        if (draggedPost) {
            onStatusChange(draggedPost, newStatus);
            setDraggedPost(null);
            setDragOverColumn(null);
        }
    };
    const filteredPosts = posts.filter(post => {
        if (filterType === 'all') return true;
        if (filterType === 'open') return post.status === 'Offen' || post.status === 'In Arbeit';
        if (filterType === 'closed') return post.status === 'Geschlossen';
        return true;
    }).sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Offen':
                return <Circle className="h-4 w-4 text-red-400"/>;
            case 'In Arbeit':
                return <Clock className="h-4 w-4 text-orange-400"/>;
            case 'Geschlossen':
                return <CheckCircle className="h-4 w-4 text-green-400"/>;
            default:
                return <Circle className="h-4 w-4 text-gray-400"/>;
        }
    };

    const getTypeColor = (title: string) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('bug') || lowerTitle.includes('error') || lowerTitle.includes('crash') || lowerTitle.includes('issue')) {
            return "bg-red-500/20 text-red-300 border-red-500/40";
        }
        return "bg-primary/20 text-primary border-primary/40";
    };

    const getPostType = (title: string) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('bug') || lowerTitle.includes('error') || lowerTitle.includes('crash') || lowerTitle.includes('issue')) {
            return 'Bug';
        }
        return 'Feature';
    };

    const kanbanColumns = [
        {id: 'open', title: 'Open', status: 'Offen' as const},
        {id: 'in-progress', title: 'In Progress', status: 'In Arbeit' as const},
        {id: 'closed', title: 'Closed', status: 'Geschlossen' as const},
    ];

    const getPostsByStatus = (status: string) => {
        return filteredPosts.filter(post => post.status === status);
    };

    return (
        <main className="container py-6 px-4">
            <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                    <div
                        className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-semibold">
              {project.name.charAt(0).toUpperCase()}
            </span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                </div>
                <p className="text-muted-foreground">{project.description}</p>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Issues ({filteredPosts.length})</h2>
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

            {viewMode === "list" && (
                <div className="space-y-2">
                    {filteredPosts.map((post) => (
                        <Card
                            key={post.id}
                            className="hover:shadow-xl transition-all bg-card/60 border-border hover:border-accent backdrop-blur-sm hover:bg-card/80 cursor-pointer py-0"
                            onClick={() => onIssueClick(post.id)}
                        >
                            <CardContent className="p-2 px-2">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-col h-auto p-1 min-w-[40px] text-muted-foreground hover:text-foreground hover:bg-accent"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpvote(post.id);
                                        }}
                                    >
                                        <ChevronUp className="h-3 w-3 mb-0.5"/>
                                        <span className="text-xs font-medium">{post.vote_count || 0}</span>
                                    </Button>

                                    <div className="flex items-center space-x-1.5">
                                        {getStatusIcon(post.status)}
                                        <Badge variant="secondary"
                                               className={`${getTypeColor(post.title)} text-xs px-1.5 py-0`}>
                                            {getPostType(post.title)}
                                        </Badge>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm leading-tight mb-0.5 text-card-foreground">{post.title}</h3>
                                        <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                                            <Avatar className="h-3 w-3">
                                                <AvatarImage src="/placeholder.svg" alt={post.author?.email || 'User'}/>
                                                <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">
                                                    {post.author?.email?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{post.author?.email || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {viewMode === "kanban" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kanbanColumns.map((column) => (
                        <div key={column.id} className="space-y-3">
                            <div className="flex items-center space-x-2 mb-4">
                                {getStatusIcon(column.status)}
                                <h3 className="font-semibold text-foreground">{column.title}</h3>
                                <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-border">
                                    {getPostsByStatus(column.status).length}
                                </Badge>
                            </div>
                            <div
                                className={`space-y-3 min-h-[400px] bg-secondary/40 rounded-lg p-4 border-2 transition-all backdrop-blur-sm ${
                                    dragOverColumn === column.status
                                        ? "border-purple-500/60 bg-purple-950/20"
                                        : "border-border border-dashed"
                                }`}
                                onDragOver={(e) => handleDragOver(e, column.status)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, column.status)}
                            >
                                {getPostsByStatus(column.status).map((post) => (
                                    <Card
                                        key={post.id}
                                        className={`cursor-move transition-all bg-card/60 border-border hover:border-accent backdrop-blur-sm hover:bg-card/80 py-0 ${
                                            draggedPost === post.id ? "opacity-50 rotate-2 scale-105" : ""
                                        }`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, post.id)}
                                        onClick={() => onIssueClick(post.id)}
                                    >
                                        <CardContent className="p-2 px-2">
                                            <div className="space-y-1.5">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-medium text-sm leading-tight text-card-foreground pr-2">{post.title}</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex-col h-auto p-0.5 min-w-[32px] text-muted-foreground hover:text-foreground hover:bg-accent"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpvote(post.id);
                                                        }}
                                                    >
                                                        <ChevronUp className="h-2.5 w-2.5 mb-0.5"/>
                                                        <span
                                                            className="text-[10px] font-medium">{post.vote_count || 0}</span>
                                                    </Button>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <Badge variant="secondary"
                                                           className={`${getTypeColor(post.title)} text-xs px-1.5 py-0`}>
                                                        {getPostType(post.title)}
                                                    </Badge>
                                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                        <Avatar className="h-2.5 w-2.5">
                                                            <AvatarImage src="/placeholder.svg"
                                                                         alt={post.author?.email || 'User'}/>
                                                            <AvatarFallback
                                                                className="text-[7px] bg-secondary text-secondary-foreground">
                                                                {post.author?.email?.charAt(0).toUpperCase() || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span
                                                            className="truncate max-w-[80px]">{post.author?.email?.split('@')[0] || 'Unknown'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
