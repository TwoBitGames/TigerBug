import {createContext, useContext, useState, useEffect, useRef} from 'react';
import type {ReactNode} from 'react';
import type {User} from '../types';
import {authApi} from '../services/api';
import {setAuthToken, removeAuthToken, RequestError} from '../lib/request';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    needsOnboarding: boolean;
    checkOnboardingStatus: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    setupFirstAdmin: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
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

    const login = async (email: string, password: string) => {
        try {
            const response = await authApi.login({email, password});
            setAuthToken(response.token);
            setUser(response.user);
        } catch (error) {
            throw error;
        }
    };

    const register = async (email: string, password: string) => {
        try {
            const response = await authApi.register({email, password});
            setAuthToken(response.token);
            setUser(response.user);
        } catch (error) {
            throw error;
        }
    };

    const setupFirstAdmin = async (email: string, password: string) => {
        try {
            const response = await authApi.setupFirstAdmin({email, password});
            setAuthToken(response.token);
            setUser(response.user);
            setNeedsOnboarding(false);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        removeAuthToken();
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        needsOnboarding,
        checkOnboardingStatus,
        login,
        register,
        setupFirstAdmin,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
