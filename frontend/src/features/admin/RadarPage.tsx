import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Radar } from 'lucide-react'
import {
  useGetApiAdminRadar,
  useGetApiChallengeAreas,
  usePostApiAdminGrantCallsDraft,
} from '@/api/generated/castor'
import { GminaMap } from '@/features/atlas/GminaMap'
import {
  Badge,
  CeramicCard,
  ChartPanel,
  EmptyState,
  ErrorState,
  LoadingState,
  Section,
  SoftButton,
  TextField,
  useToast,
} from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/** "Radar": trends of needs by area, gmina and month, a map of reports, and blank spots with "Szkic naboru". */
export function RadarPage() {
  usePageTitle('Radar potrzeb')
  const [period, setPeriod] = useState<{ from?: string; to?: string }>({})
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const radar = useGetApiAdminRadar({ From: period.from, To: period.to })
  const areas = useGetApiChallengeAreas()
  const draft = usePostApiAdminGrantCallsDraft()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const data = radar.data?.data

  const reportsByTeryt = useMemo(() => {
    const map = new Map<string, number>()
    for (const need of data?.byMunicipality ?? []) {
      map.set(need.teryt, Number(need.reports))
    }
    return map
  }, [data])

  const monthlyTrend = useMemo(() => {
    const totals = new Map<string, number>()
    for (const need of data?.byMonth ?? []) {
      totals.set(need.month, (totals.get(need.month) ?? 0) + Number(need.reports))
    }
    return [...totals.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([label, value]) => ({ label, value }))
  }, [data?.byMonth])

  const areaTrend = useMemo(
    () =>
      (data?.byArea ?? [])
        .map((area) => ({ label: area.name, value: Number(area.reports) }))
        .filter((point) => point.value > 0),
    [data?.byArea],
  )

  const areaName = (code: string) => areas.data?.data.find((area) => area.code === code)?.name ?? code

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPeriod({ from: from || undefined, to: to || undefined })
  }

  function draftGrantCall(challengeAreaCode: string, teryt: string | null, label: string) {
    draft.mutate(
      { data: { challengeAreaCode, teryt } },
      {
        onSuccess: () => {
          showToast({
            title: 'Szkic naboru gotowy',
            description: label,
            tone: 'success',
          })
          navigate('/admin/nabory')
        },
      },
    )
  }

  return (
    <div className="grid gap-8">
      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Radar potrzeb</h1>
        <p className="text-body text-text-muted">
          Trendy zgłoszeń, białe plamy w Bibliotece i mapa gmin. Z białej plamy możesz od razu zrobić szkic naboru.
        </p>
      </header>

      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={submit}>
        <TextField label="Od" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <TextField label="Do" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <SoftButton type="submit" variant="primary" loading={radar.isFetching && Boolean(period.from || period.to)}>
          Pokaż okres
        </SoftButton>
      </form>

      {radar.isPending && !data && <LoadingState label="Liczę radar…" />}
      {radar.isError && (
        <ErrorState
          description={errorMessage(radar.error, { 400: 'Okres musi kończyć się po swoim początku.' })}
          onRetry={() => {
            void radar.refetch()
          }}
        />
      )}
      {draft.isError && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {errorMessage(draft.error)}
        </p>
      )}

      {data && (
        <>
          <p className="text-body-sm text-text-muted">
            Okres {data.from} - {data.to}: {data.reports} zgłoszeń po klasyfikacji.
          </p>

          {areaTrend.length > 0 && (
            <ChartPanel
              title="Potrzeby według obszaru"
              description="Liczba zgłoszeń w obszarach wyzwań w wybranym okresie. Te same liczby są w tabeli poniżej."
              seriesLabel="Liczba zgłoszeń"
              categoryLabel="Obszar"
              data={areaTrend}
            />
          )}

          {monthlyTrend.length > 0 && (
            <ChartPanel
              title="Trend zgłoszeń"
              description="Suma zgłoszeń we wszystkich obszarach w kolejnych miesiącach."
              seriesLabel="Liczba zgłoszeń"
              categoryLabel="Miesiąc"
              data={monthlyTrend}
            />
          )}

          <Section title="Potrzeby według obszaru" description="Zgłoszenia, niedopasowania i innowacje w Bibliotece.">
            <CeramicCard asChild padding="none" className="p-1">
              <ul className="grid divide-y divide-border-subtle">
                {data.byArea.map((area) => (
                  <li key={area.code} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="grid min-w-0 gap-1">
                      <p className="text-body font-medium text-text-primary">{area.name}</p>
                      <p className="text-body-sm text-text-muted">
                        {area.reports} zgłoszeń · {area.unmatched} bez dopasowania · {area.innovations} innowacji
                      </p>
                    </div>
                    {Number(area.innovations) === 0 && <Badge tone="warning">biała plama</Badge>}
                  </li>
                ))}
              </ul>
            </CeramicCard>
          </Section>

          <Section
            title="Białe plamy"
            description="Skupiska zgłoszeń, dla których Biblioteka nie ma dopasowania."
          >
            {data.blankSpots.length === 0 ? (
              <EmptyState title="Brak białych plam" description="W tym okresie każde skupisko ma dopasowanie albo nie ma skupisk." icon={Radar} />
            ) : (
              <CeramicCard asChild padding="none" className="p-1">
                <ul className="grid divide-y divide-border-subtle">
                  {data.blankSpots.map((spot) => {
                    const label = `${spot.challengeAreaName}${spot.municipality ? `, ${spot.municipality}` : ''}`
                    return (
                      <li
                        key={`${spot.challengeAreaCode}-${spot.teryt ?? 'none'}`}
                        className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="grid min-w-0 gap-1">
                          <p className="text-body font-medium text-text-primary">{spot.challengeAreaName}</p>
                          <p className="text-body-sm text-text-muted">
                            {spot.municipality ?? 'gmina niepodana'} · {spot.unmatchedReports} bez dopasowania
                          </p>
                        </div>
                        <SoftButton
                          type="button"
                          variant="secondary"
                          loading={draft.isPending}
                          onClick={() => draftGrantCall(spot.challengeAreaCode, spot.teryt, label)}
                        >
                          Szkic naboru
                        </SoftButton>
                      </li>
                    )
                  })}
                </ul>
              </CeramicCard>
            )}
          </Section>

          <Section title="Mapa zgłoszeń" description="Ciemniejszy kolor oznacza więcej zgłoszeń. Te same liczby są na liście gmin.">
            <GminaMap values={reportsByTeryt} label="Liczba zgłoszeń w gminach Małopolski. Liczby są w liście poniżej." />
            <CeramicCard asChild padding="none" className="p-1">
              <ul className="grid divide-y divide-border-subtle">
                {data.byMunicipality.map((need) => (
                  <li key={need.teryt} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-body font-medium text-text-primary">{need.name}</p>
                    <p className="text-body-sm text-text-muted">
                      {need.reports} zgłoszeń · {need.unmatched} bez dopasowania
                    </p>
                  </li>
                ))}
              </ul>
            </CeramicCard>
          </Section>

          <Section title="Trend według obszaru" description="Rozbicie miesięczne na obszary wyzwań.">
            <CeramicCard asChild padding="none" className="p-1">
              <ul className="grid divide-y divide-border-subtle">
                {data.byMonth.map((need) => (
                  <li
                    key={`${need.month}-${need.challengeAreaCode}`}
                    className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="text-body font-medium text-text-primary">
                      {need.month} · {areaName(need.challengeAreaCode)}
                    </p>
                    <p className="text-body-sm text-text-muted">{need.reports} zgłoszeń</p>
                  </li>
                ))}
              </ul>
            </CeramicCard>
          </Section>
        </>
      )}
    </div>
  )
}
