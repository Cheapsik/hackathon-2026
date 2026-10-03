import type { ReactNode } from 'react'
import { Check, Clock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CeramicCard } from '../primitives/CeramicCard'
import { DataList, type DataListItem } from './DataList'

export type ConfirmationPanelProps = {
  /** success: done; pending: accepted and waiting; review: check before confirming. */
  tone?: 'success' | 'pending' | 'review'
  title: ReactNode
  description?: ReactNode
  details?: DataListItem[]
  /** Next steps — one primary action at most. */
  actions?: ReactNode
  titleAs?: 'h1' | 'h2' | 'h3'
  className?: string
}

const toneIcon = { success: Check, pending: Clock, review: Info } as const
const toneClass = {
  success: 'bg-success-soft text-success',
  pending: 'bg-warning-soft text-warning',
  review: 'bg-surface-glass-strong text-text-primary',
} as const

/**
 * Outcome or review step of a flow. Success and pending states are announced (role="status"), so a screen
 * reader hears the result without hunting for it.
 */
export function ConfirmationPanel({
  tone = 'success',
  title,
  description,
  details,
  actions,
  titleAs: Title = 'h2',
  className,
}: ConfirmationPanelProps) {
  const Icon = toneIcon[tone]

  return (
    <div
      role={tone === 'review' ? undefined : 'status'}
      className={cn('grid justify-items-center gap-5 text-center animate-enter', className)}
    >
      <span className={cn('grid size-16 place-items-center rounded-full shadow-control', toneClass[tone])}>
        <Icon aria-hidden className="size-icon-lg" strokeWidth={1.75} />
      </span>
      <div className="grid max-w-narrow gap-2">
        <Title className="font-display text-page-title tracking-display">{title}</Title>
        {description && <p className="text-body-sm text-text-muted">{description}</p>}
      </div>
      {details && details.length > 0 && (
        <CeramicCard padding="lg" className="w-full max-w-narrow text-left">
          <DataList items={details} />
        </CeramicCard>
      )}
      {actions && <div className="flex w-full max-w-narrow flex-col gap-2 sm:flex-row sm:justify-center">{actions}</div>}
    </div>
  )
}
