import {useState, useEffect} from 'react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Separator} from './ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import {useAuth} from '../contexts/AuthContext';
import {useDialog} from '../contexts/DialogContext';
import {LogIn, UserPlus} from 'lucide-react';
import {EmailVerificationDialog} from './EmailVerificationDialog';
import {PasswordResetDialog} from './PasswordResetDialog';
import {authApi} from '../services/api';
import { SiGoogle, SiDiscord } from '@icons-pack/react-simple-icons';

interface LoginDialogProps {
    children: React.ReactNode;
}

interface OAuthProvider {
    provider: string;
}

export const LoginDialog = ({children}: LoginDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [identifier, setIdentifier] = useState(''); // For login: username or email
    const [username, setUsername] = useState(''); // For registration
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);
    const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(false);

    const {login, register, pendingVerification} = useAuth();
    const {toast} = useDialog();

    useEffect(() => {
        const loadOAuthProviders = async () => {
            try {
                setLoadingProviders(true);
                const response = await authApi.getOAuthProviders();
                setOauthProviders(response.providers);
            } catch (error) {
                console.error('Failed to load OAuth providers:', error);
            } finally {
                setLoadingProviders(false);
            }
        };

        if (isOpen) {
            loadOAuthProviders();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

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
                toast(errorMessage, { variant: 'destructive' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
    };

    const handleOAuthLogin = (provider: string) => {
        const currentUrl = window.location.href;
        const returnUrl = currentUrl.includes('/login') ? '/' : currentUrl;
        window.location.href = `/api/auth/oauth/${provider}?returnUrl=${encodeURIComponent(returnUrl)}`;
    };

    const renderOAuthButtons = () => {
        if (loadingProviders || oauthProviders.length === 0) {
            return null;
        }

        return (
            <>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-popover px-2 text-muted-foreground">or continue with</span>
                    </div>
                </div>
                
                <div className="flex justify-center gap-3">
                    {oauthProviders.map((provider) => (
                        <Button
                            key={provider.provider}
                            type="button"
                            variant="outline"
                            onClick={() => handleOAuthLogin(provider.provider)}
                            className="w-10 h-10 rounded-full p-0 border-border hover:bg-accent"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                {provider.provider === 'google' && (
                                    <SiGoogle color="#4285f4" size={16} />
                                )}
                                {provider.provider === 'discord' && (
                                    <SiDiscord color="#5865f2" size={16} />
                                )}
                            </div>
                        </Button>
                    ))}
                </div>
            </>
        );
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
                            {mode === 'login' && (
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false);
                                            setShowPasswordResetDialog(true);
                                        }}
                                        className="text-sm text-primary hover:text-primary/80 underline"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}
                        </div>

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

                    {renderOAuthButtons()}
                </DialogContent>
            </Dialog>

            {showVerificationDialog && verificationEmail && (
                <EmailVerificationDialog
                    open={showVerificationDialog}
                    onOpenChange={setShowVerificationDialog}
                    email={verificationEmail}
                />
            )}

            <PasswordResetDialog
                open={showPasswordResetDialog}
                onOpenChange={setShowPasswordResetDialog}
            />
        </>
    );
};
