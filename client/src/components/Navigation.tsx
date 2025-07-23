import {ArrowLeft, Plus, List, Columns, ChevronDown, Shield, User, LogOut} from 'lucide-react';
import {Button} from './ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from './ui/select';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {useAuth} from '../contexts/AuthContext';
import type {Project} from '../types';

interface NavigationProps {
    selectedProject: number | null;
    projects: Project[];
    showCreateIssue: boolean;
    viewMode: 'list' | 'kanban';
    onProjectSelect: (projectId: number | null) => void;
    onBackToProjects: () => void;
    onBackFromCreateIssue: () => void;
    onCreateIssue: () => void;
    onViewModeChange: (mode: 'list' | 'kanban') => void;
    onShowAdminDashboard: () => void;
}

export function Navigation({
                               selectedProject,
                               projects,
                               showCreateIssue,
                               viewMode,
                               onProjectSelect,
                               onBackToProjects,
                               onBackFromCreateIssue,
                               onCreateIssue,
                               onViewModeChange,
                               onShowAdminDashboard,
                           }: NavigationProps) {
    const {user, logout} = useAuth();

    return (
        <nav
            className="border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-900/60">
            <div className="container flex h-14 items-center px-4">
                <div className="flex items-center space-x-4">
                    {(selectedProject || showCreateIssue) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={showCreateIssue ? onBackFromCreateIssue : onBackToProjects}
                            className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            {showCreateIssue ? 'Back' : 'Projects'}
                        </Button>
                    )}
                    {(selectedProject || showCreateIssue) && (
                        <Select
                            value={selectedProject?.toString() || ''}
                            onValueChange={(value) => onProjectSelect(value ? parseInt(value) : null)}
                        >
                            <SelectTrigger
                                className="w-[200px] bg-zinc-800/60 border-zinc-700/60 text-zinc-100 hover:bg-zinc-700/80">
                                <SelectValue placeholder="Select a project"/>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700/60 backdrop-blur-xl">
                                {Array.isArray(projects) && projects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={project.id.toString()}
                                        className="text-zinc-100 focus:bg-zinc-600 focus:text-zinc-100"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span>{project.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="ml-auto flex items-center space-x-4">
                    {selectedProject && !showCreateIssue && (
                        <>
                            <div
                                className="flex items-center space-x-1 mr-2 bg-zinc-800/40 rounded-lg p-1 border border-zinc-700/40">
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => onViewModeChange("list")}
                                    className={
                                        viewMode === "list"
                                            ? "bg-purple-600 text-white hover:bg-purple-700"
                                            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60"
                                    }
                                >
                                    <List className="h-4 w-4"/>
                                </Button>
                                <Button
                                    variant={viewMode === "kanban" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => onViewModeChange("kanban")}
                                    className={
                                        viewMode === "kanban"
                                            ? "bg-purple-600 text-white hover:bg-purple-700"
                                            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60"
                                    }
                                >
                                    <Columns className="h-4 w-4"/>
                                </Button>
                            </div>
                            <Button
                                size="sm"
                                onClick={onCreateIssue}
                                className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                            >
                                <Plus className="h-4 w-4 mr-2"/>
                                New Issue
                            </Button>
                        </>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center space-x-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                            >
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src="/placeholder.svg?height=24&width=24" alt={user?.email || 'User'}/>
                                    <AvatarFallback className="text-xs bg-zinc-700 text-zinc-300">
                                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{user?.email}</span>
                                <ChevronDown className="h-3 w-3"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 bg-zinc-800 border-zinc-700/60 backdrop-blur-xl"
                                             align="end">
                            {user?.is_admin && (
                                <DropdownMenuItem
                                    className="text-zinc-100 focus:bg-zinc-600 focus:text-zinc-100"
                                    onClick={onShowAdminDashboard}
                                >
                                    <Shield className="h-4 w-4 mr-2"/>
                                    Admin Settings
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-zinc-100 focus:bg-zinc-600 focus:text-zinc-100">
                                <User className="h-4 w-4 mr-2"/>
                                Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-700/60"/>
                            <DropdownMenuItem
                                className="text-zinc-100 focus:bg-zinc-600 focus:text-zinc-100"
                                onClick={logout}
                            >
                                <LogOut className="h-4 w-4 mr-2"/>
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
