import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '../primitives/IconButton'

export type CardCarouselProps<T> = {
  /** Names the carousel region, e.g. "Wyróżnione innowacje". */
  label: string
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  className?: string
}

/**
 * Horizontally scrolling row of cards with snap points. Touch users swipe; pointer users get previous/next
 * buttons, disabled at the ends. Each card is about 80% of a phone's width so the next one peeks in.
 */
export function CardCarousel<T>({ label, items, getKey, renderItem, className }: CardCarouselProps<T>) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ atStart: true, atEnd: false })

  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) {
      return
    }
    setEdges({
      atStart: track.scrollLeft <= 1,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
    })
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges, items.length])

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current
    track?.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section aria-label={label} aria-roledescription="karuzela" className={cn('grid gap-3', className)}>
      <div className="hidden justify-end gap-2 pointer-fine:flex">
        <IconButton label="Poprzednie" icon={ChevronLeft} size="sm" disabled={edges.atStart} onClick={() => scrollByPage(-1)} />
        <IconButton label="Następne" icon={ChevronRight} size="sm" disabled={edges.atEnd} onClick={() => scrollByPage(1)} />
      </div>
      <ul
        ref={trackRef}
        onScroll={updateEdges}
        className="scrollbar-none -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter pt-1 pb-4 md:mx-0 md:scroll-px-0 md:px-0"
      >
        {items.map((item) => (
          <li key={getKey(item)} className="w-[min(80%,20rem)] shrink-0 snap-start">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </section>
  )
}
