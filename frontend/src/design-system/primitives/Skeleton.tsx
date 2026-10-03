import { cn } from '@/lib/utils'

export type SkeletonProps = {
  /** Size and radius come from the caller, so the placeholder matches what replaces it (no layout shift). */
  className?: string
  shape?: 'line' | 'block' | 'circle'
}

const shapeClass = { line: 'h-4 rounded-button', block: 'rounded-card', circle: 'rounded-full' } as const

/** Shimmering placeholder. Hidden from assistive technology — pair it with LoadingState, which announces. */
export function Skeleton({ className, shape = 'line' }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'block skeleton',
        shapeClass[shape],
        className,
      )}
    />
  )
}
