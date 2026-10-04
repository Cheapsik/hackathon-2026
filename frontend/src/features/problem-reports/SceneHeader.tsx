import type { FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { BrandMark } from '@/components/layout/BrandMark'

const nav = [
  { to: '/opisz-problem', label: 'Rozwiązania' },
  { to: '/biblioteka', label: 'Wiedza' },
  { to: '/pomysly', label: 'Pomysły' },
  { to: '/testy', label: 'Testy' },
] as const

/** Header laid over the Rynek photo of "Opisz problem": brand, the home page destinations, library search, account. */
export function SceneHeader() {
  const navigate = useNavigate()

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
                <Link to={item.to} aria-current={item.to === '/opisz-problem' ? 'page' : undefined}>
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
