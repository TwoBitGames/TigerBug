 import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '@/lib/utils.ts';
import type { User } from '@/types';

interface UserAvatarProps {
    user?: User | null;
    className?: string;
    fallbackClassName?: string;
}

export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
    return (
        <Avatar className={cn('', className)}>
            <AvatarImage 
                src={user?.profile_picture || undefined} 
                alt={user?.username || 'User'} 
            />
            <AvatarFallback className={cn('bg-secondary text-secondary-foreground', fallbackClassName)}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
        </Avatar>
    );
}
