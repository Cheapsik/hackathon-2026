import { ArrowLeft, ScrollText } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useGetApiAdminGrantCallsGrantCallIdApplications } from '@/api/generated/castor'
import {
  CeramicCard,
  EmptyState,
  ErrorState,
  LoadingState,
  SoftButton,
} from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** Draft applications the Kreator wrote for one grant call, with how many criteria each one already answers. */
export function GrantCallApplicationsPage() {
  usePageTitle('Wnioski do naboru')
  const { grantCallId = '' } = useParams()
  const applications = useGetApiAdminGrantCallsGrantCallIdApplications(grantCallId)
  const rows = applications.data?.data ?? []
  const pageStatus =
    applications.isPending && !applications.data
      ? 'loading'
      : applications.isError
        ? 'error'
        : rows.length === 0
          ? 'empty'
          : 'ready'

  return (
    <div className="grid gap-6">
      <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />}>
        <Link to="/admin/nabory">Nabory</Link>
      </SoftButton>

      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Wnioski do naboru</h1>
        <p className="text-body text-text-muted">Szkice wniosków z Kreatora i postęp uzupełnienia kryteriów.</p>
      </header>

      {pageStatus === 'loading' && <LoadingState label="Wczytuję wnioski…" />}
      {pageStatus === 'error' && (
        <ErrorState
          description={errorMessage(applications.error, { 404: 'Nie znaleźliśmy tego naboru.' })}
          onRetry={() => {
            void applications.refetch()
          }}
        />
      )}
      {pageStatus === 'empty' && (
        <EmptyState
          title="Brak wniosków"
          description="Do tego naboru nie przygotowano jeszcze wniosków."
          icon={ScrollText}
        />
      )}

      {pageStatus === 'ready' && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {rows.map((row) => (
              <li key={row.id}>
                <div className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="grid min-w-0 gap-1">
                    <Link
                      to={`/wnioski/${row.id}`}
                      className="font-medium text-text-primary underline-offset-4 hover:underline"
                    >
                      {row.title}
                    </Link>
                    <p className="text-body-sm text-text-muted">
                      Pomysł:{' '}
                      <Link to={`/pomysly/${row.ideaId}`} className="underline-offset-4 hover:underline">
                        {row.ideaTitle}
                      </Link>
                      {' · '}
                      {row.answeredCriteria} z {row.criteria} kryteriów · {formatDateTime(row.updatedAt)}
                    </p>
                  </div>
                  <SoftButton asChild variant="secondary">
                    <Link to={`/wnioski/${row.id}`}>Otwórz</Link>
                  </SoftButton>
                </div>
              </li>
            ))}
          </ul>
        </CeramicCard>
      )}
    </div>
  )
}
