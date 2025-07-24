import {useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';

interface ProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileDialog({isOpen, onClose}: ProfileDialogProps) {
    const {user, updateProfile} = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await updateProfile(username);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setUsername(user?.username || '');
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your personal details. Your email cannot be changed.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                Username
                            </Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="col-span-3"
                                required
                                minLength={2}
                                maxLength={30}
                                pattern="[a-zA-Z0-9]+"
                                title="Username can only contain letters and numbers"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                value={user?.email || ''}
                                className="col-span-3"
                                disabled
                                title="Email cannot be changed"
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="text-sm text-red-600 mb-4">
                            {error}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || username === user?.username}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
