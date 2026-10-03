import { cn } from '@/lib/utils'

type BrandMarkProps = {
  /** `full` is the wordmark; `mark` is the glyph alone (AuthTemplate). */
  variant?: 'full' | 'mark'
  className?: string
}

/**
 * Castor's wordmark: the CASTOR of the home page scene, set small in the same bold cut and colour of the text
 * around it. The glyph (`mark`) is an open ring with a dot in its mouth - a problem and the solution that fits it.
 * Decorative when it sits inside a link that names it.
 */
export function BrandMark({ variant = 'full', className }: BrandMarkProps) {
  if (variant === 'mark') {
    return (
      <svg aria-hidden viewBox="0 0 32 32" className={cn('size-8 shrink-0 text-surface-active', className)} fill="none">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path
          d="M21.7 11.1a7.3 7.3 0 1 0 0 9.8"
          stroke="var(--color-text-inverse)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="22" cy="16" r="2.1" fill="var(--color-text-inverse)" />
      </svg>
    )
  }

  return <span className={cn('text-logo font-bold tracking-display', className)}>CASTOR</span>
}
