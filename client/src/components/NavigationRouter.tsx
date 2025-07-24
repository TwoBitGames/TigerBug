import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Shield, User, LogOut, LogIn, Plus, List, LayoutGrid } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { useViewMode } from '../contexts/ViewModeContext';
import { LoginDialog } from './LoginDialog';
import { projectsApi } from '../services/api';
import type { Project } from '../types';

export const NavigationRouter = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { viewMode, setViewMode } = useViewMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  
  const [project, setProject] = useState<Project | null>(null);

  // Load project data when projectId changes
  useEffect(() => {
    if (projectId) {
      loadProject();
    } else {
      setProject(null);
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    
    try {
      const projects = await projectsApi.getAll();
      const foundProject = projects.find((p: Project) => p.id === parseInt(projectId));
      setProject(foundProject || null);
    } catch (error) {
      console.error('Failed to load project:', error);
      setProject(null);
    }
  };

  const handleBackToProjects = () => {
    navigate('/');
  };

  const handleCreateIssue = () => {
    if (project) {
      navigate(`/projects/${project.id}/create-issue`);
    }
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const isInProject = location.pathname.includes('/projects/') && project;
  const isInProjectList = location.pathname.includes('/projects/') && !location.pathname.includes('/issues/');

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleBackToProjects}>
            <img src="/favicon.png" alt="TigerBug" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-primary">TigerBug</h1>
          </div>

          {isInProject && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToProjects}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2"/>
              Back to Projects
            </Button>
          )}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {isInProject && isInProjectList && (
            <>
              <div className="flex items-center border border-border rounded-lg bg-secondary p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-7 px-3 ${
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <List className="h-3.5 w-3.5 mr-1.5"/>
                  List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={`h-7 px-3 ${
                    viewMode === 'kanban'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5"/>
                  Kanban
                </Button>
              </div>

              {isAuthenticated && (
                <Button
                  onClick={handleCreateIssue}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" alt={user?.email || 'User'}/>
                    <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user?.email}</span>
                  <ChevronDown className="h-3 w-3"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-popover border-border backdrop-blur-xl" align="end">
                {user?.is_admin && (
                  <DropdownMenuItem 
                    className="text-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={handleAdminClick}
                  >
                    <Shield className="h-4 w-4 mr-2"/>
                    Admin Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-foreground focus:bg-accent focus:text-accent-foreground">
                  <User className="h-4 w-4 mr-2"/>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border"/>
                <DropdownMenuItem
                  className="text-foreground focus:bg-accent focus:text-accent-foreground"
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
                className="bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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
};
