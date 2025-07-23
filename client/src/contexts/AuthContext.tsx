import {createContext, useContext, useState, useEffect} from 'react';
import type {ReactNode} from 'react';
import type {User} from '../types';
import {authApi} from '../services/api';
import {setAuthToken, removeAuthToken} from '../lib/request';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
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

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const userData = await authApi.getProfile();
                    setUser(userData);
                } catch (error) {
                    removeAuthToken();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
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

    const logout = () => {
        removeAuthToken();
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
