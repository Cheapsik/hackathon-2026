import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from './Tooltip'

const iconButtonVariants = cva(
  [
    'inline-grid shrink-0 place-items-center rounded-button border transition-control press',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        glass:
          'border-border-strong bg-surface-glass-strong text-text-primary not-disabled:hover:bg-surface-solid',
        ghost: 'border-transparent bg-transparent text-text-primary not-disabled:hover:bg-surface-solid',
        'on-media': 'surface-on-media not-disabled:hover:-translate-y-px',
      },
      size: {
        sm: 'size-9 touch-hitbox',
        md: 'size-touch',
        lg: 'size-14',
      },
      active: {
        true: 'border-transparent bg-surface-active text-text-inverse shadow-primary',
      },
    },
    defaultVariants: { variant: 'glass', size: 'md' },
  },
)

export type IconButtonProps = Omit<ComponentProps<'button'>, 'children'> &
  Omit<VariantProps<typeof iconButtonVariants>, 'active'> & {
    /** Accessible name; also shown as a tooltip on devices with a pointer. */
    label: string
    icon: LucideIcon
    /** Makes the button a toggle: sets aria-pressed and the graphite active look. */
    pressed?: boolean
    loading?: boolean
    showTooltip?: boolean
  }

/** Round icon-only button. Always named by `label`; never relies on the icon alone. */
export function IconButton({
  label,
  icon: Icon,
  variant,
  size,
  pressed,
  loading = false,
  showTooltip = true,
  className,
  type = 'button',
  onClick,
  ...props
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      data-active={pressed || undefined}
      className={cn(iconButtonVariants({ variant, size, active: pressed }), className)}
      onClick={(event) => (loading ? event.preventDefault() : onClick?.(event))}
      {...props}
    >
      {loading ? (
        <LoaderCircle aria-hidden className="size-icon animate-spin" />
      ) : (
        <Icon aria-hidden className={size === 'lg' ? 'size-icon-lg' : 'size-icon'} strokeWidth={1.65} />
      )}
    </button>
  )

  return showTooltip ? <Tooltip content={label}>{button}</Tooltip> : button
}
