import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type TopBarProps = {
  /** Back button, avatar or brand. */
  leading?: ReactNode
  /** Centred title or navigation; stays geometrically centred whatever the side widths are. */
  title?: ReactNode
  /** Heading level of a text title; `div` when `title` is navigation or the page h1 lives elsewhere. */
  titleAs?: 'h1' | 'h2' | 'div'
  /** One or two icon actions. */
  trailing?: ReactNode
  className?: string
}

/** 56 px bar: leading · centred title · trailing. No separator line — air and material do the separating. */
export function TopBar({ leading, title, titleAs: Title = 'div', trailing, className }: TopBarProps) {
  return (
    // The middle track may shrink to 0 so a long title truncates instead of pushing the side actions out.
    <div className={cn('grid min-h-14 grid-cols-[1fr_minmax(0,max-content)_1fr] items-center gap-2', className)}>
      <div className="flex min-w-0 items-center justify-start gap-2">{leading}</div>
      {/* Only text titles truncate: overflow:hidden on navigation would clip the links' focus outline. */}
      <Title className={cn('min-w-0 text-center text-body font-medium', typeof title === 'string' && 'truncate')}>
        {title}
      </Title>
      <div className="flex min-w-0 items-center justify-end gap-2">{trailing}</div>
    </div>
  )
}
