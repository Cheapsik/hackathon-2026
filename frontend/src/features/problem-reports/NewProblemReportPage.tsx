import { ArrowLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { CeramicCard, PageContainer, SoftButton } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'

type NewProblemReportState = { description?: string } | null

/**
 * Placeholder for the "Opisz problem" flow (SPEC §7.I), which does not exist yet: it only shows what the home
 * page handed over, so the main action does not end in a 404. Replace it with the real flow.
 */
export function NewProblemReportPage() {
  usePageTitle('Opisz problem')

  const state = useLocation().state as NewProblemReportState
  const description = state?.description

  return (
    <PageContainer width="narrow" className="grid gap-6 py-10">
      <h1 className="text-page-title font-medium tracking-display">Opisz problem</h1>
      <CeramicCard padding="lg" className="grid gap-3">
        {description ? (
          <>
            <p className="text-label font-medium text-text-muted">Twój opis</p>
            <p className="text-body">{description}</p>
          </>
        ) : (
          <p className="text-body">Wróć na stronę główną i opisz, co nie działa.</p>
        )}
        <p className="text-body-sm text-text-muted">Dopasowywanie rozwiązań będzie dostępne wkrótce.</p>
      </CeramicCard>
      <SoftButton asChild icon={<ArrowLeft aria-hidden />} className="w-fit">
        <Link to="/">Wróć na stronę główną</Link>
      </SoftButton>
    </PageContainer>
  )
}
