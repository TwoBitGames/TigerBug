import {createContext, useContext, useState, useEffect, useRef} from 'react';
import type {ReactNode} from 'react';
import type {User} from '../types';
import {authApi} from '../services/api';
import {setAuthToken, removeAuthToken, RequestError} from '../lib/request';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    needsOnboarding: boolean;
    pendingVerification: { email: string } | null;
    checkOnboardingStatus: () => Promise<void>;
    login: (identifier: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    setupFirstAdmin: (email: string, password: string) => Promise<void>;
    updateProfile: (username: string) => Promise<void>;
    uploadProfilePicture: (file: File) => Promise<void>;
    deleteProfilePicture: () => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    clearPendingVerification: () => void;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [pendingVerification, setPendingVerification] = useState<{ email: string } | null>(null);
    const authCheckRef = useRef<Promise<void> | null>(null);

    const checkOnboardingStatus = async () => {
        try {
            const response = await authApi.checkOnboardingStatus();
            setNeedsOnboarding(response.needsOnboarding);
        } catch (error) {
            console.error('Failed to check onboarding status:', error);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            await checkOnboardingStatus();
            
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    setAuthToken(token);
                    const userData = await authApi.getProfile();
                    setUser(userData);
                } catch (error) {
                    console.error('Auth check failed:', error);

                    if (error instanceof RequestError && (error.status === 401 || error.status === 403)) {
                        console.log('Token is invalid, removing...');
                        removeAuthToken();
                        setUser(null);
                    } else {
                        console.log('Network or server error, keeping token for retry...');
                    }
                }
            }
            setIsLoading(false);
        };

        if (!authCheckRef.current) {
            authCheckRef.current = checkAuth().finally(() => {
                authCheckRef.current = null;
            });
        }
    }, []);

    const login = async (identifier: string, password: string) => {
        try {
            const response = await authApi.login({identifier, password});
            setAuthToken(response.token);
            setUser(response.user);
            setPendingVerification(null);
        } catch (error: any) {
            if (error instanceof RequestError && error.response) {
                const errorResponse = error.response;
                if (errorResponse.requiresVerification && errorResponse.user) {
                    setPendingVerification({ email: errorResponse.user.email });
                    throw new Error('Please verify your email address to continue.');
                }
            }
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            const response = await authApi.register({username, email, password});
            if (response.requiresVerification) {
                setPendingVerification({ email });
                throw new Error('Registration successful! Please check your email for verification code.');
            } else {
                setAuthToken(response.token);
                setUser(response.user);
                setPendingVerification(null);
            }
        } catch (error) {
            throw error;
        }
    };

    const setupFirstAdmin = async (email: string, password: string) => {
        try {
            const response = await authApi.setupFirstAdmin({username: 'admin', email, password});
            setAuthToken(response.token);
            setUser(response.user);
            setNeedsOnboarding(false);
        } catch (error) {
            throw error;
        }
    };

    const updateProfile = async (username: string) => {
        try {
            const updatedUser = await authApi.updateProfile({username});
            setUser(updatedUser);
        } catch (error) {
            throw error;
        }
    };

    const uploadProfilePicture = async (file: File) => {
        try {
            const updatedUser = await authApi.uploadProfilePicture(file);
            setUser(updatedUser);
        } catch (error) {
            throw error;
        }
    };

    const deleteProfilePicture = async () => {
        try {
            const updatedUser = await authApi.deleteProfilePicture();
            setUser(updatedUser);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        removeAuthToken();
        setUser(null);
        setPendingVerification(null);
    };

    const clearPendingVerification = () => {
        setPendingVerification(null);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        needsOnboarding,
        pendingVerification,
        checkOnboardingStatus,
        login,
        register,
        setupFirstAdmin,
        updateProfile,
        uploadProfilePicture,
        deleteProfilePicture,
        logout,
        isAuthenticated: !!user,
        clearPendingVerification,
        setUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
