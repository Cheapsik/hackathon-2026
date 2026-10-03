import { useState, type ReactNode, type Ref } from 'react'
import { Menu, type LucideIcon } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { BottomSheet } from './BottomSheet'
import { PageContainer } from './PageContainer'
import { UtilityMenu } from './UtilityMenu'

export type AppShellNavItem = {
  to: string
  label: string
  icon?: LucideIcon
  /** Match the path exactly (for "/"). */
  end?: boolean
}

/** One destination of the header (as on the home page) with the pages that belong to it. */
export type AppShellNavGroup = {
  label: string
  /** Where the header link leads. */
  to: string
  items: AppShellNavItem[]
  /** Further path prefixes that belong to the group, e.g. detail pages that are not in `items`. */
  match?: string[]
}

export type AppShellProps = {
  /** Brand mark, usually a link to the home page. Sits on the dusk frame. */
  brand: ReactNode
  navigation: AppShellNavGroup[]
  /** Names the main navigation landmark. */
  navigationLabel?: string
  /** Compact account control for the header (on the dusk frame). */
  account?: ReactNode
  /** Account links written out, for the phone menu. */
  accountLinks?: ReactNode
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

function belongsTo(pathname: string, group: AppShellNavGroup): boolean {
  const paths = [...group.items.map((item) => item.to), ...(group.match ?? [])]
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/**
 * Chrome shared by every page, continuing the home page: the page is a sheet inside a dusk frame. The header on
 * the frame carries the same destinations as the home page, the current one marked with lamplight; the sheet
 * opens with the pages of the current destination. Skip link, `main` and footer as landmarks.
 */
export function AppShell({
  brand,
  navigation,
  navigationLabel = 'Główna',
  account,
  accountLinks,
  utilities,
  utilitiesLabel = 'Dostępność',
  footer,
  mainRef,
  children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const currentGroup = navigation.find((group) => belongsTo(pathname, group))
  const sectionPages = currentGroup && currentGroup.items.length > 1 ? currentGroup.items : []

  return (
    <div className="flex min-h-dvh flex-col on-frame">
      <a
        href="#main"
        className="fixed top-4 left-4 z-50 -translate-y-[200%] rounded-button bg-lamp px-5 py-3 text-body-sm font-medium text-frame transition-control focus:translate-y-0"
      >
        Przejdź do treści
      </a>

      <header>
        <PageContainer className="flex min-h-18 items-center justify-between gap-4">
          {brand}

          <div className="flex items-center gap-2 lg:gap-8">
            <nav aria-label={navigationLabel} className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {navigation.map((group) => {
                  const current = group === currentGroup
                  return (
                    <li key={group.to}>
                      <Link
                        to={group.to}
                        aria-current={current ? 'true' : undefined}
                        className={cn(
                          'relative inline-flex min-h-touch items-center text-body-sm font-medium transition-control',
                          // Lamplight under the current destination; the colour change alone would not be enough.
                          "after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:rounded-button after:content-['']",
                          current
                            ? 'text-on-frame after:bg-lamp'
                            : 'text-on-frame-muted hover:text-on-frame after:bg-transparent',
                        )}
                      >
                        {group.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              {utilities && (
                <UtilityMenu label={utilitiesLabel} title={utilitiesLabel} tone="frame">
                  {utilities}
                </UtilityMenu>
              )}
              {account}
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                className="inline-flex min-h-touch items-center gap-2 rounded-button border border-on-frame-line px-3 text-body-sm font-medium text-on-frame transition-control press hover:bg-on-frame-line sm:px-4 lg:hidden"
              >
                <Menu aria-hidden className="size-icon" strokeWidth={1.75} />
                <span className="max-sm:sr-only">Menu</span>
              </button>
            </div>
          </div>
        </PageContainer>
      </header>

      {/* The sheet: the page itself, in the frame's edge. Text and focus go back to the light-surface tokens. */}
      <div className="mx-frame flex flex-1 flex-col rounded-shell bg-canvas text-text-primary [--color-focus:var(--color-accent)]">
        {sectionPages.length > 0 && (
          <PageContainer>
            <nav aria-label={currentGroup?.label} className="border-b border-border-subtle">
              <ul className="flex flex-wrap gap-x-7">
                {sectionPages.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'relative inline-flex min-h-14 items-center text-body-sm font-medium transition-control',
                          "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-button after:content-['']",
                          isActive
                            ? 'text-text-primary after:bg-accent'
                            : 'text-text-muted hover:text-text-primary after:bg-transparent',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </PageContainer>
        )}

        <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>

      <footer>
        <PageContainer className="py-6 text-label text-on-frame-muted">{footer}</PageContainer>
      </footer>

      <BottomSheet open={menuOpen} onOpenChange={setMenuOpen} title="Menu">
        <nav aria-label={navigationLabel} className="grid gap-6">
          {navigation.map((group) => (
            <section key={group.to} aria-labelledby={`menu-${group.to}`} className="grid gap-1">
              <h3 id={`menu-${group.to}`} className="px-3 text-label font-medium text-text-muted">
                {group.label}
              </h3>
              <ul className="grid gap-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-touch items-center rounded-control px-3 text-body font-medium transition-control press',
                          isActive ? 'bg-chip text-text-primary' : 'hover:bg-surface-solid',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
        {accountLinks && (
          <div className="mt-6 border-t border-border-subtle px-3 pt-4 text-body text-text-muted">{accountLinks}</div>
        )}
      </BottomSheet>
    </div>
  )
}
