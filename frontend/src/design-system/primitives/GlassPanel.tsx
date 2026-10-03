import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const glassPanelVariants = cva('rounded-panel surface-glass', {
  variants: {
    padding: {
      none: '',
      md: 'p-4',
      lg: 'p-4 md:p-5',
    },
  },
  defaultVariants: { padding: 'lg' },
})

export type GlassPanelProps = ComponentProps<'section'> &
  VariantProps<typeof glassPanelVariants> & {
    /** Render the single child (e.g. <aside> or <form>) with the panel's look. */
    asChild?: boolean
  }

/**
 * Large translucent layer that groups content. One glass layer is enough — never nest more than two blurred
 * surfaces; put CeramicCard inside instead.
 */
export function GlassPanel({ className, padding, asChild = false, ...props }: GlassPanelProps) {
  const Comp = asChild ? Slot.Root : 'section'
  return <Comp data-slot="glass-panel" className={cn(glassPanelVariants({ padding }), className)} {...props} />
}
