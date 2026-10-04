import type { FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { BrandMark } from '@/components/layout/BrandMark'
import { primaryNavFor } from '@/components/layout/primary-nav'
import { useSession } from '@/hooks/use-session'

/** Header laid over the Rynek photo of "Opisz problem": brand, the home page destinations, library search, account. */
export function SceneHeader() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const session = useSession()
  const nav = primaryNavFor(session?.role)

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = String(new FormData(event.currentTarget).get('szukaj') ?? '').trim()
    void navigate(query ? `/biblioteka?szukaj=${encodeURIComponent(query)}` : '/biblioteka')
  }

  return (
    <header className="dp-top">
      <div className="dp-container dp-top-row">
        <Link to="/" className="dp-brand" aria-label="Castor, strona główna">
          <BrandMark />
        </Link>

        <nav className="dp-nav" aria-label="Główna">
          <ul>
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={pathname === item.to || (item.to !== '/' && pathname.startsWith(`${item.to}/`)) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <search>
          <form className="dp-search" onSubmit={search}>
            <label htmlFor="dp-search" className="dp-sr">
              Szukaj w Bibliotece innowacji
            </label>
            <Search aria-hidden strokeWidth={1.75} />
            <input id="dp-search" name="szukaj" type="search" placeholder="Szukaj innowacji" />
          </form>
        </search>

        <AccountMenu />
      </div>
    </header>
  )
}
