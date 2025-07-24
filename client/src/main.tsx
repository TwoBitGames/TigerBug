import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router.tsx'
import { AuthProvider } from "@/contexts/AuthContext.tsx";
import { BrandingProvider } from "@/contexts/BrandingContext.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { DialogProvider } from "@/contexts/DialogContext.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
            <BrandingProvider>
                <AuthProvider>
                    <DialogProvider>
                        <RouterProvider router={router} />
                    </DialogProvider>
                </AuthProvider>
            </BrandingProvider>
        </ThemeProvider>
    </StrictMode>,
)
