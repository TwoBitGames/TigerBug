import {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {useAuth} from '../contexts/AuthContext';
import {useDialog} from '../contexts/DialogContext';
import {KeyRound, ArrowLeft, Check} from 'lucide-react';
import {authApi} from '../services/api';

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {setAuthToken, setUser} = useAuth();
    const {toast} = useDialog();

    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            navigate('/', {replace: true});
        }
    }, [searchParams, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast('Passwords do not match', {variant: 'destructive'});
            return;
        }

        if (password.length < 6) {
            toast('Password must be at least 6 characters long', {variant: 'destructive'});
            return;
        }

        setIsLoading(true);

        try {
            const response = await authApi.resetPassword({token, password});

            setAuthToken(response.token);
            setUser(response.user);
            
            setIsSuccess(true);
            toast('Password reset successful! You are now logged in.', {
                variant: 'default'
            });

            setTimeout(() => {
                navigate('/', {replace: true});
            }, 2000);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to reset password';
            toast(errorMessage, {variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-card border-border">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600 dark:text-green-400"/>
                        </div>
                        <div>
                            <CardTitle className="text-card-foreground">Password Reset Successful!</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Your password has been updated and you are now logged in.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-sm text-muted-foreground mb-4">
                            Redirecting to the dashboard...
                        </p>
                        <Button 
                            onClick={handleBackToHome}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-card border-border">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <KeyRound className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                        <CardTitle className="text-card-foreground">Reset Your Password</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter your new password below
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">
                                New Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your new password"
                                required
                                minLength={6}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-foreground">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your new password"
                                required
                                minLength={6}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="flex flex-col space-y-3">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                ) : (
                                    <>
                                        <KeyRound className="h-4 w-4 mr-2"/>
                                        Reset Password
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleBackToHome}
                                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2"/>
                                Back to Home
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
