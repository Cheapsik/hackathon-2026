import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepIndicatorProps = {
  /** Names of the steps, in order. */
  steps: string[]
  /** Index of the current step, from 0. Steps before it count as done. */
  current: number
  /** Names the list for assistive technology, e.g. "Etapy zgłoszenia". */
  label: string
  className?: string
}

/**
 * Where a person is in a short flow: one segment per step, with its number and name above it. Done steps carry a
 * check and a filled segment, the current one a filled segment and full-strength text, the rest stay quiet. State is
 * never carried by colour alone: the check, the weight and the hidden words say it too.
 */
export function StepIndicator({ steps, current, label, className }: StepIndicatorProps) {
  return (
    <ol aria-label={label} className={cn('grid auto-cols-fr grid-flow-col gap-2', className)}>
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current

        return (
          <li
            key={step}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'grid gap-2.5 text-label transition-control',
              active ? 'font-medium text-text-primary' : 'text-text-muted',
            )}
          >
            <span className="flex items-center gap-2">
              {done ? (
                <Check aria-hidden className="size-icon-sm shrink-0 text-accent" strokeWidth={2.5} />
              ) : (
                <span aria-hidden className="tabular">
                  {index + 1}
                </span>
              )}
              <span>
                {step}
                <span className="sr-only">{done ? ' (zrobione)' : active ? ' (teraz)' : ''}</span>
              </span>
            </span>
            <span
              aria-hidden
              className={cn('h-1 rounded-button transition-control', done || active ? 'bg-accent' : 'bg-border-subtle')}
            />
          </li>
        )
      })}
    </ol>
  )
}
