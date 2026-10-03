import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { AccountLinks } from '@/components/layout/AccountLinks'
import { DisplayControls } from '@/components/layout/DisplayControls'
import { cn } from '@/lib/utils'

const navigation = [
  { to: '/', label: 'Strona główna' },
  { to: '/opisz-problem', label: 'Opisz problem' },
  { to: '/sledz', label: 'Śledź zgłoszenie' },
  { to: '/moje-zgloszenia', label: 'Moje zgłoszenia' },
]

/**
 * Landmarks, skip link and display switches shared by every page. After a navigation the focus moves to <main>,
 * so a screen reader starts reading the new page instead of staying on the clicked link.
 */
export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    mainRef.current?.focus()
  }, [location.pathname])

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>

      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex flex-col leading-tight">
            <span className="text-xl font-bold">Castor</span>
            <span className="text-sm text-muted-foreground">Małopolski Hub Innowacji Społecznych</span>
          </Link>
          <nav aria-label="Główna">
            <ul className="flex flex-wrap gap-4">
              {navigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) => cn('underline-offset-4 hover:underline', isActive && 'font-semibold underline')}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <AccountLinks />
          <DisplayControls />
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
          Regionalny Ośrodek Polityki Społecznej w Krakowie
        </div>
      </footer>
    </div>
  )
}
