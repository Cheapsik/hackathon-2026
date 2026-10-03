import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PageContainer } from '../primitives/PageContainer'

export type OverviewTemplateProps = {
  /** Page h1, set in the display face. */
  title: ReactNode
  /** Short context above the title, e.g. the hub's name. */
  eyebrow?: ReactNode
  lead?: ReactNode
  /** At most two header actions (SoftButton, IconButton). */
  actions?: ReactNode
  /** Optional compact hero or summary panel under the header. */
  summary?: ReactNode
  /** Key numbers (MetricGroup) or quick actions. */
  highlights?: ReactNode
  /** Sections of the page (Section, SettingsGroup, DataList…). */
  children: ReactNode
  /** Context panel: beside the content from 1024 px, after it on phones. */
  aside?: ReactNode
  /** Mobile-only BottomActionDock for the page's main action. */
  dock?: ReactNode
}

/**
 * Home, dashboard, profile or "my stuff": header, optional summary and key numbers, then sections. On desktop
 * the content keeps a controlled width with an optional 360 px context panel — mobile cards are not stretched.
 */
export function OverviewTemplate({
  title,
  eyebrow,
  lead,
  actions,
  summary,
  highlights,
  children,
  aside,
  dock,
}: OverviewTemplateProps) {
  return (
    <PageContainer width="wide" className={cn('grid gap-8 pt-6 pb-10 md:pt-8', dock && 'pb-24 lg:pb-10')}>
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          {eyebrow && <p className="text-label font-medium text-text-muted">{eyebrow}</p>}
          <h1 className="font-display text-page-title tracking-display">{title}</h1>
          {lead && <p className="text-body text-text-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>

      {summary}
      {highlights}

      <div className={cn('grid gap-8', aside && 'lg:grid-cols-[minmax(0,1fr)_var(--container-aside)] lg:items-start')}>
        <div className="grid min-w-0 gap-8">{children}</div>
        {aside && <aside className="grid content-start gap-4 lg:sticky lg:top-6">{aside}</aside>}
      </div>

      {/* `contents` keeps the sticky dock a direct child of the page, so it floats over the whole page. */}
      {dock && <div className="contents lg:hidden">{dock}</div>}
    </PageContainer>
  )
}
