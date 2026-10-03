import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const softButtonVariants = cva(
  [
    'group/button inline-flex items-center justify-center gap-2 rounded-button border font-medium leading-none whitespace-nowrap',
    'select-none transition-control press [&_svg]:size-icon [&_svg]:shrink-0',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-surface-active text-text-inverse shadow-primary not-disabled:hover:bg-primary-hover',
        secondary:
          'border-border-strong bg-transparent text-text-primary not-disabled:hover:bg-surface-solid aria-pressed:border-transparent aria-pressed:bg-chip',
        ghost: 'border-transparent bg-transparent text-text-primary not-disabled:hover:bg-surface-solid',
        danger: 'border-transparent bg-danger text-text-inverse not-disabled:hover:opacity-90',
      },
      size: {
        md: 'min-h-touch px-5 text-body-sm',
        lg: 'min-h-14 px-7 text-body',
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
    /**
     * The home page's arrow in a circle at the end: the action takes the person to the next step of a flow
     * ("Znajdź rozwiązania"). Not for links out or for actions that stay on the step.
     */
    forward?: boolean
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
  forward = false,
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
      className={cn(softButtonVariants({ variant, size, fullWidth }), forward && 'justify-between pr-2', className)}
      type={asChild ? undefined : (type ?? 'button')}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden className="animate-spin" /> : icon}
      <Slot.Slottable>{children}</Slot.Slottable>
      {trailingIcon}
      {forward && (
        <span
          aria-hidden
          className="ml-2 grid size-10 place-items-center rounded-button bg-[color-mix(in_srgb,currentColor_18%,transparent)] transition-transform duration-(--duration-base) ease-emphasis group-hover/button:translate-x-0.5"
        >
          <ArrowRight strokeWidth={2} />
        </span>
      )}
    </Comp>
  )
}
