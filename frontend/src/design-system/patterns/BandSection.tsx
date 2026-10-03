import { useId, type ReactNode } from 'react'
import { PageContainer } from '../primitives/PageContainer'

export type BandSectionProps = {
  title: ReactNode
  children: ReactNode
}

/**
 * One section of the information band: the title in the first three columns, the content in the other nine.
 * Every section of the band uses this geometry, so they read as one system. Sections are separated by the
 * band's own lines (see StartTemplate), not by boxes.
 */
export function BandSection({ title, children }: BandSectionProps) {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId}>
      <PageContainer className="grid gap-x-6 gap-y-6 py-10 lg:grid-cols-12 lg:py-12">
        <h2 id={titleId} className="text-section-title font-medium tracking-display lg:col-span-3">
          {title}
        </h2>
        <div className="lg:col-span-9">{children}</div>
      </PageContainer>
    </section>
  )
}
