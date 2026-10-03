import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getGetApiAdminProblemReportsQueryKey, useGetApiAdminProblemReports, useGetApiChallengeAreas } from '@/api/generated/castor'
import { urgencyLabels } from '@/features/admin/labels'
import { problemReportStatusLabels, statusLabel } from '@/features/problem-reports/status-labels'
import { useLiveEvent } from '@/hooks/use-live-event'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { timeSince } from '@/lib/format'

/** "Skrzynka zgłoszeń na żywo": new reports arrive without a reload (SignalR, ProblemReportCreated). */
export function InboxPage() {
  usePageTitle('Skrzynka zgłoszeń')
  const [status, setStatus] = useState('')
  const [area, setArea] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const queryClient = useQueryClient()
  const areas = useGetApiChallengeAreas()
  const reports = useGetApiAdminProblemReports({ Status: status || undefined, ChallengeArea: area || undefined })
  const rows = reports.data?.data ?? []

  useLiveEvent('ProblemReportCreated', () => {
    setAnnouncement('Wpłynęło nowe zgłoszenie. Lista została odświeżona.')
    void queryClient.invalidateQueries({ queryKey: getGetApiAdminProblemReportsQueryKey() })
  })
  useLiveEvent('ProblemReportStatusChanged', () => {
    void queryClient.invalidateQueries({ queryKey: getGetApiAdminProblemReportsQueryKey() })
  })

  return (
    <>
      <h1>Skrzynka zgłoszeń</h1>
      <p aria-live="polite">{announcement}</p>

      <form onSubmit={(event) => event.preventDefault()}>
        <label>
          Status{' '}
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">wszystkie</option>
            {Object.entries(problemReportStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          Główny obszar{' '}
          <select value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="">wszystkie</option>
            {(areas.data?.data ?? []).map((challengeArea) => (
              <option key={challengeArea.code} value={challengeArea.code}>
                {challengeArea.name}
              </option>
            ))}
          </select>
        </label>
      </form>

      <div aria-live="polite">
        {reports.isPending && (
          <p>
            <output>Wczytuję zgłoszenia…</output>
          </p>
        )}
        {reports.isError && <p role="alert">{errorMessage(reports.error, { 403: 'Ta lista jest tylko dla administratorów.' })}</p>}
        {reports.isSuccess && rows.length === 0 && <p>Brak zgłoszeń dla wybranych filtrów.</p>}
      </div>

      {rows.length > 0 && (
        <table>
          <caption>Zgłoszenia od najnowszego ({rows.length})</caption>
          <thead>
            <tr>
              <th scope="col">Kod</th>
              <th scope="col">Wpłynęło</th>
              <th scope="col">Pilność</th>
              <th scope="col">Status</th>
              <th scope="col">Obszar</th>
              <th scope="col">Gmina</th>
              <th scope="col">Najlepsze dopasowanie</th>
              <th scope="col">Opis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link to={`/admin/zgloszenia/${row.id}`}>{row.trackingCode}</Link>
                </td>
                <td>{timeSince(row.createdAt)}</td>
                <td>{row.urgency ? urgencyLabels[row.urgency] : 'brak oceny'}</td>
                <td>{statusLabel(row.status)}</td>
                <td>{row.mainChallengeArea ?? 'brak'}</td>
                <td>{row.municipality ?? 'nie podano'}</td>
                <td>
                  {row.awaitsAnswers ? 'czeka na odpowiedzi' : row.bestScore !== null ? `${row.bestScore} / 100` : 'brak dopasowania'}
                </td>
                <td>{row.descriptionPreview}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
