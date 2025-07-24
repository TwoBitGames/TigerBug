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
    DialogTrigger,
} from './ui/dialog';
import {useAuth} from '../contexts/AuthContext';
import {LogIn, UserPlus} from 'lucide-react';
import {EmailVerificationDialog} from './EmailVerificationDialog';

interface LoginDialogProps {
    children: React.ReactNode;
}

export const LoginDialog = ({children}: LoginDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [identifier, setIdentifier] = useState(''); // For login: username or email
    const [username, setUsername] = useState(''); // For registration
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');

    const {login, register, pendingVerification} = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                await login(identifier, password);
                setIsOpen(false);
                setIdentifier('');
                setPassword('');
            } else {
                await register(username, email, password);
                setIsOpen(false);
                setUsername('');
                setEmail('');
                setPassword('');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'An error occurred';

            if (pendingVerification || errorMessage.includes('verify your email') || errorMessage.includes('verification code')) {
                const verifyEmail = pendingVerification?.email || email;
                setVerificationEmail(verifyEmail);
                setShowVerificationDialog(true);
                setIsOpen(false);
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError(null);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                    <DialogHeader>
                        <DialogTitle className="text-popover-foreground">
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {mode === 'login'
                                ? 'Sign in to create and manage issues'
                                : 'Create an account to start contributing'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-foreground">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    minLength={2}
                                    maxLength={30}
                                    pattern="[a-zA-Z0-9]+"
                                    title="Username can only contain letters and numbers"
                                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor={mode === 'login' ? 'identifier' : 'email'} className="text-foreground">
                                {mode === 'login' ? 'Username or Email' : 'Email'}
                            </Label>
                            <Input
                                id={mode === 'login' ? 'identifier' : 'email'}
                                type={mode === 'login' ? 'text' : 'email'}
                                value={mode === 'login' ? identifier : email}
                                onChange={(e) => mode === 'login' ? setIdentifier(e.target.value) : setEmail(e.target.value)}
                                placeholder={mode === 'login' ? 'Enter your username or email' : 'Enter your email'}
                                required
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md p-2">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col space-y-3">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {isLoading ? (
                                    <div
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                ) : (
                                    <>
                                        {mode === 'login' ? <LogIn className="h-4 w-4 mr-2"/> :
                                            <UserPlus className="h-4 w-4 mr-2"/>}
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={toggleMode}
                                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                                {mode === 'login'
                                    ? "Don't have an account? Sign up"
                                    : "Already have an account? Sign in"
                                }
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {showVerificationDialog && verificationEmail && (
                <EmailVerificationDialog
                    open={showVerificationDialog}
                    onOpenChange={setShowVerificationDialog}
                    email={verificationEmail}
                />
            )}
        </>
    );
};
