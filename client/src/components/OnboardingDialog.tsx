import {useState} from 'react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {useAuth} from '../contexts/AuthContext';
import {Rocket, Shield, Users, Settings} from 'lucide-react';

interface OnboardingDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OnboardingDialog = ({isOpen, onClose}: OnboardingDialogProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {setupFirstAdmin} = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await setupFirstAdmin(email, password);
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred during setup');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {
        }}>
            <DialogContent className="sm:max-w-[500px] bg-popover border-border">
                <DialogHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Rocket className="h-8 w-8 text-primary"/>
                    </div>
                    <DialogTitle className="text-2xl font-bold text-popover-foreground">
                        Welcome to TigerBug!
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-base">
                        Let's get you started by setting up your admin account. You'll be able to manage projects,
                        users, and system settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-accent/50 rounded-lg">
                            <Shield className="h-5 w-5 text-primary"/>
                            <div>
                                <h4 className="font-medium text-foreground">Admin Privileges</h4>
                                <p className="text-sm text-muted-foreground">Full system access and user management</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-accent/50 rounded-lg">
                            <Users className="h-5 w-5 text-primary"/>
                            <div>
                                <h4 className="font-medium text-foreground">Project Management</h4>
                                <p className="text-sm text-muted-foreground">Create and manage projects and team
                                    members</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-accent/50 rounded-lg">
                            <Settings className="h-5 w-5 text-primary"/>
                            <div>
                                <h4 className="font-medium text-foreground">System Configuration</h4>
                                <p className="text-sm text-muted-foreground">Configure SMTP and other system
                                    settings</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="setup-email" className="text-foreground font-medium">Admin Email</Label>
                            <Input
                                id="setup-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="setup-password" className="text-foreground font-medium">Password</Label>
                            <Input
                                id="setup-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter a secure password (min. 6 characters)"
                                required
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md p-3">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    <span>Setting up...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center space-x-2">
                                    <Rocket className="h-4 w-4"/>
                                    <span>Create Admin Account & Get Started</span>
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground">
                        This will be the first account in your system and will have full administrative privileges.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
