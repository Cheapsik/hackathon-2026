import { useState, type ReactNode, type Ref } from 'react'
import { Menu, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { BottomSheet } from './BottomSheet'
import { IconButton } from './IconButton'
import { PageContainer } from './PageContainer'
import { UtilityMenu } from './UtilityMenu'

export type AppShellNavItem = {
  to: string
  label: string
  icon?: LucideIcon
  /** Match the path exactly (for "/"). */
  end?: boolean
}

export type AppShellProps = {
  /** Brand mark, usually a link to the home page. */
  brand: ReactNode
  /** The navigation appears once there is more than one place to go. */
  navigation: AppShellNavItem[]
  /** Names the main navigation landmark. */
  navigationLabel?: string
  /**
   * App-wide settings (display preferences). Shown in a compact panel behind a small labelled button in the
   * header, so they are reachable everywhere without taking space from the page.
   */
  utilities?: ReactNode
  /** Label of the utilities button and title of its panel. */
  utilitiesLabel?: string
  footer: ReactNode
  /** Receives focus after each navigation (see AppLayout). */
  mainRef?: Ref<HTMLElement>
  children: ReactNode
}

/**
 * Landmarks and chrome shared by every page: skip link, a 76 px header with the brand on the left and the
 * accessibility button on the right, `main`, and a footer. No frame: the page uses the full viewport and the
 * content sets its own width (PageContainer, 1240 px).
 */
export function AppShell({
  brand,
  navigation,
  navigationLabel = 'Główna',
  utilities,
  utilitiesLabel = 'Dostępność',
  footer,
  mainRef,
  children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const showNavigation = navigation.length > 1

  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <a
        href="#main"
        className="fixed top-4 left-4 z-50 -translate-y-[200%] rounded-button bg-surface-active px-5 py-3 text-body-sm font-medium text-text-inverse transition-control focus:translate-y-0"
      >
        Przejdź do treści
      </a>

      <header>
        <PageContainer className="flex min-h-[4.75rem] items-center justify-between gap-4">
          {brand}

          <div className="flex items-center gap-2">
            {showNavigation && (
              <nav aria-label={navigationLabel} className="hidden lg:block">
                <ul className="flex items-center gap-1">
                  {navigation.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          cn(
                            'inline-flex min-h-touch items-center gap-2 rounded-button px-4 text-body-sm font-medium transition-control press',
                            isActive
                              ? 'bg-surface-active text-text-inverse'
                              : 'text-text-muted hover:bg-surface-solid hover:text-text-primary',
                          )
                        }
                      >
                        {item.icon && <item.icon aria-hidden className="size-icon" />}
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {utilities && (
              <UtilityMenu label={utilitiesLabel} title={utilitiesLabel}>
                {utilities}
              </UtilityMenu>
            )}
            {showNavigation && (
              <IconButton
                className="lg:hidden"
                label="Menu"
                icon={Menu}
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              />
            )}
          </div>
        </PageContainer>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <footer className="border-t border-border-subtle bg-surface-solid">
        <PageContainer className="py-6 text-label text-text-muted">{footer}</PageContainer>
      </footer>

      {showNavigation && (
        <BottomSheet open={menuOpen} onOpenChange={setMenuOpen} title="Menu">
          <nav aria-label={navigationLabel}>
            <ul className="grid gap-1">
              {navigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-touch items-center gap-3 rounded-control px-3 text-body font-medium transition-control press',
                        isActive ? 'bg-surface-active text-text-inverse' : 'hover:bg-surface-solid',
                      )
                    }
                  >
                    {item.icon && <item.icon aria-hidden className="size-icon-lg" />}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </BottomSheet>
      )}
    </div>
  )
}
