import { useState } from 'react';
import type { Project } from '@/types';

interface ProjectLogoProps {
    project: Project;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ProjectLogo({ project, size = 'md', className = '' }: ProjectLogoProps) {
    const [imageError, setImageError] = useState(false);
    
    const sizeClasses = {
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-lg', 
        lg: 'h-16 w-16 text-2xl'
    };
    
    const sizeClass = sizeClasses[size];
    
    const handleImageError = () => {
        setImageError(true);
    };
    
    return (
        <div className={`${sizeClass} rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden ${className}`}>
            {project.logo_url && !imageError ? (
                <img 
                    src={project.logo_url} 
                    alt={`${project.name} logo`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                />
            ) : (
                <span className="text-primary font-semibold">
                    {project.name.charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    );
}
