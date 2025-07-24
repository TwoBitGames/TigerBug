import { Button } from '../ui/button';
import { Users, FolderPlus, Mail, Palette } from 'lucide-react';

interface AdminLayoutProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}

export const AdminLayout = ({ activeSection, onSectionChange, children }: AdminLayoutProps) => {
  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      <div className="w-64 border-r bg-background">
        <div className="p-4 space-y-2">
          <Button
            variant={activeSection === 'users' ? 'default' : 'ghost'}
            onClick={() => onSectionChange('users')}
            className="w-full justify-start"
          >
            <Users className="h-4 w-4 mr-2" />
            User Management
          </Button>
          <Button
            variant={activeSection === 'projects' ? 'default' : 'ghost'}
            onClick={() => onSectionChange('projects')}
            className="w-full justify-start"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Project Management
          </Button>
          <Button
            variant={activeSection === 'smtp' ? 'default' : 'ghost'}
            onClick={() => onSectionChange('smtp')}
            className="w-full justify-start"
          >
            <Mail className="h-4 w-4 mr-2" />
            SMTP Configuration
          </Button>
          <Button
            variant={activeSection === 'branding' ? 'default' : 'ghost'}
            onClick={() => onSectionChange('branding')}
            className="w-full justify-start"
          >
            <Palette className="h-4 w-4 mr-2" />
            Branding Configuration
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  );
};
