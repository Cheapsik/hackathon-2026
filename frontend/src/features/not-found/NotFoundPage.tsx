import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState, SoftButton } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'

export function NotFoundPage() {
  usePageTitle('Nie znaleziono strony')

  return (
    <EmptyState
      titleAs="h1"
      icon={Compass}
      title="Nie znaleziono strony"
      description="Ta strona nie istnieje albo została przeniesiona."
      action={
        <SoftButton asChild variant="primary" icon={<ArrowLeft aria-hidden />}>
          <Link to="/">Wróć na stronę główną</Link>
        </SoftButton>
      }
    />
  )
}
