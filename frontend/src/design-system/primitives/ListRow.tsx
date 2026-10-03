import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export type ListRowProps = {
  title: ReactNode
  description?: ReactNode
  /** Icon, Avatar or small media on the left. */
  leading?: ReactNode
  /** Value, Badge or control on the right. Links and buttons get a chevron when this is empty. */
  trailing?: ReactNode
  /** Makes the row a router link. */
  to?: string
  /** Makes the row a button. Ignored when `to` is set. */
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  tone?: 'default' | 'danger'
  /** Puts `leading` in a tinted round chip (step numbers, roles) instead of leaving it bare. */
  chip?: boolean
  className?: string
}

/**
 * One line in a grouped list (settings, menus, results). Interactive rows are a single link or button with a
 * 44 px minimum height. Put rows in a <ul> — SettingsGroup and DataList do that for you.
 */
export function ListRow({
  title,
  description,
  leading,
  trailing,
  to,
  onClick,
  selected = false,
  disabled = false,
  tone = 'default',
  chip = false,
  className,
}: ListRowProps) {
  const interactive = Boolean(to || onClick)
  const rowClass = cn(
    'flex w-full min-h-touch items-center gap-3 rounded-control px-3 py-3 text-left',
    interactive && 'transition-control press hover:bg-surface-glass-strong',
    selected && 'bg-surface-glass-strong shadow-control',
    disabled && 'pointer-events-none opacity-50',
    tone === 'danger' && 'text-danger',
    className,
  )

  const content = (
    <>
      {leading && (
        <span
          className={cn(
            'grid shrink-0 place-items-center [&_svg]:size-icon-lg',
            chip ? 'size-11 rounded-full bg-chip text-body font-medium text-text-primary' : 'text-text-muted',
          )}
        >
          {leading}
        </span>
      )}
      <span className="grid min-w-0 flex-1 gap-1">
        <span className={cn('text-body font-medium', tone === 'danger' ? 'text-danger' : 'text-text-primary')}>
          {title}
        </span>
        {description && <span className="text-body-sm text-text-muted">{description}</span>}
      </span>
      {trailing ??
        (interactive && <ChevronRight aria-hidden className="size-icon shrink-0 text-text-muted" />)}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={rowClass}
        aria-current={selected ? 'page' : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
      >
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected || undefined} className={rowClass}>
        {content}
      </button>
    )
  }

  return <div className={rowClass}>{content}</div>
}
