import { Outlet } from 'react-router-dom';
import { NavigationRouter } from './NavigationRouter';
import { Footer } from './Footer';
import { ViewModeProvider } from '../contexts/ViewModeContext';

export const Layout = () => {
  return (
    <ViewModeProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <NavigationRouter />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>
    </ViewModeProvider>
  );
};
