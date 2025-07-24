import {ArrowLeft, Edit2, MoreVertical, Trash2} from 'lucide-react';
import {Button} from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface IssueHeaderProps {
    canEdit: boolean;
    canDelete: boolean;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const IssueHeader = ({canEdit, canDelete, onBack, onEdit, onDelete}: IssueHeaderProps) => {
    return (
        <div className="flex items-center justify-between">
            <Button
                variant="ghost"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
            >
                <ArrowLeft className="h-4 w-4 mr-2"/>
                Back to Issues
            </Button>

            <div className="flex items-center space-x-2">
                {canEdit && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="border-border text-muted-foreground hover:bg-accent cursor-pointer"
                    >
                        <Edit2 className="h-4 w-4 mr-2"/>
                        Edit Issue
                    </Button>
                )}

                {canDelete && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <MoreVertical className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-red-400 hover:text-red-300 hover:bg-zinc-700 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4 mr-2"/>
                                Delete Issue
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
};
