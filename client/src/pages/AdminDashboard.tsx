import { useAuth } from '../contexts/AuthContext';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Shield } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export const AdminDashboard = () => {
    const { user } = useAuth();

    if (!user?.is_admin) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You need admin privileges to access this page.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <AdminLayout>
            <Outlet />
        </AdminLayout>
    );
};
