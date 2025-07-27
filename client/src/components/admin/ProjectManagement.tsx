import {useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Label} from '../ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../ui/table';
import {Textarea} from '../ui/textarea';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '../ui/dialog';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '../ui/dropdown-menu';
import {ProjectLogo} from '../ui/project-logo';
import {useDialog} from '../../contexts/DialogContext';
import {adminApi, projectsApi} from '@/services/api.ts';
import type {Project, ProjectMembership, CreateProjectData, User} from '@/types';
import {Plus, Calendar, Users, Eye, UserPlus, Trash2, MoreVertical, Edit, Trash, Upload, X, Search, Check, Loader} from 'lucide-react';

export const ProjectManagement = () => {
    const {confirm, toast} = useDialog();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectMembers, setProjectMembers] = useState<ProjectMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [newProject, setNewProject] = useState<CreateProjectData>({name: '', description: ''});
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editProjectData, setEditProjectData] = useState<CreateProjectData>({name: '', description: ''});
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [isLogoUploadDialogOpen, setIsLogoUploadDialogOpen] = useState(false);
    const [logoUploadProject, setLogoUploadProject] = useState<Project | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const projectsData = await projectsApi.getAll();
            setProjects(projectsData);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await adminApi.getUsers(1, 10, searchTerm);
            const filteredUsers = response.users.filter(
                user => !projectMembers.some(member => member.user_id === user.id)
            );
            setSearchResults(filteredUsers);
            setShowResults(true);
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(userSearchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [userSearchTerm, projectMembers]);

    const loadProjectMembers = async (project: Project) => {
        setMembersLoading(true);
        try {
            const data = await adminApi.getProjectMembers(project.id);
            setProjectMembers(data.members);
            setSelectedProject(project);
        } catch (error) {
            console.error('Failed to load project members:', error);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedProject || !selectedUser) return;

        try {
            await adminApi.addProjectMember(selectedProject.id, {
                user_id: selectedUser.id
            });

            await loadProjectMembers(selectedProject);

            // Reset the search state
            setSelectedUser(null);
            setUserSearchTerm('');
            setSearchResults([]);
            setShowResults(false);
            setIsAddMemberDialogOpen(false);
        } catch (error) {
            console.error('Failed to add member:', error);
            toast('Failed to add member. They might already be a member of this project.', { variant: 'destructive' });
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!selectedProject) return;

        const confirmed = await confirm('Are you sure you want to remove this member from the project?');
        if (confirmed) {
            try {
                await adminApi.removeProjectMember(selectedProject.id, userId);
                setProjectMembers(projectMembers.filter(m => m.user_id !== userId));
            } catch (error) {
                console.error('Failed to remove member:', error);
                toast('Failed to remove member.', { variant: 'destructive' });
            }
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const project = await projectsApi.create(newProject);
            setProjects([project, ...projects]);
            setNewProject({name: '', description: ''});
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        setEditProjectData({name: project.name, description: project.description});
        setIsEditDialogOpen(true);
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        try {
            const updatedProject = await projectsApi.update(editingProject.id, editProjectData);
            setProjects(projects.map(p => p.id === editingProject.id ? updatedProject : p));

            if (selectedProject?.id === editingProject.id) {
                setSelectedProject(updatedProject);
            }
            
            setIsEditDialogOpen(false);
            setEditingProject(null);
            toast('Project updated successfully!');
        } catch (error) {
            console.error('Failed to update project:', error);
            toast('Failed to update project.', { variant: 'destructive' });
        }
    };

    const handleDeleteProject = async (project: Project) => {
        const confirmed = await confirm(
            `Are you sure you want to delete "${project.name}"? This action cannot be undone and will remove all associated data.`,
            'Delete Project'
        );
        
        if (confirmed) {
            try {
                await projectsApi.delete(project.id);
                setProjects(projects.filter(p => p.id !== project.id));

                if (selectedProject?.id === project.id) {
                    setSelectedProject(null);
                    setProjectMembers([]);
                }
                
                toast('Project deleted successfully!');
            } catch (error) {
                console.error('Failed to delete project:', error);
                toast('Failed to delete project.', { variant: 'destructive' });
            }
        }
    };

    const handleLogoUpload = (project: Project) => {
        setLogoUploadProject(project);
        setLogoFile(null);
        setLogoPreview(null);
        setIsLogoUploadDialogOpen(true);
    };

    const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoSubmit = async () => {
        if (!logoFile || !logoUploadProject) return;

        setIsUploadingLogo(true);
        try {
            const updatedProject = await projectsApi.uploadLogo(logoUploadProject.id, logoFile);
            setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
            if (selectedProject?.id === updatedProject.id) {
                setSelectedProject(updatedProject);
            }
            setIsLogoUploadDialogOpen(false);
            toast('Project logo uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload logo:', error);
            toast('Failed to upload logo. Please try again.', { variant: 'destructive' });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleDeleteLogo = async (project: Project) => {
        const confirmed = await confirm(
            'Delete Logo',
            'Are you sure you want to delete this project logo? This action cannot be undone.'
        );
        
        if (confirmed) {
            try {
                const updatedProject = await projectsApi.deleteLogo(project.id);
                setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                if (selectedProject?.id === updatedProject.id) {
                    setSelectedProject(updatedProject);
                }
                toast('Project logo deleted successfully!');
            } catch (error) {
                console.error('Failed to delete logo:', error);
                toast('Failed to delete logo. Please try again.', { variant: 'destructive' });
            }
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div>Loading projects...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Project Management</h1>
                    <p className="text-muted-foreground">Manage projects and team members</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4"/>
                            Create Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                            <DialogDescription>
                                Add a new project to the system. You can then add team members who will be able to
                                create posts and issues.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                            <div>
                                <Label htmlFor="name">Project Name</Label>
                                <Input
                                    id="name"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                                    placeholder="Describe what this project is about"
                                    required
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Project</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Update the project name and description.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProject} className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="edit-name">Project Name</Label>
                            <Input
                                id="edit-name"
                                value={editProjectData.name}
                                onChange={(e) => setEditProjectData({...editProjectData, name: e.target.value})}
                                placeholder="Enter project name"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editProjectData.description}
                                onChange={(e) => setEditProjectData({...editProjectData, description: e.target.value})}
                                placeholder="Describe what this project is about"
                                required
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Update Project</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <Card
                        key={project.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => loadProjectMembers(project)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                    <ProjectLogo project={project} size="md" />
                                    <CardTitle className="text-lg">{project.name}</CardTitle>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Eye className="h-4 w-4"/>
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-4 w-4"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditProject(project);
                                            }}>
                                                <Edit className="h-4 w-4 mr-2"/>
                                                Edit Project
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                handleLogoUpload(project);
                                            }}>
                                                <Upload className="h-4 w-4 mr-2"/>
                                                {project.logo_url ? 'Change Logo' : 'Upload Logo'}
                                            </DropdownMenuItem>
                                            {project.logo_url && (
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteLogo(project);
                                                }}>
                                                    <X className="h-4 w-4 mr-2"/>
                                                    Remove Logo
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProject(project);
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash className="h-4 w-4 mr-2"/>
                                                Delete Project
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <CardDescription className="line-clamp-2">
                                {project.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2"/>
                                Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {projects.length === 0 && (
                <Card className="text-center py-12">
                    <CardContent>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Plus className="h-8 w-8 text-muted-foreground"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">No projects yet</h3>
                                <p className="text-muted-foreground">Get started by creating your first project</p>
                            </div>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2"/>
                                Create Project
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedProject && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary"/>
                                </div>
                                <div>
                                    <CardTitle>{selectedProject.name} - Team Members</CardTitle>
                                    <CardDescription>
                                        Manage roles and permissions for project members
                                    </CardDescription>
                                </div>
                            </div>
                            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="flex items-center gap-2">
                                        <UserPlus className="h-4 w-4"/>
                                        Add Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md"> <DialogHeader>
                                    <DialogTitle>Add Team Member</DialogTitle>
                                    <DialogDescription>
                                        Add a new member to {selectedProject.name}. They will be able to create posts
                                        and issues.
                                    </DialogDescription>
                                </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                        <div>
                                            <Label htmlFor="user-search">Search for User</Label>
                                            <div className="relative">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                                    <Input
                                                        id="user-search"
                                                        placeholder="Type to search users..."
                                                        value={userSearchTerm}
                                                        onChange={(e) => {
                                                            setUserSearchTerm(e.target.value);
                                                            if (selectedUser) {
                                                                setSelectedUser(null);
                                                            }
                                                        }}
                                                        className="pl-10"
                                                    />
                                                    {isSearching && (
                                                        <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"/>
                                                    )}
                                                </div>

                                                {selectedUser && (
                                                    <div className="mt-2 p-2 bg-primary/10 rounded-md flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Check className="h-4 w-4 text-primary"/>
                                                            <span className="font-medium">{selectedUser.username}</span>
                                                            <span className="text-sm text-muted-foreground">({selectedUser.email})</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedUser(null);
                                                                setUserSearchTerm('');
                                                            }}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <X className="h-3 w-3"/>
                                                        </Button>
                                                    </div>
                                                )}

                                                {showResults && searchResults.length > 0 && !selectedUser && (
                                                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                        {searchResults.map((user) => (
                                                            <div
                                                                key={user.id}
                                                                className="p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0"
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setUserSearchTerm(user.username);
                                                                    setShowResults(false);
                                                                }}
                                                            >
                                                                <div className="font-medium">{user.username}</div>
                                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {showResults && searchResults.length === 0 && userSearchTerm.trim() && !isSearching && (
                                                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-center text-muted-foreground">
                                                        No users found matching "{userSearchTerm}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAddMemberDialogOpen(false);
                                                    setSelectedUser(null);
                                                    setUserSearchTerm('');
                                                    setSearchResults([]);
                                                    setShowResults(false);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddMember}
                                                disabled={!selectedUser}
                                            >
                                                Add Member
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {membersLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div>Loading members...</div>
                            </div>
                        ) : projectMembers.length > 0 ? (
                            <div className="overflow-x-auto"><Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                        {member.user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{member.user.username}</div>
                                                        <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                                        {member.user.is_admin && (
                                                            <div className="text-xs text-muted-foreground">System
                                                                Admin</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2"/>
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                        <Users className="h-6 w-6 text-muted-foreground"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">No members found</h3>
                                        <p className="text-sm text-muted-foreground">
                                            This project doesn't have any members yet.
                                        </p>
                                    </div>
                                    <Button onClick={() => setIsAddMemberDialogOpen(true)}>
                                        <UserPlus className="h-4 w-4 mr-2"/>
                                        Add First Member
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Dialog open={isLogoUploadDialogOpen} onOpenChange={setIsLogoUploadDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {logoUploadProject?.logo_url ? 'Change Project Logo' : 'Upload Project Logo'}
                        </DialogTitle>
                        <DialogDescription>
                            Upload an image file to use as the project logo. Supported formats: JPG, PNG, GIF, WebP, SVG.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {logoUploadProject && (
                            <div className="text-center">
                                <div className="text-sm text-muted-foreground mb-2">Current logo:</div>
                                <ProjectLogo project={logoUploadProject} size="lg" className="mx-auto" />
                            </div>
                        )}
                        
                        <div>
                            <Label htmlFor="logo-file">Select Logo</Label>
                            <Input
                                id="logo-file"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoFileChange}
                                className="mt-1"
                            />
                        </div>

                        {logoPreview && (
                            <div className="text-center">
                                <div className="text-sm text-muted-foreground mb-2">Preview:</div>
                                <div className="h-16 w-16 mx-auto rounded-lg border border-border overflow-hidden">
                                    <img 
                                        src={logoPreview} 
                                        alt="Logo preview" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsLogoUploadDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleLogoSubmit}
                                disabled={!logoFile || isUploadingLogo}
                            >
                                {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
