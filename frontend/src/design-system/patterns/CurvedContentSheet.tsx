import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type CurvedContentSheetProps = {
  /** id of the heading inside, which names the region. */
  labelledBy?: string
  children: ReactNode
  className?: string
}

/**
 * Light ceramic sheet that overlaps the hero with a wide, shallow concave arc (phones and tablets). From 1024 px
 * it becomes a plain ceramic panel beside the hero. Must sit inside `immersive-geometry`.
 */
export function CurvedContentSheet({ labelledBy, children, className }: CurvedContentSheetProps) {
  return (
    <div className="relative z-10 -mt-(--sheet-overlap) drop-shadow-sheet lg:mt-0 lg:drop-shadow-none">
      <section
        aria-labelledby={labelledBy}
        className={cn(
          'grid content-start justify-items-center gap-4 bg-surface-ceramic px-5 pb-[max(--spacing(8),env(safe-area-inset-bottom))] text-center',
          'max-lg:sheet-arc max-lg:pt-[calc(var(--sheet-arc-depth)+--spacing(3))]',
          'lg:rounded-panel lg:p-8 lg:surface-ceramic',
          className,
        )}
      >
        {/* Separator only: the sheet is not draggable, so the handle must not look like a control. */}
        <div aria-hidden className="h-1 w-8 rounded-button bg-border-subtle lg:hidden" />
        {children}
      </section>
    </div>
  )
}
