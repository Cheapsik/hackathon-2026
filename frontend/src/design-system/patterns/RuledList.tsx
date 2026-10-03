import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type RuledListItem = {
  id: string
  title: ReactNode
  description?: ReactNode
}

export type RuledListProps = {
  items: RuledListItem[]
  /** A real sequence (steps) gets numbers; an ordinary list does not. */
  numbered?: boolean
  className?: string
}

/**
 * Rows separated by hairlines instead of cards: an optional number, a title and a short description. The
 * information sections of a page are built from this, so they share one geometry.
 */
export function RuledList({ items, numbered = false, className }: RuledListProps) {
  const listClassName = cn('divide-y divide-border-subtle', className)
  const rows = items.map((item, index) => (
    <li
      key={item.id}
      className={cn('grid gap-x-4 py-5 first:pt-0 last:pb-0', numbered && 'grid-cols-[2rem_minmax(0,1fr)]')}
    >
      {numbered && (
        <span aria-hidden className="tabular text-body font-medium text-text-muted">
          {index + 1}
        </span>
      )}
      <div className="grid gap-1">
        <p className="text-body font-medium">{item.title}</p>
        {item.description && <p className="max-w-[60ch] text-body-sm text-text-muted">{item.description}</p>}
      </div>
    </li>
  ))

  // The explicit role keeps list semantics in Safari, which drops them when list-style is none.
  return numbered ? (
    // oxlint-disable-next-line jsx-a11y/no-redundant-roles
    <ol role="list" className={listClassName}>
      {rows}
    </ol>
  ) : (
    // oxlint-disable-next-line jsx-a11y/no-redundant-roles
    <ul role="list" className={listClassName}>
      {rows}
    </ul>
  )
}
