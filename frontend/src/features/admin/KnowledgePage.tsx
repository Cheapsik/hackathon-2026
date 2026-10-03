import { useDeferredValue, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { Link } from 'react-router'
import {
  getGetApiAdminJobsQueryKey,
  useGetApiAdminGenomes,
  useGetApiAdminJobs,
  useGetApiInnovations,
  usePostApiAdminJobsGenomes,
} from '@/api/generated/castor'
import {
  Badge,
  CeramicCard,
  EmptyState,
  LoadingState,
  SearchAndFilters,
  Section,
  SelectField,
  SoftButton,
} from '@/design-system'
import { genomeStatusLabels, stageLabels } from '@/features/admin/labels'
import { AreaPlainLanguage } from '@/features/admin/PlainLanguageSection'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

const genomeStatusOptions = [
  { value: 'DRAFT', label: 'do zatwierdzenia' },
  { value: 'APPROVED', label: 'zatwierdzone' },
]

/** "Wiedza": background jobs, genomes waiting for approval, and the innovation cards. */
export function KnowledgePage() {
  usePageTitle('Wiedza')
  const [genomeStatus, setGenomeStatus] = useState('DRAFT')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const queryClient = useQueryClient()
  const jobs = useGetApiAdminJobs({ query: { refetchInterval: 5000 } })
  const queueGenomes = usePostApiAdminJobsGenomes()
  const genomes = useGetApiAdminGenomes({ Status: genomeStatus || undefined })
  const innovations = useGetApiInnovations({ Search: deferredSearch || undefined })
  const innovationRows = innovations.data?.data ?? []
  const genomeRows = genomes.data?.data ?? []
  const jobRows = jobs.data?.data ?? []

  return (
    <div className="grid gap-8">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Wiedza</h1>
          <p className="text-body text-text-muted">Karty innowacji, genomy do zatwierdzenia i zadania w tle.</p>
        </div>
        <SoftButton asChild variant="primary">
          <Link to="/admin/wiedza/innowacje/nowa">Dodaj innowację</Link>
        </SoftButton>
      </header>

      <Section title="Zadania w tle" description="Generowanie genomów i postęp kolejek (odświeżane co 5 s).">
        <div className="flex flex-wrap gap-3">
          <SoftButton
            type="button"
            variant="secondary"
            loading={queueGenomes.isPending}
            onClick={() =>
              queueGenomes.mutate(undefined, {
                onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetApiAdminJobsQueryKey() }),
              })
            }
          >
            Wygeneruj brakujące genomy
          </SoftButton>
        </div>
        {queueGenomes.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(queueGenomes.error)}
          </p>
        )}
        {jobRows.length === 0 ? (
          <p className="text-body-sm text-text-muted">Brak ostatnich zadań.</p>
        ) : (
          <CeramicCard asChild padding="none" className="p-1">
            <ul className="grid divide-y divide-border-subtle">
              {jobRows.map((job) => (
                <li key={job.id} className="grid gap-1 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="grid gap-1">
                    <p className="text-body font-medium text-text-primary">
                      {job.kind === 'GENERATE_GENOMES' ? 'Genomy innowacji' : job.kind}
                    </p>
                    <p className="text-body-sm text-text-muted">
                      {job.done}
                      {job.total !== null && ` z ${job.total}`}
                      {Number(job.failed) > 0 && `, nieudane: ${job.failed}`}
                      {' · '}
                      {job.startedAt ? formatDateTime(job.startedAt) : 'czeka'}
                      {job.error ? ` · ${job.error}` : ''}
                    </p>
                  </div>
                  <Badge>{job.status}</Badge>
                </li>
              ))}
            </ul>
          </CeramicCard>
        )}
      </Section>

      <Section
        title="Genomy"
        description="Dopasowanie korzysta ze szkicu, dopóki go nie zatwierdzisz; zatwierdzony genom go zastępuje."
      >
        <SelectField
          label="Pokaż genomy"
          value={genomeStatus}
          placeholder="wszystkie"
          options={genomeStatusOptions}
          onChange={(event) => setGenomeStatus(event.target.value)}
        />
        {genomes.isPending && <LoadingState label="Wczytuję genomy…" />}
        {!genomes.isPending && genomeRows.length === 0 && (
          <EmptyState title="Brak genomów" description="Zmień filtr albo wygeneruj genomy." icon={BookOpen} />
        )}
        {genomeRows.length > 0 && (
          <CeramicCard asChild padding="none" className="p-1">
            <ul className="grid divide-y divide-border-subtle">
              {genomeRows.map((genome) => (
                <li key={genome.id}>
                  <div className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="grid min-w-0 gap-1">
                      <Link
                        to={`/admin/wiedza/genomy/${genome.id}`}
                        className="font-medium text-text-primary underline-offset-4 hover:underline"
                      >
                        {genome.innovationTitle}
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Badge>{genomeStatusLabels[genome.status] ?? genome.status}</Badge>
                      <SoftButton asChild variant="secondary">
                        <Link to={`/admin/wiedza/genomy/${genome.id}`}>Otwórz</Link>
                      </SoftButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CeramicCard>
        )}
      </Section>

      <AreaPlainLanguage />

      <Section title="Innowacje" description="Karty w Bibliotece i ich genomy.">
        <SearchAndFilters
          searchLabel="Szukaj po tytule"
          placeholder="np. transport do lekarza"
          query={search}
          onQueryChange={setSearch}
          searching={innovations.isFetching}
          resultSummary={innovations.isFetching ? 'Szukam…' : `Innowacje: ${innovationRows.length}`}
        />
        {innovationRows.length === 0 ? (
          <EmptyState title="Brak innowacji" description="Dodaj kartę albo zmień wyszukiwanie." icon={BookOpen} />
        ) : (
          <CeramicCard asChild padding="none" className="p-1">
            <ul className="grid divide-y divide-border-subtle">
              {innovationRows.map((innovation) => (
                <li key={innovation.id}>
                  <div className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="grid min-w-0 gap-1">
                      <Link
                        to={`/innowacje/${innovation.id}`}
                        className="font-medium text-text-primary underline-offset-4 hover:underline"
                      >
                        {innovation.title}
                      </Link>
                      <p className="text-body-sm text-text-muted">
                        {stageLabels[innovation.stage] ?? innovation.stage}
                        {' · genom: '}
                        {innovation.genomeStatus ? genomeStatusLabels[innovation.genomeStatus] : 'brak'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <SoftButton asChild variant="secondary">
                        <Link to={`/admin/wiedza/innowacje/${innovation.id}`}>Edytuj</Link>
                      </SoftButton>
                      <SoftButton asChild variant="ghost">
                        <Link to={`/innowacje/${innovation.id}`}>Podgląd</Link>
                      </SoftButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CeramicCard>
        )}
      </Section>
    </div>
  )
}
