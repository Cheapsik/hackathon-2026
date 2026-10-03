import { useDeferredValue, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Inbox } from 'lucide-react'
import { Link } from 'react-router'
import {
  getGetApiAdminProblemReportsQueryKey,
  useGetApiAdminProblemReports,
  useGetApiChallengeAreas,
  type InboxProblemReportSummaryResponse,
} from '@/api/generated/castor'
import { urgencyLabels } from '@/features/admin/labels'
import { problemReportStatusLabels, statusLabel } from '@/features/problem-reports/status-labels'
import {
  Badge,
  CeramicCard,
  EmptyState,
  ErrorState,
  LoadingState,
  SearchAndFilters,
  SelectField,
  SoftButton,
  type BadgeProps,
} from '@/design-system'
import { useLiveEvent } from '@/hooks/use-live-event'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { timeSince } from '@/lib/format'

const statusOptions = Object.entries(problemReportStatusLabels).map(([value, label]) => ({ value, label }))

function urgencyTone(urgency: string | null | undefined): BadgeProps['tone'] {
  if (urgency === 'HIGH') {
    return 'danger'
  }
  if (urgency === 'MEDIUM') {
    return 'warning'
  }
  return 'neutral'
}

function statusTone(status: string): BadgeProps['tone'] {
  if (status === 'ANSWERED') {
    return 'success'
  }
  if (status === 'IN_ANALYSIS' || status === 'WITH_EXPERT') {
    return 'warning'
  }
  return 'neutral'
}

function matchSummary(row: InboxProblemReportSummaryResponse): string {
  if (row.awaitsAnswers) {
    return 'czeka na odpowiedzi'
  }
  if (row.bestScore !== null) {
    return `${row.bestScore} / 100`
  }
  return 'brak dopasowania'
}

/** "Skrzynka zgłoszeń na żywo": new reports arrive without a reload (SignalR, ProblemReportCreated). */
export function InboxPage() {
  usePageTitle('Skrzynka zgłoszeń')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [area, setArea] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const queryClient = useQueryClient()
  const areas = useGetApiChallengeAreas()
  const reports = useGetApiAdminProblemReports({
    Status: status || undefined,
    ChallengeArea: area || undefined,
  })

  const rows = useMemo(() => {
    const list = reports.data?.data ?? []
    if (!deferredSearch) {
      return list
    }
    return list.filter((row) => {
      const haystack = `${row.trackingCode} ${row.descriptionPreview} ${row.municipality ?? ''} ${row.mainChallengeArea ?? ''}`.toLowerCase()
      return haystack.includes(deferredSearch)
    })
  }, [reports.data?.data, deferredSearch])

  const pageStatus =
    reports.isPending && !reports.data ? 'loading' : reports.isError ? 'error' : rows.length === 0 ? 'empty' : 'ready'

  useLiveEvent('ProblemReportCreated', () => {
    setAnnouncement('Wpłynęło nowe zgłoszenie. Lista została odświeżona.')
    void queryClient.invalidateQueries({ queryKey: getGetApiAdminProblemReportsQueryKey() })
  })
  useLiveEvent('ProblemReportStatusChanged', () => {
    void queryClient.invalidateQueries({ queryKey: getGetApiAdminProblemReportsQueryKey() })
  })

  return (
    <div className="grid gap-6">
      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Skrzynka zgłoszeń</h1>
        <p className="text-body text-text-muted">
          Nowe zgłoszenia pojawiają się na żywo. Filtruj po statusie i obszarze, szukaj po kodzie albo opisie.
        </p>
      </header>

      <p aria-live="polite" className="min-h-5 text-label text-text-muted">
        {announcement}
      </p>

      <SearchAndFilters
        searchLabel="Szukaj po kodzie, opisie albo gminie"
        placeholder="np. CAS-2026 albo transport"
        query={search}
        onQueryChange={setSearch}
        searching={reports.isFetching}
        resultSummary={
          reports.isFetching
            ? 'Odświeżam…'
            : pageStatus === 'ready'
              ? `Zgłoszenia: ${rows.length}`
              : pageStatus === 'empty'
                ? 'Brak zgłoszeń dla wybranych filtrów.'
                : null
        }
        filters={
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Status"
              value={status}
              placeholder="wszystkie statusy"
              options={statusOptions}
              onChange={(event) => setStatus(event.target.value)}
            />
            <SelectField
              label="Główny obszar"
              value={area}
              placeholder="wszystkie obszary"
              loading={areas.isPending}
              options={(areas.data?.data ?? []).map((challengeArea) => ({
                value: challengeArea.code,
                label: challengeArea.name,
              }))}
              onChange={(event) => setArea(event.target.value)}
            />
          </div>
        }
      />

      {pageStatus === 'loading' && <LoadingState label="Wczytuję zgłoszenia…" />}
      {pageStatus === 'error' && (
        <ErrorState
          description={errorMessage(reports.error, { 403: 'Ta lista jest tylko dla administratorów.' })}
          onRetry={() => {
            void reports.refetch()
          }}
        />
      )}
      {pageStatus === 'empty' && (
        <EmptyState
          title="Brak zgłoszeń"
          description={
            deferredSearch || status || area
              ? 'Zmień wyszukiwanie albo filtry.'
              : 'Gdy wpłynie pierwsze zgłoszenie, pojawi się tutaj na żywo.'
          }
          icon={Inbox}
        />
      )}

      {pageStatus === 'ready' && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {rows.map((row) => (
              <li key={row.id}>
                <div className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="grid min-w-0 gap-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link
                        to={`/admin/zgloszenia/${row.id}`}
                        className="font-medium text-text-primary underline-offset-4 hover:underline"
                      >
                        {row.trackingCode}
                      </Link>
                      <span className="text-label text-text-muted">{timeSince(row.createdAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-body-sm text-text-muted">{row.descriptionPreview}</p>
                    <p className="text-label text-text-muted">
                      {[row.mainChallengeArea ?? 'bez obszaru', row.municipality ?? 'gmina niepodana', matchSummary(row)].join(
                        ' · ',
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {row.urgency && <Badge tone={urgencyTone(row.urgency)}>{urgencyLabels[row.urgency]}</Badge>}
                    <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                    {row.hasReplyDraft && <Badge>szkic odpowiedzi</Badge>}
                    <SoftButton asChild variant="secondary">
                      <Link to={`/admin/zgloszenia/${row.id}`}>Otwórz</Link>
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
