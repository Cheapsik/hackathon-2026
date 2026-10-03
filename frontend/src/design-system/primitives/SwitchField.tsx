import { useId, type ReactNode } from 'react'
import { Switch } from 'radix-ui'
import { cn } from '@/lib/utils'

export type SwitchFieldProps = {
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/**
 * On/off setting that takes effect immediately (display preferences). The state is carried by the thumb's
 * position and the track's fill, never by colour alone, and the whole row is the 44 px target.
 */
export function SwitchField({ label, description, checked, onCheckedChange, disabled, className }: SwitchFieldProps) {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined

  return (
    <div className={cn('flex min-h-touch items-center justify-between gap-4', className)}>
      <div className="grid gap-0.5">
        <label htmlFor={id} className="text-body-sm font-medium text-text-primary">
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-label text-text-muted">
            {description}
          </p>
        )}
      </div>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={descriptionId}
        className={cn(
          'touch-hitbox relative h-8 w-14 shrink-0 rounded-full border border-border-strong bg-surface-solid transition-control',
          'data-[state=checked]:border-transparent data-[state=checked]:bg-surface-active',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <Switch.Thumb
          className={cn(
            'block size-6 translate-x-1 rounded-full bg-text-muted transition-transform duration-(--duration-fast) ease-standard',
            'data-[state=checked]:translate-x-7 data-[state=checked]:bg-surface-ceramic',
          )}
        />
      </Switch.Root>
    </div>
  )
}
