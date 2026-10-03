import { cn } from '@/lib/utils'

type BrandMarkProps = {
  /** `full` adds the name; `mark` is the glyph alone (AuthTemplate). */
  variant?: 'full' | 'mark'
  className?: string
}

/**
 * Castor's glyph and wordmark: an open ring with a dot in its mouth - a problem and the solution that fits it.
 * Decorative when it sits inside a link that names it.
 */
export function BrandMark({ variant = 'full', className }: BrandMarkProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg aria-hidden viewBox="0 0 32 32" className="size-8 shrink-0 text-surface-active" fill="none">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path
          d="M21.7 11.1a7.3 7.3 0 1 0 0 9.8"
          stroke="var(--color-text-inverse)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="22" cy="16" r="2.1" fill="var(--color-text-inverse)" />
      </svg>
      {variant === 'full' && <span className="text-logo font-semibold tracking-display">Castor</span>}
    </span>
  )
}
