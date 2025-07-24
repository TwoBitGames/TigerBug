import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ToastItem {
  id: string
  title?: string
  description: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface DialogContextType {
  alert: (message: string, title?: string) => Promise<void>
  confirm: (message: string, title?: string) => Promise<boolean>
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>
  toast: (message: string, options?: { title?: string; variant?: 'default' | 'destructive' | 'success'; duration?: number }) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export const useDialog = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}

interface DialogProviderProps {
  children: ReactNode
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    title?: string
    message: string
    onClose: () => void
  } | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title?: string
    message: string
    onConfirm: (result: boolean) => void
  } | null>(null)

  const [promptDialog, setPromptDialog] = useState<{
    open: boolean
    title?: string
    message: string
    defaultValue?: string
    onSubmit: (result: string | null) => void
  } | null>(null)

  const [promptValue, setPromptValue] = useState('')
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const alert = useCallback((message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      setAlertDialog({
        open: true,
        title,
        message,
        onClose: () => {
          setAlertDialog(null)
          resolve()
        }
      })
    })
  }, [])

  const confirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        title,
        message,
        onConfirm: (result: boolean) => {
          setConfirmDialog(null)
          resolve(result)
        }
      })
    })
  }, [])

  const prompt = useCallback((message: string, defaultValue?: string, title?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptValue(defaultValue || '')
      setPromptDialog({
        open: true,
        title,
        message,
        defaultValue,
        onSubmit: (result: string | null) => {
          setPromptDialog(null)
          setPromptValue('')
          resolve(result)
        }
      })
    })
  }, [])

  const toast = useCallback((
    message: string, 
    options?: { 
      title?: string
      variant?: 'default' | 'destructive' | 'success'
      duration?: number 
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastItem = {
      id,
      title: options?.title,
      description: message,
      variant: options?.variant || 'default',
      duration: options?.duration || 5000
    }

    setToasts(prev => [...prev, newToast])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, newToast.duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt, toast }}>
      <ToastProvider>
        {children}
        
        {/* Alert Dialog */}
        <AlertDialog open={!!alertDialog?.open} onOpenChange={() => alertDialog?.onClose()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              {alertDialog?.title && <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>}
              <AlertDialogDescription>
                {alertDialog?.message.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < alertDialog.message.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={alertDialog?.onClose}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!confirmDialog?.open} onOpenChange={() => confirmDialog?.onConfirm(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              {confirmDialog?.title && <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>}
              <AlertDialogDescription>
                {confirmDialog?.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => confirmDialog?.onConfirm(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmDialog?.onConfirm(true)}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!promptDialog?.open} onOpenChange={() => promptDialog?.onSubmit(null)}>
          <DialogContent>
            <DialogHeader>
              {promptDialog?.title && <DialogTitle>{promptDialog.title}</DialogTitle>}
              <DialogDescription>
                {promptDialog?.message}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prompt-input" className="text-right">
                  Value
                </Label>
                <Input
                  id="prompt-input"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  className="col-span-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      promptDialog?.onSubmit(promptValue)
                    } else if (e.key === 'Escape') {
                      promptDialog?.onSubmit(null)
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => promptDialog?.onSubmit(null)}>
                Cancel
              </Button>
              <Button onClick={() => promptDialog?.onSubmit(promptValue)}>
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {toasts.map((toast) => (
          <Toast key={toast.id} variant={toast.variant} onOpenChange={() => removeToast(toast.id)}>
            <div className="grid gap-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              <ToastDescription>
                {toast.description.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < toast.description.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </DialogContext.Provider>
  )
}
