import type { ReactNode } from 'react'
import { Tooltip as RadixTooltip } from 'radix-ui'

export type TooltipProps = {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/**
 * Hover/focus hint. Radix opens it for a mouse or the keyboard, not for touch, which is what DESIGN.md asks for:
 * tooltips on desktop, the aria-label alone on phones. Needs DesignSystemProvider above it.
 */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={8}
          collisionPadding={16}
          className="z-50 max-w-60 rounded-control px-3 py-2 text-label text-text-primary surface-floating animate-pop-in data-[state=closed]:animate-pop-out"
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
