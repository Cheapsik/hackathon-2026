import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const ceramicCardVariants = cva('rounded-card surface-ceramic', {
  variants: {
    padding: {
      none: '',
      md: 'p-4',
      lg: 'p-4 md:p-5',
    },
    interactive: {
      true: 'block transition-control press hover:-translate-y-px hover:shadow-floating',
    },
  },
  defaultVariants: { padding: 'md' },
})

export type CeramicCardProps = ComponentProps<'div'> &
  VariantProps<typeof ceramicCardVariants> & {
    /** Render the single child (e.g. a router Link or <article>) with the card's look. */
    asChild?: boolean
  }

/** Readable, nearly opaque foreground card for content and forms. `interactive` when the whole card is a link. */
export function CeramicCard({ className, padding, interactive, asChild = false, ...props }: CeramicCardProps) {
  const Comp = asChild ? Slot.Root : 'div'
  return (
    <Comp data-slot="ceramic-card" className={cn(ceramicCardVariants({ padding, interactive }), className)} {...props} />
  )
}
