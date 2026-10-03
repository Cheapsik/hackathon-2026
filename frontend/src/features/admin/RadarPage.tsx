import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useGetApiAdminRadar, usePostApiAdminGrantCallsDraft, useGetApiChallengeAreas } from '@/api/generated/castor'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/** "Radar": trends of needs by area, gmina and month, and blank spots with "Szkic naboru". Tables, no charts yet. */
export function RadarPage() {
  usePageTitle('Radar potrzeb')
  const [period, setPeriod] = useState<{ from?: string; to?: string }>({})
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const radar = useGetApiAdminRadar({ From: period.from, To: period.to })
  const areas = useGetApiChallengeAreas()
  const draft = usePostApiAdminGrantCallsDraft()
  const navigate = useNavigate()
  const data = radar.data?.data
  const areaName = (code: string) => areas.data?.data.find((area) => area.code === code)?.name ?? code

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPeriod({ from: from || undefined, to: to || undefined })
  }

  function draftGrantCall(challengeAreaCode: string, teryt: string | null) {
    draft.mutate({ data: { challengeAreaCode, teryt } }, { onSuccess: () => navigate('/admin/nabory') })
  }

  return (
    <>
      <h1>Radar potrzeb</h1>
      <form onSubmit={submit}>
        <label>
          Od <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>{' '}
        <label>
          Do <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>{' '}
        <button type="submit">Pokaż okres</button>
      </form>

      <div aria-live="polite">
        {radar.isPending && (
          <p>
            <output>Liczę…</output>
          </p>
        )}
        {radar.isError && <p role="alert">{errorMessage(radar.error, { 400: 'Okres musi kończyć się po swoim początku.' })}</p>}
        {draft.isPending && (
          <p>
            <output>Asystent pisze szkic naboru…</output>
          </p>
        )}
        {draft.isError && <p role="alert">{errorMessage(draft.error)}</p>}
      </div>

      {data && (
        <>
          <p>
            Okres {data.from} – {data.to}: {data.reports} zgłoszeń po klasyfikacji.
          </p>

          <table>
            <caption>Potrzeby według obszaru wyzwań</caption>
            <thead>
              <tr>
                <th scope="col">Obszar</th>
                <th scope="col">Zgłoszenia</th>
                <th scope="col">Bez dobrego dopasowania</th>
                <th scope="col">Innowacje w Bibliotece</th>
              </tr>
            </thead>
            <tbody>
              {data.byArea.map((area) => (
                <tr key={area.code}>
                  <th scope="row">{area.name}</th>
                  <td>{area.reports}</td>
                  <td>{area.unmatched}</td>
                  <td>{Number(area.innovations) === 0 ? '0 — biała plama' : area.innovations}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Białe plamy</h2>
          <p>Zgłoszenia, dla których Biblioteka nie ma dopasowania na poziomie progu krzyżówki.</p>
          {data.blankSpots.length === 0 ? (
            <p>Brak białych plam w tym okresie.</p>
          ) : (
            <table>
              <caption>Skupiska zgłoszeń bez dopasowania</caption>
              <thead>
                <tr>
                  <th scope="col">Obszar</th>
                  <th scope="col">Gmina</th>
                  <th scope="col">Zgłoszenia</th>
                  <th scope="col">Akcja</th>
                </tr>
              </thead>
              <tbody>
                {data.blankSpots.map((spot) => (
                  <tr key={`${spot.challengeAreaCode}-${spot.teryt ?? 'none'}`}>
                    <td>{spot.challengeAreaName}</td>
                    <td>{spot.municipality ?? 'nie podano'}</td>
                    <td>{spot.unmatchedReports}</td>
                    <td>
                      <button type="button" onClick={() => draftGrantCall(spot.challengeAreaCode, spot.teryt)} disabled={draft.isPending}>
                        Szkic naboru: {spot.challengeAreaName}
                        {spot.municipality ? `, ${spot.municipality}` : ''}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <table>
            <caption>Gminy z największą liczbą zgłoszeń</caption>
            <thead>
              <tr>
                <th scope="col">Gmina</th>
                <th scope="col">Zgłoszenia</th>
                <th scope="col">Bez dobrego dopasowania</th>
              </tr>
            </thead>
            <tbody>
              {data.byMunicipality.map((need) => (
                <tr key={need.teryt}>
                  <th scope="row">{need.name}</th>
                  <td>{need.reports}</td>
                  <td>{need.unmatched}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table>
            <caption>Trend: zgłoszenia w miesiącach według obszaru</caption>
            <thead>
              <tr>
                <th scope="col">Miesiąc</th>
                <th scope="col">Obszar</th>
                <th scope="col">Zgłoszenia</th>
              </tr>
            </thead>
            <tbody>
              {data.byMonth.map((need) => (
                <tr key={`${need.month}-${need.challengeAreaCode}`}>
                  <td>{need.month}</td>
                  <td>{areaName(need.challengeAreaCode)}</td>
                  <td>{need.reports}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}
