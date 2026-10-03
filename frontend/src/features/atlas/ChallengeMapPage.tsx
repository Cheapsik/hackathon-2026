import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useGetApiChallengeAreas, useGetApiIndicators, useGetApiIndicatorsIndicatorIdValues } from '@/api/generated/castor'
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

  return (
    <>
      <p>
        <Link to="/obszary">Atlas wyzwań</Link>
      </p>
      <h1>Mapa gminy</h1>
      <p>
        Kartogram jednego wskaźnika Obserwatora. Ciemniejszy kolor oznacza wyższą wartość. Te same liczby są w tabeli pod
        mapą. Granice gmin pochodzą z Państwowego Rejestru Granic i są uproszczone.
      </p>
      <form onSubmit={(event) => event.preventDefault()}>
        <label>
          Obszar{' '}
          <select
            value={area}
            onChange={(event) => {
              setArea(event.target.value)
              setIndicatorId('')
            }}
          >
            <option value="">wszystkie wskaźniki</option>
            {(areas.data?.data ?? []).map((challengeArea) => (
              <option key={challengeArea.code} value={challengeArea.code}>
                {challengeArea.name}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          Wskaźnik{' '}
          <select value={selectedId} onChange={(event) => setIndicatorId(event.target.value)}>
            {(indicators.data?.data ?? []).map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.name}
              </option>
            ))}
          </select>
        </label>
      </form>
      <div aria-live="polite">
        {values.isPending && (
          <p>
            <output>Wczytuję wartości…</output>
          </p>
        )}
        {values.isError && <p role="alert">{errorMessage(values.error, { 404: 'Ten wskaźnik nie ma wartości.' })}</p>}
      </div>
      {rows && (
        <>
          <p>
            {rows.name}, rok {rows.year}. Średnia regionu: {numberFormat.format(Number(rows.regionAverage))}
            {rows.unit ? ` ${rows.unit}` : ''}.{rows.level === 'POWIAT' && ' To dane dla powiatu, pokazane przy każdej jego gminie.'}
          </p>
          <GminaMap values={byTeryt} label={`Mapa: ${rows.name}, rok ${rows.year}. Liczby są w tabeli poniżej.`} />
          <table>
            <caption>
              {rows.name} ({rows.year})
            </caption>
            <thead>
              <tr>
                <th scope="col">Gmina</th>
                <th scope="col">Wartość</th>
              </tr>
            </thead>
            <tbody>
              {rows.values.map((row) => (
                <tr key={row.teryt}>
                  <th scope="row">{row.name}</th>
                  <td>
                    {numberFormat.format(Number(row.value))}
                    {rows.unit ? ` ${rows.unit}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}
