import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Lightbulb } from 'lucide-react'
import { Link } from 'react-router'
import { getGetApiAdminIdeasQueryKey, useGetApiAdminIdeas } from '@/api/generated/castor'
import { ideaStatusLabel, ideaStatusLabels } from '@/features/ideas/labels'
import {
  Badge,
  CeramicCard,
  EmptyState,
  ErrorState,
  LoadingState,
  SelectField,
  SoftButton,
  type BadgeProps,
} from '@/design-system'
import { useLiveEvent } from '@/hooks/use-live-event'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { timeSince } from '@/lib/format'

const statusOptions = Object.entries(ideaStatusLabels)
  .filter(([value]) => value !== 'DRAFT')
  .map(([value, label]) => ({ value, label }))

function statusTone(status: string): BadgeProps['tone'] {
  if (status === 'ACCEPTED') {
    return 'success'
  }
  if (status === 'REJECTED') {
    return 'danger'
  }
  if (status === 'SUBMITTED') {
    return 'warning'
  }
  return 'neutral'
}

/** Ideas from the Kreator: submitted ones arrive live (IdeaSubmitted); the decision is taken on the idea's page. */
export function IdeasAdminPage() {
  usePageTitle('Pomysły z Kreatora')
  const [status, setStatus] = useState('SUBMITTED')
  const [announcement, setAnnouncement] = useState('')
  const queryClient = useQueryClient()
  const ideas = useGetApiAdminIdeas({ Status: status || undefined })
  const rows = ideas.data?.data ?? []
  const pageStatus =
    ideas.isPending && !ideas.data ? 'loading' : ideas.isError ? 'error' : rows.length === 0 ? 'empty' : 'ready'

  useLiveEvent('IdeaSubmitted', () => {
    setAnnouncement('Zgłoszono nowy pomysł. Lista została odświeżona.')
    void queryClient.invalidateQueries({ queryKey: getGetApiAdminIdeasQueryKey() })
  })

  return (
    <div className="grid gap-6">
      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Pomysły z Kreatora</h1>
        <p className="text-body text-text-muted">
          Decyzje ROPS i wypuszczanie pomysłów jako innowacje. Nowe zgłoszenia pojawiają się na żywo.
        </p>
      </header>

      <p aria-live="polite" className="min-h-5 text-label text-text-muted">
        {announcement}
      </p>

      <SelectField
        label="Status"
        value={status}
        placeholder="wszystkie poza szkicami"
        options={statusOptions}
        onChange={(event) => setStatus(event.target.value)}
      />

      {pageStatus === 'loading' && <LoadingState label="Wczytuję pomysły…" />}
      {pageStatus === 'error' && (
        <ErrorState
          description={errorMessage(ideas.error, { 403: 'Ta lista jest tylko dla administratorów.' })}
          onRetry={() => {
            void ideas.refetch()
          }}
        />
      )}
      {pageStatus === 'empty' && (
        <EmptyState title="Brak pomysłów" description="Brak pomysłów o wybranym statusie." icon={Lightbulb} />
      )}

      {pageStatus === 'ready' && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {rows.map((row) => (
              <li key={row.id}>
                <div className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="grid min-w-0 gap-1">
                    <Link
                      to={`/pomysly/${row.id}`}
                      className="font-medium text-text-primary underline-offset-4 hover:underline"
                    >
                      {row.title}
                    </Link>
                    <p className="text-body-sm text-text-muted">
                      {[
                        row.challengeAreaCodes.length > 0 ? row.challengeAreaCodes.join(', ') : 'bez obszarów',
                        row.submittedAt ? timeSince(row.submittedAt) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Badge tone={statusTone(row.status)}>{ideaStatusLabel(row.status)}</Badge>
                    <SoftButton asChild variant="secondary">
                      <Link to={`/pomysly/${row.id}`}>Otwórz</Link>
                    </SoftButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CeramicCard>
      )}
    </div>
  )
}
