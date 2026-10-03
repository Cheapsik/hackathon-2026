import type { ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SoftButton } from './SoftButton'

export type ErrorStateProps = {
  title?: ReactNode
  /** What went wrong, in plain words — typically ApiError.message from the backend. */
  description?: ReactNode
  /** Shows "Spróbuj ponownie"; omit when retrying cannot help. */
  onRetry?: () => void
  retrying?: boolean
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4'
  className?: string
}

/** Failure that blocks a region. Announced at once (role="alert") and offers a retry when it makes sense. */
export function ErrorState({
  title = 'Nie udało się wczytać danych',
  description,
  onRetry,
  retrying = false,
  titleAs: Title = 'h2',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('mx-auto grid max-w-narrow justify-items-center gap-4 px-gutter py-10 text-center', className)}
    >
      <span className="grid size-16 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert aria-hidden className="size-icon-lg" strokeWidth={1.5} />
      </span>
      <div className="grid gap-2">
        <Title className="font-display text-section-title tracking-display">{title}</Title>
        {description && <p className="text-body-sm text-text-muted">{description}</p>}
      </div>
      {onRetry && (
        <SoftButton icon={<RotateCcw aria-hidden />} loading={retrying} onClick={onRetry}>
          Spróbuj ponownie
        </SoftButton>
      )}
    </div>
  )
}
