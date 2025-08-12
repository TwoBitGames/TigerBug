import { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const useProjectAssignments = () => {
    const { user, isAuthenticated } = useAuth();
    const [hasProjectAssignments, setHasProjectAssignments] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkProjectAssignments = async () => {
            if (!isAuthenticated || !user) {
                setHasProjectAssignments(false);
                setIsLoading(false);
                return;
            }

            try {
                const result = await authApi.getProjectAssignmentStatus();
                setHasProjectAssignments(result.hasProjectAssignments);
            } catch (error) {
                console.error('Failed to check project assignments:', error);
                setHasProjectAssignments(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkProjectAssignments();
    }, [user, isAuthenticated]);

    return {
        hasProjectAssignments,
        isLoading,
    };
};
