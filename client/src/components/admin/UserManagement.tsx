import {useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../ui/table';
import {Badge} from '../ui/badge';
import {adminApi} from '../../services/api';
import type {User} from '../../types';
import {useAuth} from '../../contexts/AuthContext';

export const UserManagement = () => {
    const {user: currentUser} = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersData = await adminApi.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserRoleUpdate = async (userId: number, isAdmin: boolean) => {
        try {
            await adminApi.updateUserRole(userId, isAdmin);
            setUsers(users.map(u => u.id === userId ? {...u, is_admin: isAdmin} : u));
        } catch (error) {
            console.error('Failed to update user role:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div>Loading users...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage user permissions and admin privileges</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Users</CardTitle>
                    <CardDescription>
                        View and manage user roles across the system
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((userData) => (
                                    <TableRow key={userData.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                    {userData.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-medium">{userData.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={userData.is_admin ? 'default' : 'secondary'}>
                                                {userData.is_admin ? 'Admin' : 'User'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(userData.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant={userData.is_admin ? 'destructive' : 'default'}
                                                size="sm"
                                                onClick={() => handleUserRoleUpdate(userData.id, !userData.is_admin)}
                                                disabled={userData.id === currentUser?.id}
                                            >
                                                {userData.is_admin ? 'Remove Admin' : 'Make Admin'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
