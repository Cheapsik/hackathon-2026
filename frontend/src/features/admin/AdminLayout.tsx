import { Link, NavLink, Outlet } from 'react-router'
import { useSession } from '@/hooks/use-session'

const sections = [
  { to: '/admin/zgloszenia', label: 'Skrzynka zgłoszeń' },
  { to: '/admin/pomysly', label: 'Pomysły z Kreatora' },
  { to: '/admin/radar', label: 'Radar potrzeb' },
  { to: '/admin/wiedza', label: 'Wiedza: innowacje i genomy' },
  { to: '/admin/nabory', label: 'Nabory' },
  { to: '/admin/uzytkownicy', label: 'Użytkownicy i role' },
]

/** "Ogrodnik" — the administrator's panel (module VI). The API refuses everyone else anyway; this only explains it. */
export function AdminLayout() {
  const session = useSession()

  if (!session) {
    return (
      <p>
        <output>Sprawdzam uprawnienia…</output>
      </p>
    )
  }

  if (session.role !== 'ADMIN') {
    return (
      <>
        <h1>Panel administratora</h1>
        <p>
          Ta część jest tylko dla pracowników ROPS. {!session.signedIn && <Link to="/logowanie">Zaloguj się</Link>}
        </p>
      </>
    )
  }

  return (
    <>
      <nav aria-label="Panel administratora">
        <p>Panel administratora (Ogrodnik):</p>
        <ul>
          {sections.map((section) => (
            <li key={section.to}>
              <NavLink to={section.to}>{section.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </>
  )
}
