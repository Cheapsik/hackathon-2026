import { Fragment } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { problemReportStatusLabels, statusLabel } from '@/features/problem-reports/status-labels'
import { cn } from '@/lib/utils'

const statuses = Object.keys(problemReportStatusLabels)

/**
 * Where the report is now (SPEC §7 V), as a single centred line of steps joined by arrows. Finished steps carry a
 * check and the arrows before them turn green; the current step is the filled pill; the rest stay quiet. It shows the
 * current step, not a history: a message from the author moves an answered report back to analysis.
 */
export function StatusTimeline({ status }: { status: string }) {
  const currentIndex = statuses.indexOf(status)

  return (
    <>
      <p aria-live="polite" className="sr-only">
        Status zgłoszenia: {statusLabel(status)}.
      </p>
      <ol
        aria-label="Etapy zgłoszenia"
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 border-b border-border-subtle px-6 py-6 lg:px-12"
      >
        {statuses.map((step, index) => {
          const done = index < currentIndex
          const current = index === currentIndex
          const reached = index <= currentIndex

          return (
            <Fragment key={step}>
              {index > 0 && (
                <li role="presentation" aria-hidden="true" className="flex">
                  <ArrowRight
                    className={cn('size-5', reached ? 'text-accent' : 'text-border-strong')}
                    strokeWidth={1.75}
                  />
                </li>
              )}
              <li
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'inline-flex min-h-touch items-center gap-2 rounded-button px-4 text-lead transition-control',
                  current && 'bg-accent font-medium text-text-inverse',
                  done && 'font-medium text-text-primary',
                  !reached && 'text-text-muted',
                )}
              >
                {done && <Check aria-hidden className="size-4 text-accent" strokeWidth={2.5} />}
                <span className="first-letter:uppercase">{problemReportStatusLabels[step]}</span>
                <span className="sr-only">{done ? ' (zrobione)' : current ? ' (teraz)' : ''}</span>
              </li>
            </Fragment>
          )
        })}
      </ol>
    </>
  )
}
