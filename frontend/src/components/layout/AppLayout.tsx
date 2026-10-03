import { useEffect, useRef } from 'react'
import { BookOpen, CircleHelp, Files, FlaskConical, House, Library, Lightbulb, Map, MessageSquareText, MessagesSquare, Search, ShieldCheck } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import type { SessionResponse } from '@/api/generated/castor'
import { AccountLinks } from '@/components/layout/AccountLinks'
import { BrandMark } from '@/components/layout/BrandMark'
import { DisplayControls } from '@/components/layout/DisplayControls'
import { AppShell, PageContainer, type AppShellNavItem } from '@/design-system'
import { useDisplayPreferences } from '@/hooks/use-display-preferences'
import { useSession } from '@/hooks/use-session'

const navigation: AppShellNavItem[] = [
  { to: '/', label: 'Strona główna', icon: House, end: true },
  { to: '/opisz-problem', label: 'Opisz problem', icon: MessageSquareText },
  { to: '/sledz', label: 'Śledź zgłoszenie', icon: Search },
  { to: '/moje-zgloszenia', label: 'Moje zgłoszenia', icon: Files },
  { to: '/obszary', label: 'Atlas wyzwań', icon: Map },
  { to: '/biblioteka', label: 'Biblioteka innowacji', icon: Library },
  { to: '/materialy', label: 'Materiały', icon: BookOpen },
  { to: '/testy', label: 'Testy innowacji', icon: FlaskConical },
]

/** Threads need an account; a report sent without one has its thread on "Śledź zgłoszenie". */
const signedInNavigation: AppShellNavItem[] = [
  { to: '/watki', label: 'Moje wątki', icon: MessagesSquare },
  { to: '/zapytaj-eksperta', label: 'Zapytaj eksperta', icon: CircleHelp },
  { to: '/pomysly', label: 'Kreator pomysłów', icon: Lightbulb },
]

/** Shown only to administrators; the API refuses everyone else anyway. */
const adminNavigation: AppShellNavItem = { to: '/admin', label: 'Panel administratora', icon: ShieldCheck }

function navigationFor(session: SessionResponse | undefined): AppShellNavItem[] {
  if (!session?.signedIn) {
    return navigation
  }

  if (session.role === 'ADMIN') {
    return [...navigation, ...signedInNavigation, adminNavigation]
  }

  return [...navigation, ...signedInNavigation]
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
    location.pathname === '/' ||
    location.pathname === '/logowanie' ||
    location.pathname === '/rejestracja' ||
    location.pathname === '/biblioteka' ||
    location.pathname.startsWith('/admin')
  const session = useSession()
  const links = navigationFor(session)

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
        <Link to="/" aria-label="Castor, strona główna" className="rounded-button pr-2">
          <BrandMark />
        </Link>
      }
      navigation={links}
      account={<AccountLinks />}
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
