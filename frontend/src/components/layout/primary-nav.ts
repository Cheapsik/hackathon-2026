export type PrimaryNavItem = {
  to: string
  label: string
}

/**
 * Destinations of the home / "Opisz problem" header. AppLayout mirrors the same top-level labels and expands
 * each into its section pages.
 */
export const primaryNav: PrimaryNavItem[] = [
  { to: '/opisz-problem', label: 'Opisz problem' },
  { to: '/moje-zgloszenia', label: 'Rozwiązania' },
  { to: '/biblioteka', label: 'Wiedza' },
  { to: '/pomysly', label: 'Pomysły' },
  { to: '/testy', label: 'Testy' },
]

/** Top-level destinations, with Administracja only for admins (same rule as AppLayout). */
export function primaryNavFor(role: string | null | undefined): PrimaryNavItem[] {
  if (role === 'ADMIN') {
    return [...primaryNav, { to: '/admin', label: 'Administracja' }]
  }

  return primaryNav
}
