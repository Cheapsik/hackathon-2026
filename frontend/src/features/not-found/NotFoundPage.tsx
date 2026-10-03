import { Link } from 'react-router'
import { usePageTitle } from '@/hooks/use-page-title'

export function NotFoundPage() {
  usePageTitle('Nie znaleziono strony')

  return (
    <section aria-labelledby="not-found-title" className="max-w-3xl space-y-4">
      <h1 id="not-found-title" className="text-3xl font-bold">
        Nie znaleziono strony
      </h1>
      <p>Ta strona nie istnieje albo została przeniesiona.</p>
      <p>
        <Link to="/" className="underline underline-offset-4">
          Wróć na stronę główną
        </Link>
      </p>
    </section>
  )
}
