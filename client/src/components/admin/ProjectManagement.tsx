import {useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Label} from '../ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../ui/table';
import {Textarea} from '../ui/textarea';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '../ui/dialog';
import {adminApi, projectsApi} from '../../services/api';
import type {Project, ProjectMembership, CreateProjectData, User} from '../../types';
import {Plus, Calendar, Users, Eye, UserPlus, Trash2} from 'lucide-react';

export const ProjectManagement = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectMembers, setProjectMembers] = useState<ProjectMembership[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [newProject, setNewProject] = useState<CreateProjectData>({name: '', description: ''});
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    useEffect(() => {
        loadProjects();
        loadAllUsers();
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

    const loadAllUsers = async () => {
        try {
            const usersData = await adminApi.getUsers();
            setAllUsers(usersData);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

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
        if (!selectedProject || !selectedUserId) return;

        try {
            await adminApi.addProjectMember(selectedProject.id, {
                user_id: parseInt(selectedUserId)
            });

            await loadProjectMembers(selectedProject);

            setSelectedUserId('');
            setIsAddMemberDialogOpen(false);
        } catch (error) {
            console.error('Failed to add member:', error);
            alert('Failed to add member. They might already be a member of this project.');
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!selectedProject) return;

        if (confirm('Are you sure you want to remove this member from the project?')) {
            try {
                await adminApi.removeProjectMember(selectedProject.id, userId);
                setProjectMembers(projectMembers.filter(m => m.user_id !== userId));
            } catch (error) {
                console.error('Failed to remove member:', error);
                alert('Failed to remove member.');
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
            {/* Header with Create Button */}
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

            {/* Projects Grid */}
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
                                <CardTitle className="text-lg">{project.name}</CardTitle>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4"/>
                                </Button>
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

            {/* Project Members Management */}
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
                                            <Label htmlFor="user-select">Select User</Label>
                                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a user"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allUsers
                                                        .filter(user => !projectMembers.some(member => member.user_id === user.id))
                                                        .map((user) => (
                                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                                {user.email}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsAddMemberDialogOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddMember}
                                                disabled={!selectedUserId}
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
                                                        {member.user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{member.user.email}</div>
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
        </div>
    );
};
