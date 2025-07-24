import {Github, Youtube, Gamepad2, Twitter, Linkedin, Facebook, Instagram, MessageSquare} from 'lucide-react';
import {useBranding} from '../contexts/BrandingContext';

const SOCIAL_ICONS = {
    github: Github,
    youtube: Youtube,
    steam: Gamepad2,
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    instagram: Instagram,
    discord: MessageSquare,
} as const;

export const Footer = () => {
    const {brandingConfig} = useBranding();

    return (
        <footer
            className="border-t border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 mt-auto">
            <div className="container py-6 px-4">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                    <div className="text-center md:text-left">
                        <div className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} <b>TigerBug</b> by TwoBit Games. All rights reserved.
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {brandingConfig?.social_links && Object.entries(brandingConfig.social_links)
                            .filter(([, url]) => url && url.trim() !== '')
                            .map(([platform, url]) => {
                                const IconComponent = SOCIAL_ICONS[platform as keyof typeof SOCIAL_ICONS];
                                if (!IconComponent) return null;

                                return (
                                    <a
                                        key={platform}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                    >
                                        <IconComponent className="h-5 w-5"/>
                                    </a>
                                );
                            })}
                    </div>
                </div>
            </div>
        </footer>
    );
}
