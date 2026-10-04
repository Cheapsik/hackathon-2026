import { Link, NavLink, Outlet, useMatch } from 'react-router'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { EmptyState, LoadingState, PageContainer, SoftButton } from '@/design-system'
import { adminSections } from '@/features/admin/admin-sections'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

/** Admin panel shell (module VI). Gates access and keeps section navigation on subpages. */
export function AdminLayout() {
  const session = useSession()
  const isHome = Boolean(useMatch({ path: '/admin', end: true }))

  if (!session) {
    return (
      <PageContainer width="wide" className="grid gap-8 pt-6 pb-16 md:pt-8">
        <LoadingState label="Sprawdzam uprawnienia…" />
      </PageContainer>
    )
  }

  if (session.role !== 'ADMIN') {
    return (
      <PageContainer width="wide" className="grid gap-8 pt-6 pb-16 md:pt-8">
        <header className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Panel administratora</h1>
          <p className="text-body text-text-muted">Ta część jest tylko dla pracowników ROPS.</p>
        </header>
        <EmptyState
          title="Brak dostępu"
          description={
            session.signedIn
              ? 'Twoje konto nie ma roli administratora. Poproś innego pracownika ROPS o nadanie uprawnień.'
              : 'Zaloguj się kontem z rolą administratora, żeby wejść do panelu.'
          }
          icon={ShieldAlert}
          action={
            !session.signedIn ? (
              <SoftButton asChild variant="primary">
                <Link to="/logowanie">Zaloguj się</Link>
              </SoftButton>
            ) : undefined
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide" className="grid gap-6 pt-6 pb-16 md:pt-8">
      {!isHome && (
        <nav aria-label="Sekcje panelu administratora" className="grid gap-3">
          <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />}>
            <Link to="/admin">Panel administratora</Link>
          </SoftButton>
          <ul className="scrollbar-none -mx-gutter flex gap-2 overflow-x-auto px-gutter py-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {adminSections.map((section) => {
              const Icon = section.icon
              return (
                <li key={section.to} className="shrink-0">
                  <NavLink
                    to={section.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex min-h-touch items-center gap-2 rounded-button border px-4 text-body-sm font-medium transition-control press',
                        isActive
                          ? 'border-transparent bg-surface-active text-text-inverse shadow-primary'
                          : 'border-border-highlight bg-surface-glass-strong text-text-muted hover:text-text-primary',
                      )
                    }
                  >
                    <Icon aria-hidden className="size-icon shrink-0" strokeWidth={1.75} />
                    {section.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
      <Outlet />
    </PageContainer>
  )
}
