import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router.tsx'
import { AuthProvider } from "@/contexts/AuthContext.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { DialogProvider } from "@/contexts/DialogContext.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
            <AuthProvider>
                <DialogProvider>
                    <RouterProvider router={router} />
                </DialogProvider>
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>,
)
