import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card';
import type {Project} from '../types';

interface ProjectListProps {
    projects: Project[];
    onProjectSelect: (projectId: number) => void;
}

export const ProjectList = ({projects, onProjectSelect}: ProjectListProps) => {
    return (
        <main className="container py-8 px-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.isArray(projects) && projects.map((project) => (
                    <Card
                        key={project.id}
                        className="cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] bg-card/60 border-border hover:border-accent backdrop-blur-sm hover:bg-card/80"
                        onClick={() => onProjectSelect(project.id)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle
                                        className="text-lg leading-tight text-card-foreground">{project.name}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                                {project.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}

                {!Array.isArray(projects) || projects.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                        <p className="text-muted-foreground">No projects available</p>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
