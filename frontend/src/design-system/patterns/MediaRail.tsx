import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageFallback } from '../primitives/ImageFallback'

export type MediaRailItem = {
  id: string
  label: string
  image?: { src?: string | null; alt: string }
}

export type MediaRailProps = {
  /** Names the list, e.g. "Filmy o innowacji". */
  label: string
  items: MediaRailItem[]
  activeId?: string
  onSelect: (id: string) => void
  className?: string
}

/**
 * Horizontal rail of round media chips (videos, recordings, related items). Four chips are visible on a phone;
 * the rest scroll. The selected chip gets the accent ring and stays aria-pressed.
 */
export function MediaRail({ label, items, activeId, onSelect, className }: MediaRailProps) {
  return (
    <ul
      aria-label={label}
      className={cn(
        // Bleeds into the sheet's 20 px padding so chips scroll edge to edge.
        'scrollbar-none -mx-5 flex w-[calc(100%+--spacing(10))] max-w-none snap-x snap-mandatory scroll-px-5 gap-2 overflow-x-auto px-5 py-2 sm:justify-center',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <li key={item.id} className="shrink-0 snap-start">
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(item.id)}
              className={cn(
                'relative grid size-18 place-items-center overflow-hidden rounded-full border-3 border-surface-ceramic shadow-card transition-control press',
                'hover:-translate-y-px',
                active && 'border-accent ring-4 ring-success-soft',
              )}
            >
              <ImageFallback
                src={item.image?.src}
                alt=""
                width={144}
                height={144}
                hideFallbackIcon
                className="absolute inset-0 size-full"
              />
              <span aria-hidden className="absolute inset-0 bg-linear-to-t from-scrim-strong to-transparent" />
              {active && <Play aria-hidden className="relative size-icon fill-on-media text-on-media" />}
              <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-center text-label leading-tight font-medium text-on-media">
                {item.label}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
