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
                        className="cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] bg-zinc-800/60 border-zinc-700/60 hover:border-zinc-600/60 backdrop-blur-sm hover:bg-zinc-800/80"
                        onClick={() => onProjectSelect(project.id)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="h-10 w-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-purple-400 font-semibold text-lg">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle
                                        className="text-lg leading-tight text-zinc-100">{project.name}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <CardDescription className="text-sm leading-relaxed text-zinc-400">
                                {project.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}

                {!Array.isArray(projects) || projects.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                        <p className="text-zinc-400">No projects available</p>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
