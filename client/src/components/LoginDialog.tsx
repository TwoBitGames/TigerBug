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

interface LoginDialogProps {
    children: React.ReactNode;
}

export const LoginDialog = ({children}: LoginDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {login, register} = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, password);
            }
            setIsOpen(false);
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-700">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {mode === 'login'
                            ? 'Sign in to create and manage issues'
                            : 'Create an account to start contributing'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-200">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-200">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-400"
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
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
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
    );
};
