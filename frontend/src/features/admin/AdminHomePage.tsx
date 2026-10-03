import { Link } from 'react-router'
import { usePageTitle } from '@/hooks/use-page-title'

export function AdminHomePage() {
  usePageTitle('Panel administratora')

  return (
    <>
      <h1>Panel administratora</h1>
      <p>
        Zacznij od <Link to="/admin/zgloszenia">skrzynki zgłoszeń</Link> — nowe zgłoszenia pojawiają się w niej na żywo.
      </p>
    </>
  )
}
