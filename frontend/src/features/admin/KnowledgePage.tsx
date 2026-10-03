import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  getGetApiAdminJobsQueryKey,
  useGetApiAdminGenomes,
  useGetApiAdminJobs,
  useGetApiInnovations,
  usePostApiAdminJobsGenomes,
} from '@/api/generated/castor'
import { genomeStatusLabels, stageLabels } from '@/features/admin/labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** "Wiedza": background jobs, genomes waiting for approval, and the innovation cards. */
export function KnowledgePage() {
  usePageTitle('Wiedza')
  const [genomeStatus, setGenomeStatus] = useState('DRAFT')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const jobs = useGetApiAdminJobs({ query: { refetchInterval: 5000 } })
  const queueGenomes = usePostApiAdminJobsGenomes()
  const genomes = useGetApiAdminGenomes({ Status: genomeStatus || undefined })
  const innovations = useGetApiInnovations({ Search: search || undefined })

  return (
    <>
      <h1>Wiedza: innowacje i genomy</h1>

      <section aria-labelledby="jobs-title">
        <h2 id="jobs-title">Zadania w tle</h2>
        <p>
          <button
            type="button"
            disabled={queueGenomes.isPending}
            onClick={() =>
              queueGenomes.mutate(undefined, {
                onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetApiAdminJobsQueryKey() }),
              })
            }
          >
            Wygeneruj brakujące genomy
          </button>
        </p>
        {queueGenomes.isError && <p role="alert">{errorMessage(queueGenomes.error)}</p>}
        {(jobs.data?.data ?? []).length > 0 && (
          <table>
            <caption>Ostatnie zadania (odświeżane co 5 s)</caption>
            <thead>
              <tr>
                <th scope="col">Zadanie</th>
                <th scope="col">Status</th>
                <th scope="col">Postęp</th>
                <th scope="col">Start</th>
                <th scope="col">Błąd</th>
              </tr>
            </thead>
            <tbody>
              {jobs.data!.data.map((job) => (
                <tr key={job.id}>
                  <td>{job.kind === 'GENERATE_GENOMES' ? 'Genomy innowacji' : job.kind}</td>
                  <td>{job.status}</td>
                  <td>
                    {job.done}
                    {job.total !== null && ` z ${job.total}`}
                    {Number(job.failed) > 0 && `, nieudane: ${job.failed}`}
                  </td>
                  <td>{job.startedAt ? formatDateTime(job.startedAt) : 'czeka'}</td>
                  <td>{job.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="genomes-title">
        <h2 id="genomes-title">Genomy</h2>
        <p>Dopasowanie korzysta ze szkicu, dopóki go nie zatwierdzisz; zatwierdzony genom go zastępuje.</p>
        <label>
          Pokaż{' '}
          <select value={genomeStatus} onChange={(event) => setGenomeStatus(event.target.value)}>
            <option value="DRAFT">do zatwierdzenia</option>
            <option value="APPROVED">zatwierdzone</option>
            <option value="">wszystkie</option>
          </select>
        </label>
        <div aria-live="polite">
          {genomes.isPending && (
            <p>
              <output>Wczytuję genomy…</output>
            </p>
          )}
          {genomes.isSuccess && <p>Genomów: {genomes.data.data.length}</p>}
        </div>
        <ul>
          {(genomes.data?.data ?? []).map((genome) => (
            <li key={genome.id}>
              <Link to={`/admin/wiedza/genomy/${genome.id}`}>{genome.innovationTitle}</Link> — {genomeStatusLabels[genome.status]}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="innovations-title">
        <h2 id="innovations-title">Innowacje</h2>
        <p>
          <Link to="/admin/wiedza/innowacje/nowa">Dodaj innowację</Link>
        </p>
        <label>
          Szukaj po tytule <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <table>
          <caption>Innowacje ({innovations.data?.data.length ?? 0})</caption>
          <thead>
            <tr>
              <th scope="col">Tytuł</th>
              <th scope="col">Etap</th>
              <th scope="col">Genom</th>
              <th scope="col">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {(innovations.data?.data ?? []).map((innovation) => (
              <tr key={innovation.id}>
                <th scope="row">
                  <Link to={`/innowacje/${innovation.id}`}>{innovation.title}</Link>
                </th>
                <td>{stageLabels[innovation.stage] ?? innovation.stage}</td>
                <td>{innovation.genomeStatus ? genomeStatusLabels[innovation.genomeStatus] : 'brak'}</td>
                <td>
                  <Link to={`/admin/wiedza/innowacje/${innovation.id}`}>Edytuj kartę „{innovation.title}”</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
