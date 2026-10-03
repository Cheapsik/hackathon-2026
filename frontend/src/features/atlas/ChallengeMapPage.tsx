import { useMemo, useState } from 'react'
import { ArrowLeft, Map as MapIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useGetApiChallengeAreas, useGetApiIndicators, useGetApiIndicatorsIndicatorIdValues } from '@/api/generated/castor'
import {
  CeramicCard,
  EmptyState,
  ErrorState,
  LoadingState,
  SelectField,
  SoftButton,
} from '@/design-system'
import { GminaMap } from '@/features/atlas/GminaMap'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

const numberFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })

/** A choropleth of one Obserwator indicator, with the same numbers in a table. */
export function ChallengeMapPage() {
  usePageTitle('Mapa gminy')
  const [area, setArea] = useState('')
  const [indicatorId, setIndicatorId] = useState('')
  const areas = useGetApiChallengeAreas()
  const indicators = useGetApiIndicators({ ChallengeArea: area || undefined })
  const selectedId = indicatorId || indicators.data?.data[0]?.id || ''
  const values = useGetApiIndicatorsIndicatorIdValues(selectedId, { query: { enabled: selectedId.length > 0 } })
  const rows = values.data?.data
  const byTeryt = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of rows?.values ?? []) {
      map.set(row.teryt, Number(row.value))
    }
    return map
  }, [rows])

  const areaOptions = (areas.data?.data ?? []).map((challengeArea) => ({
    value: challengeArea.code,
    label: challengeArea.name,
  }))
  const indicatorOptions = (indicators.data?.data ?? []).map((indicator) => ({
    value: indicator.id,
    label: indicator.name,
  }))

  return (
    <div className="grid gap-6">
      <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />}>
        <Link to="/obszary">Atlas wyzwań</Link>
      </SoftButton>

      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Mapa gminy</h1>
        <p className="text-body text-text-muted">
          Kartogram jednego wskaźnika Obserwatora. Ciemniejszy kolor oznacza wyższą wartość. Te same liczby są w tabeli
          pod mapą. Granice gmin pochodzą z Państwowego Rejestru Granic i są uproszczone.
        </p>
      </header>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="grid gap-4 sm:grid-cols-2"
      >
        <SelectField
          label="Obszar"
          value={area}
          placeholder="wszystkie wskaźniki"
          options={areaOptions}
          loading={areas.isPending}
          onChange={(event) => {
            setArea(event.target.value)
            setIndicatorId('')
          }}
        />
        <SelectField
          label="Wskaźnik"
          value={selectedId}
          options={indicatorOptions}
          loading={indicators.isPending}
          disabled={indicatorOptions.length === 0}
          onChange={(event) => setIndicatorId(event.target.value)}
        />
      </form>

      <div aria-live="polite" className="grid gap-4">
        {values.isPending && selectedId && <LoadingState label="Wczytuję wartości…" />}
        {values.isError && (
          <ErrorState
            description={errorMessage(values.error, { 404: 'Ten wskaźnik nie ma wartości.' })}
            onRetry={() => {
              void values.refetch()
            }}
          />
        )}
        {!selectedId && !indicators.isPending && (
          <EmptyState
            title="Brak wskaźników"
            description="Wybierz inny obszar albo spróbuj ponownie później."
            icon={MapIcon}
          />
        )}
      </div>

      {rows && (
        <div className="grid gap-4">
          <p className="text-body-sm text-text-muted">
            {rows.name}, rok {rows.year}. Średnia regionu: {numberFormat.format(Number(rows.regionAverage))}
            {rows.unit ? ` ${rows.unit}` : ''}.
            {rows.level === 'POWIAT' && ' To dane dla powiatu, pokazane przy każdej jego gminie.'}
          </p>

          <CeramicCard padding="md" className="overflow-hidden">
            <GminaMap values={byTeryt} label={`Mapa: ${rows.name}, rok ${rows.year}. Liczby są w tabeli poniżej.`} />
          </CeramicCard>

          <CeramicCard padding="none" className="overflow-x-auto p-1">
            <table className="w-full min-w-[28rem] text-left text-body-sm">
              <caption className="px-3 pt-3 pb-1 text-left text-body font-medium">
                {rows.name} ({rows.year})
              </caption>
              <thead className="text-label text-text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Gmina
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Wartość
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.values.map((row) => (
                  <tr key={row.teryt}>
                    <th scope="row" className="px-3 py-3 font-medium">
                      {row.name}
                    </th>
                    <td className="px-3 py-3 text-right tabular">
                      {numberFormat.format(Number(row.value))}
                      {rows.unit ? ` ${rows.unit}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CeramicCard>
        </div>
      )}
    </div>
  )
}
