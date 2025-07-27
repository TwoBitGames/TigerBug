import {Button} from '../ui/button';
import {Users, FolderPlus, Mail, Palette} from 'lucide-react';
import {Link, useLocation} from 'react-router-dom';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout = ({children}: AdminLayoutProps) => {
    const location = useLocation();

    const getActiveSection = () => {
        const path = location.pathname;
        if (path.includes('/admin/users')) return 'users';
        if (path.includes('/admin/projects')) return 'projects';
        if (path.includes('/admin/smtp')) return 'smtp';
        if (path.includes('/admin/branding')) return 'branding';
        return 'users';
    };

    const activeSection = getActiveSection();
    return (
        <div className="flex h-full min-h-[calc(100vh-4rem)]">
            <div className="w-64 border-r bg-background">
                <div className="p-4 space-y-2">
                    <Button
                        variant={activeSection === 'users' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        asChild
                    >
                        <Link to="/admin/users">
                            <Users className="h-4 w-4 mr-2"/>
                            User Management
                        </Link>
                    </Button>
                    <Button
                        variant={activeSection === 'projects' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        asChild
                    >
                        <Link to="/admin/projects">
                            <FolderPlus className="h-4 w-4 mr-2"/>
                            Project Management
                        </Link>
                    </Button>
                    <Button
                        variant={activeSection === 'smtp' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        asChild
                    >
                        <Link to="/admin/smtp">
                            <Mail className="h-4 w-4 mr-2"/>
                            SMTP Configuration
                        </Link>
                    </Button>
                    <Button
                        variant={activeSection === 'branding' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        asChild
                    >
                        <Link to="/admin/branding">
                            <Palette className="h-4 w-4 mr-2"/>
                            Branding Configuration
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-background">
                {children}
            </div>
        </div>
    );
};
