import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { cn } from '@/lib/utils'
import { IconButton } from './IconButton'

export type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Actions row; put the primary action last. */
  footer?: ReactNode
  size?: 'narrow' | 'default'
}

/**
 * Centred dialog on a ceramic panel. Radix traps focus, closes on Escape and returns focus to the trigger.
 * Use for short decisions; longer content on phones belongs in BottomSheet.
 */
export function Modal({ open, onOpenChange, title, description, children, footer, size = 'narrow' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim backdrop-blur-card animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2*var(--spacing-gutter))] w-[calc(100%-2*var(--spacing-gutter))] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto',
            'rounded-panel p-5 surface-overlay animate-pop-in data-[state=closed]:animate-pop-out md:p-6',
            size === 'narrow' ? 'max-w-narrow' : 'max-w-default',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-2">
              <Dialog.Title className="font-display text-page-title tracking-display">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-body-sm text-text-muted">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton label="Zamknij" icon={X} variant="ghost" showTooltip={false} />
            </Dialog.Close>
          </div>
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-2 pt-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
