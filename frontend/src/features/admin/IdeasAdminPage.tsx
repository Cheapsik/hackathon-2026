import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getGetApiAdminIdeasQueryKey, useGetApiAdminIdeas } from '@/api/generated/castor'
import { ideaStatusLabel, ideaStatusLabels } from '@/features/ideas/labels'
import { useLiveEvent } from '@/hooks/use-live-event'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** Ideas from the Kreator: submitted ones arrive live (IdeaSubmitted); the decision is taken on the idea's page. */
export function IdeasAdminPage() {
  usePageTitle('Pomysły z Kreatora')
  const [status, setStatus] = useState('SUBMITTED')
  const [announcement, setAnnouncement] = useState('')
  const queryClient = useQueryClient()
  const ideas = useGetApiAdminIdeas({ Status: status || undefined })
  const rows = ideas.data?.data ?? []

  useLiveEvent('IdeaSubmitted', () => {
    setAnnouncement('Zgłoszono nowy pomysł. Lista została odświeżona.')
    void queryClient.invalidateQueries({ queryKey: getGetApiAdminIdeasQueryKey() })
  })

  return (
    <>
      <h1>Pomysły z Kreatora</h1>
      <p aria-live="polite">{announcement}</p>

      <form onSubmit={(event) => event.preventDefault()}>
        <label>
          Status{' '}
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">wszystkie poza szkicami</option>
            {Object.entries(ideaStatusLabels)
              .filter(([value]) => value !== 'DRAFT')
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </label>
      </form>

      <div aria-live="polite">
        {ideas.isPending && (
          <p>
            <output>Wczytuję pomysły…</output>
          </p>
        )}
        {ideas.isError && <p role="alert">{errorMessage(ideas.error, { 403: 'Ta lista jest tylko dla administratorów.' })}</p>}
        {ideas.isSuccess && rows.length === 0 && <p>Brak pomysłów o wybranym statusie.</p>}
      </div>

      {rows.length > 0 && (
        <table>
          <caption>Pomysły ({rows.length})</caption>
          <thead>
            <tr>
              <th scope="col">Nazwa</th>
              <th scope="col">Status</th>
              <th scope="col">Obszary</th>
              <th scope="col">Zgłoszony</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <Link to={`/pomysly/${row.id}`}>{row.title}</Link>
                </th>
                <td>{ideaStatusLabel(row.status)}</td>
                <td>{row.challengeAreaCodes.join(', ')}</td>
                <td>{row.submittedAt ? formatDateTime(row.submittedAt) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
