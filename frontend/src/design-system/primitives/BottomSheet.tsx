import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { cn } from '@/lib/utils'
import { IconButton } from './IconButton'

export type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** Visually hide the title (still announced) when the content names itself. */
  hideTitle?: boolean
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Sheet that slides up from the bottom edge — menus, pickers and longer forms on phones. Same focus and Escape
 * behaviour as Modal. The handle is decoration only: the sheet is not draggable.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  children,
  footer,
  className,
}: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim backdrop-blur-card animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto grid max-h-[88dvh] w-full max-w-panel grid-rows-[auto_1fr_auto] rounded-t-panel surface-overlay',
            'pb-[max(var(--spacing-gutter),env(safe-area-inset-bottom))] animate-sheet-in data-[state=closed]:animate-sheet-out',
            className,
          )}
        >
          <div className="grid gap-3 px-5 pt-3">
            <div aria-hidden className="mx-auto h-1 w-8 rounded-button bg-border-subtle" />
            <div className="flex items-start justify-between gap-4">
              <div className={cn('grid gap-1 pt-2', hideTitle && 'sr-only')}>
                <Dialog.Title className="text-section-title font-medium">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="text-body-sm text-text-muted">{description}</Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <IconButton label="Zamknij" icon={X} variant="ghost" showTooltip={false} className="ml-auto" />
              </Dialog.Close>
            </div>
          </div>
          <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap gap-2 px-5 pt-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
