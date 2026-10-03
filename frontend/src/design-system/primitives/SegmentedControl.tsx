import type { ReactNode } from 'react'
import { ToggleGroup } from 'radix-ui'
import { cn } from '@/lib/utils'

export type SegmentedOption<T extends string> = {
  value: T
  label: ReactNode
  /** Accessible name when the visible label is terse, e.g. "A+" → "Tekst większy". */
  ariaLabel?: string
  disabled?: boolean
}

export type SegmentedControlProps<T extends string> = {
  /** Names the group for screen readers. */
  label: string
  options: SegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
  size?: 'sm' | 'md'
  fullWidth?: boolean
  className?: string
}

/**
 * One-of-many switch in a milky capsule; the active segment is graphite. Arrow keys move between segments.
 * A selection cannot be cleared — clicking the active segment keeps it.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  size = 'md',
  fullWidth = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        if (next) {
          onValueChange(next as T)
        }
      }}
      className={cn(
        'inline-flex gap-1 rounded-button border border-border-subtle bg-surface-solid p-1',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          disabled={option.disabled}
          className={cn(
            'touch-hitbox inline-flex items-center justify-center gap-2 rounded-control px-4 font-medium whitespace-nowrap transition-control press',
            'text-text-muted not-disabled:hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=on]:bg-surface-active data-[state=on]:text-text-inverse data-[state=on]:shadow-primary',
            size === 'sm' ? 'min-h-9 text-label' : 'min-h-10 text-body-sm',
            fullWidth && 'flex-1',
          )}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
