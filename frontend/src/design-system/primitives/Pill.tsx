import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PillProps = ComponentProps<'button'> & {
  /** Selected pills are graphite; the state is exposed as aria-pressed. */
  selected?: boolean
  icon?: ReactNode
  /** Optional count after the label, e.g. number of results for a filter. */
  count?: number
}

/**
 * Compact capsule toggle for filters and quick choices. Looks 36 px high but keeps a 44 px hit area.
 */
export function Pill({ selected = false, icon, count, className, children, type = 'button', ...props }: PillProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'touch-hitbox inline-flex min-h-9 shrink-0 items-center gap-2 rounded-button border px-4 text-label font-medium whitespace-nowrap',
        'transition-control press [&_svg]:size-icon-sm [&_svg]:shrink-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-transparent bg-surface-active text-text-inverse shadow-primary'
          : 'border-border-highlight bg-surface-glass-strong text-text-muted shadow-control not-disabled:hover:-translate-y-px not-disabled:hover:text-text-primary',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
      {count !== undefined && <span className="tabular">{count}</span>}
    </button>
  )
}
