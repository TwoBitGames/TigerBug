import {useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {Card, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {AdminLayout} from '../components/admin/AdminLayout';
import {UserManagement} from '../components/admin/UserManagement';
import {ProjectManagement} from '../components/admin/ProjectManagement';
import {SMTPConfiguration} from '../components/admin/SMTPConfiguration';
import {Shield} from 'lucide-react';

export const AdminDashboard = () => {
    const {user} = useAuth();
    const [activeSection, setActiveSection] = useState('users');

    if (!user?.is_admin) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5"/>
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

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'users':
                return <UserManagement/>;
            case 'projects':
                return <ProjectManagement/>;
            case 'smtp':
                return <SMTPConfiguration/>;
            default:
                return <UserManagement/>;
        }
    };

    return (
        <AdminLayout
            activeSection={activeSection}
            onSectionChange={setActiveSection}
        >
            {renderActiveSection()}
        </AdminLayout>
    );
};
