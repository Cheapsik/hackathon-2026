import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { Toast as RadixToast } from 'radix-ui'
import { cn } from '@/lib/utils'
import { ToastContext, type ToastMessage } from './use-toast'

type ToastEntry = ToastMessage & { id: number; open: boolean }

const toneIcon = { neutral: Info, success: CircleCheck, danger: CircleAlert } as const
const toneClass = { neutral: 'text-text-muted', success: 'text-success', danger: 'text-danger' } as const

let nextToastId = 0

/**
 * Toast queue for confirmations after an action ("Zapisano"). Announced politely by Radix. Never the only place
 * for an important error — those stay inline (Field error, ErrorState).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  const showToast = useCallback((message: ToastMessage) => {
    nextToastId += 1
    setToasts((current) => [...current, { ...message, id: nextToastId, open: true }])
  }, [])

  const close = useCallback((id: number) => {
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)))
  }, [])

  const forget = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="down" duration={6000} label="Powiadomienie">
        {children}
        {toasts.map((toast) => {
          const tone = toast.tone ?? 'neutral'
          const Icon = toneIcon[tone]
          return (
            <RadixToast.Root
              key={toast.id}
              open={toast.open}
              onOpenChange={(open) => {
                if (!open) {
                  close(toast.id)
                }
              }}
              onAnimationEnd={() => {
                if (!toast.open) {
                  forget(toast.id)
                }
              }}
              className="flex items-start gap-3 rounded-card p-4 surface-floating animate-pop-in data-[state=closed]:animate-pop-out"
            >
              <Icon aria-hidden className={cn('mt-px size-icon shrink-0', toneClass[tone])} />
              <div className="grid flex-1 gap-1">
                <RadixToast.Title className="text-body-sm font-medium">{toast.title}</RadixToast.Title>
                {toast.description && (
                  <RadixToast.Description className="text-body-sm text-text-muted">
                    {toast.description}
                  </RadixToast.Description>
                )}
              </div>
              <RadixToast.Close
                aria-label="Zamknij powiadomienie"
                className="-m-2 grid size-touch shrink-0 place-items-center rounded-full text-text-muted transition-control hover:bg-surface-glass"
              >
                <X aria-hidden className="size-icon-sm" />
              </RadixToast.Close>
            </RadixToast.Root>
          )
        })}
        <RadixToast.Viewport className="fixed inset-x-0 bottom-0 z-50 mx-auto grid w-full max-w-narrow gap-2 p-gutter pb-[max(var(--spacing-gutter),env(safe-area-inset-bottom))]" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
