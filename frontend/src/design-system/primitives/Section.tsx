import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SectionProps = {
  /** Anchor for in-page links (scroll offset included). */
  id?: string
  title: ReactNode
  description?: ReactNode
  /** One link or button aligned with the title, e.g. "Zobacz wszystkie". */
  action?: ReactNode
  /** Visually hide the title (it still names the section for screen readers). */
  hideTitle?: boolean
  titleAs?: 'h2' | 'h3'
  children: ReactNode
  className?: string
}

/** Titled block of a page, labelled by its heading. Sections are separated by 24–32 px of air, not by lines. */
export function Section({
  id: anchorId,
  title,
  description,
  action,
  hideTitle = false,
  titleAs: Title = 'h2',
  children,
  className,
}: SectionProps) {
  const id = useId()

  return (
    <section id={anchorId} aria-labelledby={id} className={cn('grid scroll-mt-6 gap-4', className)}>
      <div className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-2', hideTitle && 'sr-only')}>
        <div className="grid gap-1">
          <Title id={id} className="text-section-title font-medium">
            {title}
          </Title>
          {description && <p className="max-w-default text-body-sm text-text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
