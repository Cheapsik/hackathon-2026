import { Link } from 'react-router'
import { Inbox } from 'lucide-react'
import { CeramicCard, SoftButton } from '@/design-system'
import { adminSections } from '@/features/admin/admin-sections'
import { usePageTitle } from '@/hooks/use-page-title'

export function AdminHomePage() {
  usePageTitle('Panel administratora')

  return (
    <>
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Panel administratora</h1>
          <p className="text-body text-text-muted">
            Zacznij od skrzynki zgłoszeń - nowe zgłoszenia pojawiają się w niej na żywo.
          </p>
        </div>
        <SoftButton asChild variant="primary" icon={<Inbox aria-hidden />}>
          <Link to="/admin/zgloszenia">Skrzynka zgłoszeń</Link>
        </SoftButton>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => {
          const Icon = section.icon
          return (
            <li key={section.to} className="min-w-0">
              <CeramicCard asChild interactive padding="lg" className="h-full">
                <Link to={section.to} className="grid h-full content-between gap-4">
                  <span className="grid gap-2">
                    <Icon aria-hidden className="size-icon-lg text-text-muted" strokeWidth={1.75} />
                    <span className="font-display text-section-title tracking-display">{section.label}</span>
                    <span className="text-body-sm text-text-muted">{section.description}</span>
                  </span>
                </Link>
              </CeramicCard>
            </li>
          )
        })}
      </ul>
    </>
  )
}
