import type { ReactNode } from 'react'
import { Tabs as RadixTabs } from 'radix-ui'
import { cn } from '@/lib/utils'

export type TabItem = {
  value: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
}

export type TabsProps = {
  /** Names the tab list for screen readers. */
  label: string
  items: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
}

/** Tabs switch views of the same subject. Pills on a milky track; arrow keys move between tabs. */
export function Tabs({ label, items, value, defaultValue, onValueChange, className }: TabsProps) {
  return (
    <RadixTabs.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      className={cn('grid gap-4', className)}
    >
      <RadixTabs.List
        aria-label={label}
        className="scrollbar-none -mx-1 flex max-w-full gap-2 overflow-x-auto px-1 py-1"
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              'touch-hitbox inline-flex min-h-9 shrink-0 items-center rounded-button border px-4 text-label font-medium whitespace-nowrap',
              'transition-control press disabled:cursor-not-allowed disabled:opacity-50',
              'border-border-highlight bg-surface-glass-strong text-text-muted shadow-control hover:text-text-primary',
              'data-[state=active]:border-transparent data-[state=active]:bg-surface-active data-[state=active]:text-text-inverse data-[state=active]:shadow-primary',
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="animate-enter">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
