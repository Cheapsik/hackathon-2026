import { cn } from '@/lib/utils'
import { CeramicCard } from '../primitives/CeramicCard'
import { MetricValue, type MetricValueProps } from '../primitives/MetricValue'

export type MetricGroupItem = Omit<MetricValueProps, 'size' | 'align' | 'className'> & { id: string }

export type MetricGroupProps = {
  items: MetricGroupItem[]
  /** Columns from tablet up; phones always show two. */
  columns?: 2 | 3 | 4
  className?: string
}

const columnClass = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' } as const

/**
 * The few numbers that matter most on a screen, each on its own ceramic card. Keep it to 2–4 — a wall of
 * identical stat cards is exactly the generic dashboard this system avoids.
 */
export function MetricGroup({ items, columns = 3, className }: MetricGroupProps) {
  return (
    <ul className={cn('grid grid-cols-2 gap-3', columnClass[columns], className)}>
      {items.map(({ id, ...metric }) => (
        <li key={id}>
          <CeramicCard padding="lg" className="h-full">
            <MetricValue {...metric} />
          </CeramicCard>
        </li>
      ))}
    </ul>
  )
}
