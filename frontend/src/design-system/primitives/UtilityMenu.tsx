import type { ReactNode } from 'react'
import { Accessibility } from 'lucide-react'
import { Popover } from 'radix-ui'

export type UtilityMenuProps = {
  /** Visible label of the button on wide screens and its accessible name everywhere, e.g. "Dostępność". */
  label: string
  /** Heading of the open panel. */
  title: ReactNode
  children: ReactNode
}

/**
 * Compact menu for settings that belong to the whole app (text size, contrast, motion). A small labelled button in
 * the header opens a panel; focus moves into it, Escape closes it and focus returns to the button. On phones the
 * button shows the icon only, and the label stays as its accessible name.
 */
export function UtilityMenu({ label, title, children }: UtilityMenuProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-touch items-center gap-2 rounded-button border border-border-strong px-3 text-body-sm font-medium text-text-primary transition-control press hover:bg-surface-solid data-[state=open]:bg-surface-solid sm:px-4"
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
          className="z-50 grid w-[min(21rem,calc(100vw-2.5rem))] gap-5 rounded-card p-5 surface-overlay animate-pop-in data-[state=closed]:animate-pop-out"
        >
          <p className="text-body font-semibold">{title}</p>
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
