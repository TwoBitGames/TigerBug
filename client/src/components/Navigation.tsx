import {ArrowLeft, ChevronDown, Shield, User, LogOut, LogIn, Plus, List, LayoutGrid} from 'lucide-react';
import {Button} from './ui/button';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {useAuth} from '../contexts/AuthContext';
import {LoginDialog} from './LoginDialog';
import type {Project} from '../types';

interface NavigationProps {
    selectedProject: Project | null;
    setSelectedProject: (project: Project | null) => void;
    viewMode?: 'list' | 'kanban';
    onViewModeChange?: (mode: 'list' | 'kanban') => void;
    onCreateIssue?: () => void;
}

export const Navigation = ({
                               selectedProject,
                               setSelectedProject,
                               viewMode = 'list',
                               onViewModeChange,
                               onCreateIssue,
                           }: NavigationProps) => {
    const {user, logout, isAuthenticated} = useAuth();

    const handleBackToProjects = () => {
        setSelectedProject(null);
    };

    return (
        <nav
            className="border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-900/60">
            <div className="container flex h-14 items-center px-4">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-purple-500">TigerBug</h1>

                    {selectedProject && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToProjects}
                            className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            Back to Projects
                        </Button>
                    )}
                </div>

                <div className="ml-auto flex items-center space-x-4">
                    {selectedProject && (
                        <>
                            {onViewModeChange && (
                                <div
                                    className="flex items-center border border-zinc-700/60 rounded-lg bg-zinc-800/60 p-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewModeChange('list')}
                                        className={`h-7 px-3 ${
                                            viewMode === 'list'
                                                ? 'bg-zinc-700 text-zinc-100'
                                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60'
                                        }`}
                                    >
                                        <List className="h-3.5 w-3.5 mr-1.5"/>
                                        List
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewModeChange('kanban')}
                                        className={`h-7 px-3 ${
                                            viewMode === 'kanban'
                                                ? 'bg-zinc-700 text-zinc-100'
                                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60'
                                        }`}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5 mr-1.5"/>
                                        Kanban
                                    </Button>
                                </div>
                            )}

                            {isAuthenticated && onCreateIssue && (
                                <Button
                                    onClick={onCreateIssue}
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2"/>
                                    Create Issue
                                </Button>
                            )}
                        </>
                    )}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center space-x-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src="/placeholder.svg?height=24&width=24"
                                                     alt={user?.email || 'User'}/>
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
                    ) : (
                        <LoginDialog>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-transparent border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                            >
                                <LogIn className="h-4 w-4 mr-2"/>
                                Sign In
                            </Button>
                        </LoginDialog>
                    )}
                </div>
            </div>
        </nav>
    );
}
