import type { ReactNode } from 'react'
import { Accessibility } from 'lucide-react'
import { Popover } from 'radix-ui'
import { cn } from '@/lib/utils'

export type UtilityMenuProps = {
  /** Visible label of the button on wide screens and its accessible name everywhere, e.g. "Dostępność". */
  label: string
  /** Heading of the open panel. */
  title: ReactNode
  /** `frame`: the button sits on the dusk frame of AppShell (light outline and text). */
  tone?: 'default' | 'frame'
  children: ReactNode
}

/**
 * Compact menu for settings that belong to the whole app (text size, contrast, motion). A small labelled button in
 * the header opens a panel; focus moves into it, Escape closes it and focus returns to the button. On phones the
 * button shows the icon only, and the label stays as its accessible name.
 */
export function UtilityMenu({ label, title, tone = 'default', children }: UtilityMenuProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex min-h-touch items-center gap-2 rounded-button border px-3 text-body-sm font-medium transition-control press sm:px-4',
            tone === 'frame'
              ? 'border-on-frame-line text-on-frame hover:bg-on-frame-line data-[state=open]:bg-on-frame-line'
              : 'border-border-strong text-text-primary hover:bg-surface-solid data-[state=open]:bg-surface-solid',
          )}
        >
          <Accessibility aria-hidden className="size-icon" strokeWidth={1.75} />
          <span className="max-sm:sr-only">{label}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 grid w-[min(21rem,calc(100vw-2.5rem))] gap-5 rounded-card p-5 text-text-primary surface-overlay animate-pop-in data-[state=closed]:animate-pop-out"
        >
          <p className="text-body font-semibold">{title}</p>
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
