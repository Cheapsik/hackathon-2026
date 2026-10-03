import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const softButtonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-button border font-medium leading-none whitespace-nowrap',
    'select-none transition-control press [&_svg]:size-icon [&_svg]:shrink-0',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-surface-active font-semibold text-text-inverse shadow-primary not-disabled:hover:bg-primary-hover',
        secondary:
          'border-border-strong bg-transparent text-text-primary not-disabled:hover:bg-surface-solid aria-pressed:border-transparent aria-pressed:bg-chip',
        ghost: 'border-transparent bg-transparent text-text-primary not-disabled:hover:bg-surface-solid',
        danger: 'border-transparent bg-danger font-semibold text-text-inverse not-disabled:hover:opacity-90',
      },
      size: {
        md: 'min-h-touch px-5 text-body-sm',
        lg: 'min-h-12 px-6 text-body-sm',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export type SoftButtonProps = ComponentProps<'button'> &
  VariantProps<typeof softButtonVariants> & {
    /** Render the single child (e.g. a router Link) with the button's look. */
    asChild?: boolean
    /** Keeps the button focusable, announces aria-busy and ignores clicks. */
    loading?: boolean
    icon?: ReactNode
    trailingIcon?: ReactNode
  }

/** Pill button. One `primary` per view; `secondary` for the rest, `ghost` inside dense groups. */
export function SoftButton({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  icon,
  trailingIcon,
  children,
  onClick,
  type,
  ...props
}: SoftButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <Comp
      data-slot="soft-button"
      className={cn(softButtonVariants({ variant, size, fullWidth }), className)}
      type={asChild ? undefined : (type ?? 'button')}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden className="animate-spin" /> : icon}
      <Slot.Slottable>{children}</Slot.Slottable>
      {trailingIcon}
    </Comp>
  )
}
