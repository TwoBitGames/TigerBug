import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useBranding} from '../contexts/BrandingContext';
import {ProjectList} from '../components/ProjectList';
import {projectsApi} from '../services/api';
import type {Project} from '../types';

export const HomePage = () => {
    const {isAuthenticated} = useAuth();
    const {brandingConfig} = useBranding();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (brandingConfig?.app_name) {
            document.title = brandingConfig.app_name;
        }
    }, [brandingConfig]);

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
                <div
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="container py-8 px-4">
            {brandingConfig?.banner_url && (
                <div className="mb-10">
                    <img
                        src={brandingConfig.banner_url}
                        alt={`${brandingConfig.app_name} banner`}
                        className="w-4/5 mx-auto rounded-lg object-cover max-h-64"
                    />
                </div>
            )}

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
