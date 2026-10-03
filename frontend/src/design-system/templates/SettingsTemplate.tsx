import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '../primitives/IconButton'
import { PageContainer } from '../primitives/PageContainer'

export type SettingsSection = {
  /** Anchor id; the section navigation links to it. */
  id: string
  /** Label in the section navigation. */
  label: string
  /** Usually one SettingsGroup. */
  content: ReactNode
}

export type SettingsTemplateProps = {
  title: ReactNode
  lead?: ReactNode
  onBack?: () => void
  sections: SettingsSection[]
  /** Destructive actions, kept apart at the end (SettingsGroup tone="danger"). */
  dangerZone?: ReactNode
}

/**
 * Preferences: compact header, groups of list rows on ceramic, destructive actions apart at the bottom.
 * Section navigation is a sticky side list from 1024 px and a scrolling row of links on phones.
 */
export function SettingsTemplate({ title, lead, onBack, sections, dangerZone }: SettingsTemplateProps) {
  const withNavigation = sections.length > 1

  return (
    <PageContainer width="wide" className="grid gap-6 pt-6 pb-10 md:pt-8">
      <header className="flex items-start gap-3">
        {onBack && <IconButton label="Wstecz" icon={ArrowLeft} onClick={onBack} />}
        <div className="grid gap-1">
          <h1 className="font-display text-page-title tracking-display">{title}</h1>
          {lead && <p className="text-body-sm text-text-muted">{lead}</p>}
        </div>
      </header>

      <div
        className={cn(
          'grid gap-6',
          withNavigation
            ? 'lg:grid-cols-[var(--container-aside)_minmax(0,var(--container-default))] lg:items-start'
            : 'max-w-default',
        )}
      >
        {withNavigation && (
          <nav aria-label="Sekcje ustawień" className="lg:sticky lg:top-6">
            <ul className="scrollbar-none -mx-gutter flex gap-2 overflow-x-auto px-gutter py-1 lg:mx-0 lg:grid lg:gap-1 lg:overflow-visible lg:rounded-card lg:p-2 lg:surface-glass">
              {sections.map((section) => (
                <li key={section.id} className="shrink-0">
                  <a
                    href={`#${section.id}`}
                    className="inline-flex min-h-touch items-center rounded-button border border-border-highlight bg-surface-glass-strong px-4 text-body-sm font-medium text-text-muted shadow-control transition-control hover:text-text-primary lg:flex lg:rounded-control lg:border-transparent lg:bg-transparent lg:shadow-none lg:hover:bg-surface-glass-strong"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className={cn('grid gap-8', withNavigation && 'lg:col-start-2')}>
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-6">
              {section.content}
            </div>
          ))}
          {dangerZone && <div className="border-t border-border-subtle pt-8">{dangerZone}</div>}
        </div>
      </div>
    </PageContainer>
  )
}
