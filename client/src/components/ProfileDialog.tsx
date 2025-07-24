import {useState, useRef} from 'react';
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
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {Camera, Trash2} from 'lucide-react';

interface ProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileDialog({isOpen, onClose}: ProfileDialogProps) {
    const {user, updateProfile, uploadProfilePicture, deleteProfilePicture} = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image file size must be less than 5MB');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await uploadProfilePicture(file);
        } catch (err: any) {
            setError(err.message || 'Failed to upload profile picture');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteProfilePicture = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await deleteProfilePicture();
        } catch (err: any) {
            setError(err.message || 'Failed to delete profile picture');
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
                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col items-center space-y-4 py-4 border-b border-border">
                            <div className="relative">
                                <Avatar className="h-24 w-24 ring-2 ring-border ring-offset-2">
                                    <AvatarImage 
                                        src={user?.profile_picture || undefined} 
                                        alt={user?.username || 'User'}
                                    />
                                    <AvatarFallback className="text-2xl font-semibold">
                                        {user?.username?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            
                            <div className="text-center space-y-2">
                                <h3 className="text-sm font-medium text-foreground">Profile Picture</h3>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG, GIF or WebP. Max size 5MB.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    <Camera className="h-4 w-4 mr-2" />
                                    {user?.profile_picture ? 'Change' : 'Upload'}
                                </Button>
                                {user?.profile_picture && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeleteProfilePicture}
                                        disabled={isLoading}
                                        className="flex-1 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="hidden"
                            />
                        </div>

                        <div className="space-y-4">
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
