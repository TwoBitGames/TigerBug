import {useNavigate} from 'react-router-dom';
import {Button} from '../components/ui/button';
import {Home, ArrowLeft} from 'lucide-react';

export const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-[calc(100vh-theme(spacing.32))] flex items-center justify-center">
            <div className="container">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="relative mb-8">
                        <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text leading-none select-none">
                            404
                        </h1>
                        <div
                            className="absolute inset-0 text-9xl md:text-[12rem] font-bold text-primary/10 leading-none select-none blur-sm">
                            404
                        </div>
                    </div>

                    <div className="mb-8 space-y-4">
                        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                            Page Not Found
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                            The page you're looking for doesn't exist or has been moved.
                            Let's get you back on track.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            onClick={handleGoHome}
                            size="lg"
                            className="min-w-32"
                        >
                            <Home className="w-4 h-4 mr-2"/>
                            Go Home
                        </Button>

                        <Button
                            onClick={handleGoBack}
                            variant="outline"
                            size="lg"
                            className="min-w-32"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};