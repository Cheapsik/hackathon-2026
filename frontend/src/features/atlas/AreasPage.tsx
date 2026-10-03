import { Link } from 'react-router'
import { Map } from 'lucide-react'
import { useGetApiChallengeAreas } from '@/api/generated/castor'
import { CeramicCard, EmptyState, ErrorState, LoadingState, SoftButton } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/** The Atlas home: the eight areas of the Social Challenges Map. */
export function AreasPage() {
  usePageTitle('Atlas wyzwań')
  const areas = useGetApiChallengeAreas()
  const rows = areas.data?.data ?? []
  const pageStatus =
    areas.isPending && !areas.data ? 'loading' : areas.isError ? 'error' : rows.length === 0 ? 'empty' : 'ready'

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Atlas wyzwań</h1>
          <p className="text-body text-text-muted">
            Osiem obszarów Mapy Wyzwań Społecznych ROPS. Wybierz obszar, żeby zobaczyć personę, dane gminy i innowacje.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SoftButton asChild variant="secondary">
            <Link to="/biblioteka">Biblioteka</Link>
          </SoftButton>
          <SoftButton asChild variant="secondary">
            <Link to="/mapa">Mapa gminy</Link>
          </SoftButton>
          <SoftButton asChild variant="ghost">
            <Link to="/materialy">Materiały</Link>
          </SoftButton>
        </div>
      </header>

      {pageStatus === 'loading' && <LoadingState label="Wczytuję obszary…" />}
      {pageStatus === 'error' && (
        <ErrorState
          description={errorMessage(areas.error)}
          onRetry={() => {
            void areas.refetch()
          }}
        />
      )}
      {pageStatus === 'empty' && <EmptyState title="Brak obszarów" icon={Map} />}

      {pageStatus === 'ready' && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((area) => (
            <li key={area.code} className="min-w-0">
              <CeramicCard asChild interactive padding="lg" className="h-full">
                <Link to={`/obszary/${area.code}`} className="grid h-full gap-2">
                  <span className="text-label font-medium text-text-muted">Obszar {area.number}</span>
                  <span className="font-display text-section-title tracking-display">{area.name}</span>
                  <span className="line-clamp-3 text-body-sm text-text-muted">{area.definition}</span>
                </Link>
              </CeramicCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
