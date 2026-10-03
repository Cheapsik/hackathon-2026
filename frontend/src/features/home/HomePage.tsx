import { Link } from 'react-router'
import { usePageTitle } from '@/hooks/use-page-title'

export function HomePage() {
  usePageTitle('Strona główna')

  return (
    <section aria-labelledby="home-title" className="max-w-3xl space-y-4">
      <h1 id="home-title" className="text-3xl font-bold">
        Castor
      </h1>
      <p className="text-lg">
        Opisz problem w swojej okolicy, a podpowiemy sprawdzone innowacje społeczne z Biblioteki ROPS i wyjaśnimy,
        dlaczego pasują.
      </p>
      <ul>
        <li>
          <Link to="/opisz-problem">Opisz problem i znajdź rozwiązania</Link>
        </li>
        <li>
          <Link to="/sledz">Sprawdź zgłoszenie kodem śledzenia</Link>
        </li>
      </ul>
    </section>
  )
}
