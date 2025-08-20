import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CreateIssue } from '../components/CreateIssue';
import { useAuth } from '../contexts/AuthContext';
import { projectsApi, postsApi, attachmentsApi, authApi } from '../services/api';
import type { Project, CreatePostData, Post } from '../types';

export const CreateIssuePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [parentIssue, setParentIssue] = useState<Post | null>(null);
  const [isLoadingParent, setIsLoadingParent] = useState(false);

  useEffect(() => {
    if (!projectId) {
      navigate('/');
      return;
    }
    loadProjects();

    const parentId = searchParams.get('parent');
    if (parentId) {
      loadParentIssue(parseInt(parentId));
    }
  }, [projectId, navigate, searchParams]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const [projectData, membershipsData] = await Promise.all([
        projectsApi.getAll(),
        user ? authApi.getUserProjectMemberships() : Promise.resolve({ projectIds: [] })
      ]);

      const allProjects = Array.isArray(projectData) ? projectData : [];
      const membershipIds = membershipsData.projectIds || [];
      
      setProjects(allProjects);
      
      const filtered = allProjects.filter(project => {
        if (user?.is_admin) {
          return true;
        }
        if (!project.disable_issue_creation) {
          return true;
        }
        return membershipIds.includes(project.id);
      });
      
      setFilteredProjects(filtered);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadParentIssue = async (issueId: number) => {
    setIsLoadingParent(true);
    try {
      const issue = await postsApi.getById(parseInt(projectId!), issueId);
      setParentIssue(issue);
    } catch (error) {
      console.error('Failed to load parent issue:', error);
    } finally {
      setIsLoadingParent(false);
    }
  };

  const handleSubmitIssue = async (selectedProjectId: number, data: CreatePostData, files: File[]) => {
    try {
      const createdPost = await postsApi.create(selectedProjectId, data);
      if (files.length > 0) {
        try {
          await attachmentsApi.upload(files, 'post', createdPost.id);
        } catch (uploadError) {
          console.error('Failed to upload attachments:', uploadError);
        }
      }

      navigate(`/projects/${selectedProjectId}`);
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/');
    }
  };

  if (!projectId) {
    return null;
  }

  if (isLoadingProjects || isLoadingParent) {
    return (
      <div className="container py-8 px-4 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <CreateIssue
        projects={filteredProjects}
        selectedProject={parseInt(projectId)}
        parentIssue={parentIssue}
        onSubmit={handleSubmitIssue}
        onCancel={handleCancel}
      />
    </div>
  );
};
