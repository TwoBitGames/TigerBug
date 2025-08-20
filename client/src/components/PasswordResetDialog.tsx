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
import {useDialog} from '../contexts/DialogContext';
import {KeyRound} from 'lucide-react';
import {authApi} from '../services/api';

interface PasswordResetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PasswordResetDialog = ({open, onOpenChange}: PasswordResetDialogProps) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);

    const {toast} = useDialog();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authApi.forgotPassword({email});
            setIsEmailSent(true);
            toast('Password reset email sent successfully! Please check your inbox.', {
                variant: 'default'
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to send password reset email';
            toast(errorMessage, {variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setIsEmailSent(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                <DialogHeader>
                    <DialogTitle className="text-popover-foreground flex items-center gap-2">
                        <KeyRound className="h-5 w-5"/>
                        Reset Password
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isEmailSent
                            ? "We've sent you a password reset link. Please check your email and follow the instructions."
                            : "Enter your email address and we'll send you a link to reset your password."
                        }
                    </DialogDescription>
                </DialogHeader>

                {!isEmailSent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email" className="text-foreground">
                                Email Address
                            </Label>
                            <Input
                                id="reset-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
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
                                        Send Reset Link
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="text-green-800 dark:text-green-200 text-sm">
                                Email sent successfully! Please check your inbox and spam folder.
                            </p>
                        </div>

                        <Button
                            onClick={handleClose}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
