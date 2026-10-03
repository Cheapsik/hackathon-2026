import { useId, type ReactNode } from 'react'
import { PageContainer } from '../primitives/PageContainer'

export type StartTemplateProps = {
  /** One line above the title: who runs the service. */
  eyebrow?: ReactNode
  /** The page h1. Phrase it as the question the tool answers; at most three lines on desktop. */
  title: ReactNode
  lead?: ReactNode
  /** The page's main tool (PromptCard inside its <form>). It is the one interactive surface of the first screen. */
  tool: ReactNode
  /** Information band (BandSection children) under the product area. */
  band?: ReactNode
}

/**
 * Entry screen of the product: the message on the left (columns 1–5), the tool on the right (columns 7–12), both
 * in one product area of about 540 px under the header, and the information band below, set apart by a
 * hairline and a lighter surface. The top of the band is visible in the first viewport.
 */
export function StartTemplate({ eyebrow, title, lead, tool, band }: StartTemplateProps) {
  const titleId = useId()

  return (
    <>
      <section aria-labelledby={titleId}>
        <PageContainer className="grid gap-x-6 gap-y-8 py-8 md:py-12 lg:min-h-[33.75rem] lg:grid-cols-12 lg:items-start lg:py-14">
          <header className="grid content-start gap-4 lg:col-span-5">
            {eyebrow && <p className="text-eyebrow font-medium text-text-muted">{eyebrow}</p>}
            <h1 id={titleId} className="text-hero font-medium tracking-hero text-wrap">
              {title}
            </h1>
            {lead && <p className="max-w-[36ch] text-lead text-text-muted">{lead}</p>}
          </header>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-9">{tool}</div>
        </PageContainer>
      </section>

      {band && <div className="divide-y divide-border-subtle border-t border-border-subtle bg-surface-solid">{band}</div>}
    </>
  )
}
