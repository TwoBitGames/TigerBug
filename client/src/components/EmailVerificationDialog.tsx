import {useState, useEffect} from 'react';
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
import {authApi} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import {setAuthToken} from '../lib/request';
import {Mail, Clock, RefreshCw, ExternalLink} from 'lucide-react';

interface EmailVerificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    email: string;
}

export const EmailVerificationDialog = ({open, onOpenChange, email}: EmailVerificationDialogProps) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const {setUser} = useAuth();

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await authApi.verifyEmail({email, code});
            setAuthToken(response.token);
            setUser(response.user);
            setSuccess('Email verified successfully!');
            setTimeout(() => {
                onOpenChange(false);
                setCode('');
                setSuccess(null);
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
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

    const handleOpenVerificationPage = () => {
        onOpenChange(false);
        window.open(`/verify-email?email=${encodeURIComponent(email)}`, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                <DialogHeader>
                    <DialogTitle className="text-popover-foreground flex items-center">
                        <Mail className="h-5 w-5 mr-2 text-primary"/>
                        Verify Your Email
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        We've sent a 6-digit verification code to <strong>{email}</strong>.
                        Please enter it below to complete your registration.
                    </DialogDescription>
                </DialogHeader>

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
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the 6-digit code from your email
                        </p>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md p-2">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-md p-2">
                            {success}
                        </div>
                    )}

                    <div className="flex flex-col space-y-3">
                        <Button
                            type="submit"
                            disabled={isLoading || code.length !== 6}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isLoading ? (
                                <div
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                            ) : (
                                'Verify Email'
                            )}
                        </Button>

                        <div className="flex space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResendCode}
                                disabled={isResending || timeLeft > 0}
                                className="flex-1 border-border text-foreground hover:bg-accent"
                            >
                                {isResending ? (
                                    <>
                                        <RefreshCw className="h-3 w-3 animate-spin mr-1"/>
                                        Sending...
                                    </>
                                ) : timeLeft > 0 ? (
                                    <>
                                        <Clock className="h-3 w-3 mr-1"/>
                                        {timeLeft}s
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-3 w-3 mr-1"/>
                                        Resend
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleOpenVerificationPage}
                                className="flex-1 border-border text-foreground hover:bg-accent"
                            >
                                <ExternalLink className="h-3 w-3 mr-1"/>
                                Open Page
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            Didn't receive the code? Check your spam folder or use the resend button.
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
