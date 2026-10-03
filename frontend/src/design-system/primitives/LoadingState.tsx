import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

export type LoadingStateProps = {
  /** Announced to screen readers, e.g. "Wczytuję innowacje…". */
  label: string
  /** Placeholder shaped like the content; defaults to three text lines. */
  children?: ReactNode
  className?: string
}

/** Loading region: announces `label` through aria-live and shows skeletons shaped like the coming content. */
export function LoadingState({ label, children, className }: LoadingStateProps) {
  return (
    // <output> only allows phrasing content and the skeletons are blocks, so the live region is a div.
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
    <div role="status" aria-live="polite" className={cn('grid gap-3', className)}>
      <span className="sr-only">{label}</span>
      {children ?? (
        <>
          <Skeleton className="w-2/3" />
          <Skeleton className="w-full" />
          <Skeleton className="w-5/6" />
        </>
      )}
    </div>
  )
}
