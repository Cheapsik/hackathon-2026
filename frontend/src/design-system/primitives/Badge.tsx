import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-button px-3 py-1 text-label font-medium whitespace-nowrap [&_svg]:size-icon-sm [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'border border-border-subtle bg-surface-glass-strong text-text-muted',
        strong: 'bg-surface-active text-text-inverse',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: ReactNode
  /** Optional icon; the text must carry the meaning on its own (colour never does). */
  icon?: ReactNode
  className?: string
}

/** Small status label. Colour is reserved for status; neutral is the default. */
export function Badge({ tone, icon, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {icon}
      {children}
    </span>
  )
}
