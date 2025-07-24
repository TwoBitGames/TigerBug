import {createContext, useContext, useState} from 'react';
import type {ReactNode} from 'react';

interface ViewModeContextType {
    viewMode: 'list' | 'kanban';
    setViewMode: (mode: 'list' | 'kanban') => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
    const context = useContext(ViewModeContext);
    if (!context) {
        throw new Error('useViewMode must be used within a ViewModeProvider');
    }
    return context;
};

interface ViewModeProviderProps {
    children: ReactNode;
}

export const ViewModeProvider = ({children}: ViewModeProviderProps) => {
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    return (
        <ViewModeContext.Provider value={{viewMode, setViewMode}}>
            {children}
        </ViewModeContext.Provider>
    );
};
