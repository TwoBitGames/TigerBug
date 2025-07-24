import {useState, useEffect} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {authApi} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import {setAuthToken} from '../lib/request';
import {Mail, Clock, RefreshCw, ArrowLeft} from 'lucide-react';

export const EmailVerificationPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get('email') || '';
    const urlCode = searchParams.get('code') || '';

    const [code, setCode] = useState(urlCode);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [autoVerified, setAutoVerified] = useState(false);

    const {setUser} = useAuth();

    useEffect(() => {
        if (!email) {
            navigate('/');
        }
    }, [email, navigate]);

    useEffect(() => {
        if (email && urlCode && urlCode.length === 6 && !autoVerified) {
            setAutoVerified(true);
            handleVerification(urlCode);
        }
    }, [email, urlCode, autoVerified]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handleVerification = async (verificationCode: string) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await authApi.verifyEmail({email, code: verificationCode});
            setAuthToken(response.token);
            setUser(response.user);
            setSuccess('Email verified successfully!');
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleVerification(code);
    };

    const handleResendCode = async () => {
        setIsResending(true);
        setError(null);
        setSuccess(null);

        try {
            await authApi.resendVerificationCode({email});
            setSuccess('Verification code sent!');
            setTimeLeft(60);
        } catch (err: any) {
            setError(err.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        setCode(value);
    };

    if (!email) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Back to Home
                </Button>

                <Card className="bg-card border-border">
                    <CardHeader className="text-center">
                        <div
                            className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-6 w-6 text-primary"/>
                        </div>
                        <CardTitle className="text-card-foreground">Verify Your Email</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            We've sent a 6-digit verification code to <strong>{email}</strong>.
                            Please enter it below to complete your registration.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-foreground">Verification Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    value={code}
                                    onChange={handleCodeChange}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="bg-input border-border text-foreground placeholder:text-muted-foreground text-center text-2xl font-mono tracking-widest"
                                    required
                                    autoComplete="one-time-code"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                    Enter the 6-digit code from your email
                                </p>
                            </div>

                            {error && (
                                <div
                                    className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md p-3">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-md p-3">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    disabled={isLoading || code.length !== 6}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <div
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    ) : (
                                        'Verify Email'
                                    )}
                                </Button>

                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResendCode}
                                        disabled={isResending || timeLeft > 0}
                                        className="border-border text-foreground hover:bg-accent"
                                    >
                                        {isResending ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin mr-2"/>
                                                Sending...
                                            </>
                                        ) : timeLeft > 0 ? (
                                            <>
                                                <Clock className="h-4 w-4 mr-2"/>
                                                Resend in {timeLeft}s
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2"/>
                                                Resend Code
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
