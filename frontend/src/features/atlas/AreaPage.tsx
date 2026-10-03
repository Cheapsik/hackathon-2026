import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  useGetApiChallengeAreasCode,
  useGetApiInnovations,
  useGetApiMunicipalitiesTerytProfile,
  type MunicipalityResponse,
} from '@/api/generated/castor'
import { MunicipalityPicker } from '@/components/MunicipalityPicker'
import { SoftButton } from '@/design-system'
import { stageLabels } from '@/features/admin/labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

const numberFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })

/** One area: definition, persona, the chosen gmina against the region, and the innovations of that area. */
export function AreaPage() {
  const { code = '' } = useParams()
  const area = useGetApiChallengeAreasCode(code)
  const card = area.data?.data
  usePageTitle(card?.name ?? 'Obszar wyzwań')
  const [plain, setPlain] = useState(false)
  const [municipality, setMunicipality] = useState<MunicipalityResponse | null>(null)
  const session = useSession()
  const teryt = municipality?.teryt ?? session?.municipalityTeryt ?? ''
  const profile = useGetApiMunicipalitiesTerytProfile(teryt, { ChallengeArea: code }, { query: { enabled: teryt.length > 0 } })
  const innovations = useGetApiInnovations({ ChallengeArea: code })

  if (area.isPending) {
    return (
      <p>
        <output>Wczytuję obszar…</output>
      </p>
    )
  }

  if (area.isError || !card) {
    return (
      <>
        <h1>Obszar wyzwań</h1>
        <p role="alert">{errorMessage(area.error, { 404: 'Nie znaleźliśmy tego obszaru.' })}</p>
      </>
    )
  }

  return (
    <>
      <p>
        <Link to="/obszary">Atlas wyzwań</Link>
      </p>
      <h1>
        {card.number}. {card.name}
      </h1>
      <p>Źródło opisu: {card.source}.</p>
      {card.plainText && (
        <p>
          <button type="button" onClick={() => setPlain((current) => !current)}>
            {plain ? 'Pokaż pełny opis' : 'Prościej'}
          </button>
        </p>
      )}
      <p>{plain && card.plainText ? card.plainText : card.definition}</p>

      <section aria-labelledby="challenges-title">
        <h2 id="challenges-title">Kluczowe wyzwania</h2>
        <ul>
          {card.keyChallenges.map((challenge) => (
            <li key={challenge}>{challenge}</li>
          ))}
        </ul>
      </section>

      {card.personas.length > 0 && (
        <section aria-labelledby="personas-title">
          <h2 id="personas-title">Persony</h2>
          <p>Osoby z Mapy Wyzwań są fikcyjne. Pokazują, kogo ten obszar dotyczy.</p>
          {card.personas.map((persona) => (
            <article key={persona.name}>
              <h3>
                {persona.name}
                {persona.age !== null && `, ${persona.age} lat`}
              </h3>
              {persona.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {persona.goals.length > 0 && <p>Cele: {persona.goals.join('; ')}</p>}
              {persona.challenges.length > 0 && <p>Trudności: {persona.challenges.join('; ')}</p>}
            </article>
          ))}
        </section>
      )}

      <section aria-labelledby="gmina-title">
        <h2 id="gmina-title">Dane gminy</h2>
        <p>Wskaźniki Obserwatora dla tego obszaru, obok średniej Małopolski z tego samego roku.</p>
        {session?.municipalityTeryt && !municipality && <p>Pokazuję gminę przypisaną do Twojego konta. Możesz wybrać inną.</p>}
        <MunicipalityPicker selected={municipality} onSelect={setMunicipality} />
        <div aria-live="polite">
          {!teryt && <p>Wybierz gminę, żeby zobaczyć jej dane.</p>}
          {profile.isPending && (
            <p>
              <output>Wczytuję dane gminy…</output>
            </p>
          )}
          {profile.isError && <p role="alert">{errorMessage(profile.error, { 404: 'Nie znaleźliśmy tej gminy.' })}</p>}
        </div>
        {profile.data && (
          <>
            <p>
              {profile.data.data.qualifiedName}, powiat {profile.data.data.powiat}.
            </p>
            <table>
              <caption>Wskaźniki gminy {profile.data.data.qualifiedName}</caption>
              <thead>
                <tr>
                  <th scope="col">Wskaźnik</th>
                  <th scope="col">Wartość</th>
                  <th scope="col">Średnia regionu</th>
                  <th scope="col">Rok</th>
                </tr>
              </thead>
              <tbody>
                {profile.data.data.indicators.map((indicator) => (
                  <tr key={indicator.indicatorId}>
                    <th scope="row">
                      {indicator.name}
                      {indicator.level === 'POWIAT' && ' (dane dla powiatu)'}
                      {indicator.general && ' (wskaźnik ogólny)'}
                    </th>
                    <td>{formatMeasure(indicator.value, indicator.unit)}</td>
                    <td>{formatMeasure(indicator.regionAverage, indicator.unit)}</td>
                    <td>{indicator.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section aria-labelledby="area-innovations-title">
        <h2 id="area-innovations-title">Innowacje w tym obszarze</h2>
        {(innovations.data?.data ?? []).length === 0 && innovations.isSuccess && <p>Nie ma jeszcze innowacji przypisanych do tego obszaru.</p>}
        <ul>
          {(innovations.data?.data ?? []).map((innovation) => (
            <li key={innovation.id}>
              <Link to={`/innowacje/${innovation.id}`}>{innovation.title}</Link> - {stageLabels[innovation.stage] ?? innovation.stage}
            </li>
          ))}
        </ul>
        <p>
          <SoftButton asChild>
            <Link to={`/biblioteka?obszar=${card.code}`}>Otwórz te innowacje w Bibliotece</Link>
          </SoftButton>
        </p>
      </section>
    </>
  )
}

function formatMeasure(value: number | string, unit: string | null): string {
  const formatted = numberFormat.format(Number(value))
  return unit ? `${formatted} ${unit}` : formatted
}
