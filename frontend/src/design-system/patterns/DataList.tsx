import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DataListItem = {
  label: ReactNode
  value: ReactNode
  /** Small context under the value, e.g. "średnia regionu 1,4". */
  hint?: ReactNode
}

export type DataListProps = {
  items: DataListItem[]
  /** `rows`: label left, value right (summaries). `stacked`: label above value (narrow cards). */
  layout?: 'rows' | 'stacked'
  /** Centre a short summary, e.g. fee and rate under a transaction. */
  align?: 'start' | 'center'
  className?: string
}

/** Label–value pairs as a real description list. Values use tabular digits. */
export function DataList({ items, layout = 'rows', align = 'start', className }: DataListProps) {
  return (
    <dl
      className={cn(
        'grid',
        layout === 'rows' ? 'divide-y divide-border-subtle' : 'grid-cols-2 gap-4',
        align === 'center' && 'justify-items-center text-center',
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            layout === 'rows' ? 'flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0' : 'grid gap-1',
            align === 'center' && 'justify-center',
          )}
        >
          <dt className="text-body-sm text-text-muted">{item.label}</dt>
          <dd className={cn('grid gap-1 tabular', layout === 'rows' && align === 'start' && 'text-right')}>
            <span className="text-body font-medium">{item.value}</span>
            {item.hint && <span className="text-label text-text-muted">{item.hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
