import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProjectList } from '../components/ProjectList';
import { projectsApi } from '../services/api';
import type { Project } from '../types';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

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

  if (isLoadingProjects) {
    return (
      <div className="container py-8 px-4 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
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
      />
    </div>
  );
};
