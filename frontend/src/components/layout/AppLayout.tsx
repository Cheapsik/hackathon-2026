import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import type { SessionResponse } from '@/api/generated/castor'
import { AccountLinks } from '@/components/layout/AccountLinks'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { BrandMark } from '@/components/layout/BrandMark'
import { DisplayControls } from '@/components/layout/DisplayControls'
import { AppShell, PageContainer, type AppShellNavGroup, type AppShellNavItem } from '@/design-system'
import { useDisplayPreferences } from '@/hooks/use-display-preferences'
import { useSession } from '@/hooks/use-session'

/**
 * The destinations of the home page header, in its order and words, each with the pages it holds. Threads and the
 * idea creator need an account; a report sent without one has its thread on "Śledź zgłoszenie".
 */
function navigationFor(session: SessionResponse | undefined): AppShellNavGroup[] {
  const signedIn = Boolean(session?.signedIn)
  const only = (condition: boolean, items: AppShellNavItem[]) => (condition ? items : [])

  const groups: AppShellNavGroup[] = [
    {
      label: 'Rozwiązania',
      to: '/opisz-problem',
      items: [
        { to: '/opisz-problem', label: 'Opisz problem' },
        { to: '/sledz', label: 'Śledź zgłoszenie' },
        { to: '/moje-zgloszenia', label: 'Moje zgłoszenia' },
        ...only(signedIn, [
          { to: '/watki', label: 'Moje wątki' },
          { to: '/zapytaj-eksperta', label: 'Zapytaj eksperta' },
        ]),
      ],
      match: ['/zgloszenie'],
    },
    {
      label: 'Wiedza',
      to: '/biblioteka',
      items: [
        { to: '/biblioteka', label: 'Biblioteka innowacji' },
        { to: '/obszary', label: 'Atlas wyzwań' },
        { to: '/materialy', label: 'Materiały' },
      ],
      match: ['/innowacje', '/mapa'],
    },
    {
      label: 'Pomysły',
      to: '/pomysly',
      items: [{ to: '/pomysly', label: 'Kreator pomysłów' }],
      match: ['/wnioski'],
    },
    {
      label: 'Testy',
      to: '/testy',
      items: [{ to: '/testy', label: 'Testy innowacji' }],
      match: ['/profil-testera'],
    },
  ]

  // Shown only to administrators; the API refuses everyone else anyway.
  if (session?.role === 'ADMIN') {
    groups.push({ label: 'Administracja', to: '/admin', items: [{ to: '/admin', label: 'Panel administratora' }] })
  }

  return groups
}

/**
 * Castor's chrome around every page (AppShell from the design system). After a navigation the focus moves to
 * <main>, so a screen reader starts reading the new page instead of staying on the clicked link.
 */
export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()
  // Compared with the previous path, not a "first render" flag: StrictMode runs effects twice on mount, which
  // used the flag up and moved focus (and scroll) to <main> on the very first load.
  const previousPathname = useRef(location.pathname)
  const [preferences, setPreferences] = useDisplayPreferences()
  const fullBleed =
    location.pathname === '/opisz-problem' ||
    location.pathname === '/logowanie' ||
    location.pathname === '/rejestracja' ||
    location.pathname === '/biblioteka' ||
    location.pathname.startsWith('/admin')
  const session = useSession()

  useEffect(() => {
    if (previousPathname.current === location.pathname) {
      return
    }

    previousPathname.current = location.pathname
    mainRef.current?.focus()
  }, [location.pathname])

  return (
    <AppShell
      brand={
        <Link to="/" aria-label="Castor, strona główna" className="inline-flex min-h-touch items-center rounded-control">
          <BrandMark />
        </Link>
      }
      navigation={navigationFor(session)}
      account={<AccountMenu />}
      accountLinks={<AccountLinks />}
      utilities={<DisplayControls preferences={preferences} onChange={setPreferences} />}
      footer="Regionalny Ośrodek Polityki Społecznej w Krakowie"
      mainRef={mainRef}
    >
      {fullBleed ? (
        <Outlet />
      ) : (
        <PageContainer className="grid gap-6 py-10">
          <Outlet />
        </PageContainer>
      )}
    </AppShell>
  )
}
