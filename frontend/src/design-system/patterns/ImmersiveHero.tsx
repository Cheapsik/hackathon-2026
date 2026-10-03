import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ImageFallback } from '../primitives/ImageFallback'

export type ImmersiveHeroProps = {
  title: ReactNode
  titleId?: string
  titleAs?: 'h1' | 'h2'
  /** One or two short lines, about 30–34 characters each. */
  lead?: ReactNode
  /** Full-bleed photo. Without it the neutral media fallback is used. */
  image?: { src?: string | null; alt: string }
  /** Control in the top-left safe area, usually a back IconButton (variant="on-media"). */
  leading?: ReactNode
  /** Up to two controls in the top-right safe area. */
  trailing?: ReactNode
  /** Content resting on the bottom edge — normally CategoryOrbit. */
  children?: ReactNode
  className?: string
}

/**
 * Full-bleed media header of ImmersiveDetailTemplate: controls in the safe area, centred title and lead, and a
 * slot for the category orbit right above the curved sheet. A cool-grey scrim keeps the copy legible.
 * Must sit inside an element with the `immersive-geometry` utility.
 */
export function ImmersiveHero({
  title,
  titleId,
  titleAs: Title = 'h1',
  lead,
  image,
  leading,
  trailing,
  children,
  className,
}: ImmersiveHeroProps) {
  return (
    <div
      className={cn(
        'relative isolate flex h-[clamp(26rem,55dvh,32rem)] flex-col overflow-hidden text-on-media [--color-focus:var(--color-on-media)]',
        className,
      )}
    >
      <ImageFallback
        src={image?.src}
        alt={image?.alt ?? ''}
        width={1200}
        height={900}
        loading="eager"
        fetchPriority="high"
        hideFallbackIcon
        className="absolute inset-0 -z-20 size-full"
      />
      <div aria-hidden className="absolute inset-0 -z-10 media-scrim" />

      {(leading || trailing) && (
        <div className="flex items-center justify-between gap-2 px-gutter pt-[max(--spacing(3),env(safe-area-inset-top))]">
          <div className="flex gap-2">{leading}</div>
          <div className="flex gap-2">{trailing}</div>
        </div>
      )}

      <div className="mx-auto mt-10 grid max-w-80 justify-items-center gap-3 px-gutter text-center">
        <Title id={titleId} className="text-page-title font-medium tracking-display">
          {title}
        </Title>
        {lead && <p className="text-body-sm text-on-media-muted">{lead}</p>}
      </div>

      {children && (
        <div className="absolute inset-x-0 bottom-[calc(var(--sheet-overlap)-var(--sheet-arc-depth)+--spacing(2))] px-gutter lg:bottom-6">
          {children}
        </div>
      )}
    </div>
  )
}
