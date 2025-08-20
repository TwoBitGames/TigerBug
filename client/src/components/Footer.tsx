import {Globe, Linkedin} from 'lucide-react';
import {useBranding} from '../contexts/BrandingContext';
import {
    SiGithub,
    SiYoutube,
    SiSteam,
    SiX,
    SiFacebook,
    SiInstagram,
    SiDiscord
} from '@icons-pack/react-simple-icons';

const SOCIAL_ICONS = {
    github: SiGithub,
    youtube: SiYoutube,
    steam: SiSteam,
    twitter: SiX,
    linkedin: Linkedin,
    facebook: SiFacebook,
    instagram: SiInstagram,
    discord: SiDiscord,
    website: Globe,
} as const;

const COPYRIGHT_URL = 'https://github.com/TwoBitGames/TigerBug';

export const Footer = () => {
    const {brandingConfig} = useBranding();

    return (
        <footer
            className="border-t border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 mt-auto">
            <div className="container py-6 px-4">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                    <div className="text-center md:text-left">
                        <div className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} <a href={COPYRIGHT_URL} target="_blank"
                                                            className="text-muted-foreground hover:text-foreground transition-colors font-bold"
                                                            rel="noopener noreferrer">TigerBug</a> by TwoBit Games.
                            All rights reserved.
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {brandingConfig?.social_links && Object.entries(brandingConfig.social_links)
                            .filter(([, url]) => url && url.trim() !== '')
                            .map(([platform, url]) => {
                                const IconComponent = SOCIAL_ICONS[platform as keyof typeof SOCIAL_ICONS];
                                if (!IconComponent) return null;

                                const isLucideIcon = platform === 'website' || platform === 'linkedin';

                                return (
                                    <a
                                        key={platform}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                    >
                                        {isLucideIcon ? (
                                            <IconComponent className="h-5 w-5"/>
                                        ) : (
                                            <IconComponent size={20} />
                                        )}
                                    </a>
                                );
                            })}
                    </div>
                </div>
            </div>
        </footer>
    );
}
