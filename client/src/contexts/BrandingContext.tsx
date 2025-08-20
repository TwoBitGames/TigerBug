import {createContext, useContext, useState, useEffect} from 'react';
import type {ReactNode} from 'react';
import {publicApi} from '../services/api';
import {updateFavicon} from '../lib/favicon';
import type {BrandingConfig} from '../types';

interface BrandingContextType {
    brandingConfig: BrandingConfig | null;
    loading: boolean;
    refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};

interface BrandingProviderProps {
    children: ReactNode;
}

export const BrandingProvider = ({children}: BrandingProviderProps) => {
    const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshBranding = async () => {
        try {
            setLoading(true);
            const config = await publicApi.getBrandingConfig();
            setBrandingConfig(config);
        } catch (error) {
            console.error('Failed to load branding config:', error);
            setBrandingConfig({
                id: 1,
                app_name: 'TigerBug',
                logo_url: null,
                banner_url: null,
                social_links: null,
                client_url: null,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshBranding();
    }, []);

    useEffect(() => {
        if (brandingConfig) {
            updateFavicon(brandingConfig.logo_url);
        }
    }, [brandingConfig]);

    const value = {
        brandingConfig,
        loading,
        refreshBranding,
    };

    return (
        <BrandingContext.Provider value={value}>
            {children}
        </BrandingContext.Provider>
    );
};
