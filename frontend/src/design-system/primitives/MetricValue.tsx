import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MetricTrend = {
  direction: 'up' | 'down' | 'flat'
  /** Text of the change, e.g. "+12% r/r". The arrow is decoration; this text carries the meaning. */
  label: string
  /** Whether the direction is good news. Colours the change; the text stays understandable without it. */
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export type MetricValueProps = {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  trend?: MetricTrend
  /** Third-level context, e.g. "Średnia regionu: 1,4 · dane 2024". */
  hint?: ReactNode
  size?: 'md' | 'lg'
  align?: 'start' | 'center'
  className?: string
}

const trendIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const
const sentimentClass = { positive: 'text-success', negative: 'text-danger', neutral: 'text-text-muted' } as const

/** A labelled number: serif value with tabular digits, optional unit, trend and context. */
export function MetricValue({
  label,
  value,
  unit,
  trend,
  hint,
  size = 'md',
  align = 'start',
  className,
}: MetricValueProps) {
  const TrendIcon = trend ? trendIcon[trend.direction] : null

  return (
    <div className={cn('grid gap-2', align === 'center' && 'justify-items-center text-center', className)}>
      <span className="text-label font-medium text-text-muted">{label}</span>
      <span
        className={cn(
          'flex items-baseline gap-1 font-display tracking-display tabular',
          size === 'lg' ? 'text-value' : 'text-page-title',
        )}
      >
        {value}
        {unit && <span className="font-sans text-body-sm tracking-ui text-text-muted">{unit}</span>}
      </span>
      {(trend || hint) && (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-text-muted">
          {trend && TrendIcon && (
            <span className={cn('inline-flex items-center gap-1 font-medium', sentimentClass[trend.sentiment ?? 'neutral'])}>
              <TrendIcon aria-hidden className="size-icon-sm" />
              <span className="tabular">{trend.label}</span>
            </span>
          )}
          {hint && <span className="tabular">{hint}</span>}
        </span>
      )}
    </div>
  )
}
