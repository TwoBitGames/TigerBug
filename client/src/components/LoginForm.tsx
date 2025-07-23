import {useState} from 'react';
import {Button} from './ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {useAuth} from '../contexts/AuthContext';
import {RequestError} from '../lib/request';

export const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {login, register} = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isRegistering) {
                await register(email, password);
            } else {
                await login(email, password);
            }
        } catch (err) {
            if (err instanceof RequestError) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
            <Card className="w-full max-w-md bg-zinc-800/60 border-zinc-700/60 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-zinc-100">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        {isRegistering
                            ? 'Enter your information to create an account'
                            : 'Enter your credentials to access your account'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-200">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                                className="bg-zinc-700/60 border-zinc-600/60 text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500/60 focus:ring-purple-500/20"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-200">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                required
                                className="bg-zinc-700/60 border-zinc-600/60 text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500/60 focus:ring-purple-500/20"
                                placeholder="Enter your password"
                            />
                        </div>

                        {error && (
                            <div
                                className="text-red-400 text-sm bg-red-950/30 border border-red-500/40 rounded px-3 py-2">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-zinc-700 disabled:text-zinc-500"
                        >
                            {isLoading ? (
                                'Loading...'
                            ) : (
                                isRegistering ? 'Create Account' : 'Sign In'
                            )}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            {isRegistering
                                ? 'Already have an account? Sign in'
                                : "Don't have an account? Create one"
                            }
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
