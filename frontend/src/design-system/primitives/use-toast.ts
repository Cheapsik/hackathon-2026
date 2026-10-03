import { createContext, useContext } from 'react'

export type ToastTone = 'neutral' | 'success' | 'danger'

export type ToastMessage = {
  title: string
  description?: string
  tone?: ToastTone
}

export type ToastContextValue = { showToast: (message: ToastMessage) => void }

export const ToastContext = createContext<ToastContextValue | null>(null)

/** `showToast({ title, description, tone })` from anywhere under DesignSystemProvider. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside DesignSystemProvider.')
  }
  return context
}
