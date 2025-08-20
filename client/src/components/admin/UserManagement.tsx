import {useState, useEffect, useCallback} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../ui/table';
import {Badge} from '../ui/badge';
import {ChevronLeft, ChevronRight, Search, Loader, User as UserIcon} from 'lucide-react';
import {adminApi} from '@/services/api.ts';
import type {User} from '@/types';
import {useAuth} from '../../contexts/AuthContext';

interface UserPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export const UserManagement = () => {
    const {user: currentUser} = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<UserPagination>({
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    });
    const [isSearching, setIsSearching] = useState(false);
    const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

    const loadUsers = useCallback(async (page: number = 1, search: string = '') => {
        setIsSearching(search !== '');
        
        try {
            const response = await adminApi.getUsers(page, 25, search);
            setUsers(response.users);
            setPagination(response.pagination);
            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            if (!hasInitiallyLoaded) {
                setLoading(false);
                setHasInitiallyLoaded(true);
            }
            setIsSearching(false);
        }
    }, [hasInitiallyLoaded]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== '') {
                loadUsers(1, searchTerm);
                setCurrentPage(1);
            } else if (searchTerm === '') {
                loadUsers(1, '');
                setCurrentPage(1);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, loadUsers]);

    const handleUserRoleUpdate = async (userId: number, isAdmin: boolean) => {
        try {
            await adminApi.updateUserRole(userId, isAdmin);
            setUsers(users.map(u => u.id === userId ? {...u, is_admin: isAdmin} : u));
        } catch (error) {
            console.error('Failed to update user role:', error);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            loadUsers(page, searchTerm);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin"/>
                        <span>Loading users...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <UserIcon className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground text-lg">
                            Manage user permissions and admin privileges across the system.
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>System Users</CardTitle>
                            <CardDescription>
                                View and manage user roles across the system
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-10 w-64"
                                />
                                {isSearching && (
                                    <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"/>
                                )}
                            </div>
                        </div>
                    </div>
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
                                                    {userData.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{userData.username}</div>
                                                    <div className="text-sm text-muted-foreground">{userData.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={userData.is_admin ? 'default' : 'secondary'}>
                                                {userData.is_admin ? 'Admin' : 'User'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant={userData.is_admin ? 'destructive' : 'default'}
                                                size="sm"
                                                onClick={() => handleUserRoleUpdate(userData.id, !userData.is_admin)}
                                                disabled={userData.id === currentUser?.id}
                                                className="cursor-pointer transition-all hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                {userData.is_admin ? 'Remove Admin' : 'Make Admin'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * 25) + 1} to {Math.min(currentPage * 25, pagination.total)} of {pagination.total} users
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="flex items-center gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4"/>
                                    Previous
                                </Button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pageNum === currentPage ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className="w-8 h-8 p-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={!pagination.hasNext}
                                    className="flex items-center gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    )}

                    {users.length === 0 && !loading && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
