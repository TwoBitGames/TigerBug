import {Github, Youtube, Gamepad2} from 'lucide-react';

export const Footer = () => {
    return (
        <footer
            className="border-t border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 mt-auto">
            <div className="container py-6 px-4">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                    <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} <b>TigerBug</b> by TwoBit Games.
                        All rights reserved.
                    </div>
                    <div className="flex items-center space-x-4">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="GitHub"
                        >
                            <Github className="h-5 w-5"/>
                        </a>
                        <a
                            href="https://youtube.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="YouTube"
                        >
                            <Youtube className="h-5 w-5"/>
                        </a>
                        <a
                            href="https://store.steampowered.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Steam"
                        >
                            <Gamepad2 className="h-5 w-5"/>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
