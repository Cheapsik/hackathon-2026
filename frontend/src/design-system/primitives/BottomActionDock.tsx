import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BottomActionDockProps = {
  /** Names the group of actions, e.g. "Działania dla tej innowacji". */
  label: string
  /** The one primary action (SoftButton variant="primary" fullWidth). */
  primary: ReactNode
  /** Optional icon action on the left. */
  leading?: ReactNode
  /** Optional icon action on the right. */
  trailing?: ReactNode
  /** `floating` sticks to the bottom of the viewport; `inline` sits in the flow (desktop forms). */
  placement?: 'floating' | 'inline' | 'floating-mobile'
  className?: string
}

const placementClass = {
  floating: 'sticky bottom-[max(var(--spacing-gutter),env(safe-area-inset-bottom))] z-30',
  inline: '',
  // From 1024 px the actions sit in the flow without the capsule (forms, transactions).
  'floating-mobile':
    'sticky bottom-[max(var(--spacing-gutter),env(safe-area-inset-bottom))] z-30 lg:static lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none',
} as const

/**
 * Milky capsule holding the view's main action, with at most two icon actions beside it. Leave bottom padding
 * under the content it floats over so it never covers the last line.
 */
export function BottomActionDock({
  label,
  primary,
  leading,
  trailing,
  placement = 'floating',
  className,
}: BottomActionDockProps) {
  return (
    <div
      // A set of actions, not of form fields — fieldset would mislead; a labelled group is the right semantics.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-label={label}
      className={cn(
        'mx-auto grid w-full max-w-narrow grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-button p-2 surface-floating',
        placementClass[placement],
        className,
      )}
    >
      {leading ?? <span />}
      {primary}
      {trailing ?? <span />}
    </div>
  )
}
