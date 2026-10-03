import { Children, useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SettingsGroupProps = {
  title: ReactNode
  description?: ReactNode
  /** `danger` sets the group apart for destructive actions (delete account, close call). */
  tone?: 'default' | 'danger'
  /** ListRow elements (or controls); each becomes one list item. */
  children: ReactNode
  className?: string
}

/** Titled ceramic group of ListRows — the building block of SettingsTemplate. */
export function SettingsGroup({ title, description, tone = 'default', children, className }: SettingsGroupProps) {
  const id = useId()

  return (
    <section aria-labelledby={id} className={cn('grid gap-2', className)}>
      <div className="grid gap-1 px-1">
        <h2 id={id} className={cn('text-body-sm font-medium', tone === 'danger' ? 'text-danger' : 'text-text-muted')}>
          {title}
        </h2>
        {description && <p className="text-label text-text-muted">{description}</p>}
      </div>
      <ul
        className={cn(
          'grid divide-y divide-border-subtle rounded-card p-1 surface-ceramic',
          tone === 'danger' && 'surface-danger-zone',
        )}
      >
        {Children.toArray(children).map((child, index) => (
          <li key={index} className="py-1 first:pt-0 last:pb-0">
            {child}
          </li>
        ))}
      </ul>
    </section>
  )
}
