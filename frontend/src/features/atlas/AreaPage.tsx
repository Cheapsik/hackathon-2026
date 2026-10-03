import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import {
  useGetApiChallengeAreasCode,
  useGetApiInnovations,
  useGetApiMunicipalitiesTerytProfile,
  type MunicipalityResponse,
} from '@/api/generated/castor'
import { MunicipalityPicker } from '@/components/MunicipalityPicker'
import {
  CeramicCard,
  ErrorState,
  LoadingState,
  Section,
  SoftButton,
} from '@/design-system'
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
    return <LoadingState label="Wczytuję obszar…" />
  }

  if (area.isError || !card) {
    return (
      <div className="grid gap-6">
        <header className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Obszar wyzwań</h1>
        </header>
        <ErrorState
          description={errorMessage(area.error, { 404: 'Nie znaleźliśmy tego obszaru.' })}
          onRetry={() => {
            void area.refetch()
          }}
        />
      </div>
    )
  }

  const innovationRows = innovations.data?.data ?? []

  return (
    <div className="grid gap-8">
      <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />}>
        <Link to="/obszary">Atlas wyzwań</Link>
      </SoftButton>

      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <p className="text-label font-medium text-text-muted">Obszar {card.number}</p>
          <h1 className="font-display text-page-title tracking-display">{card.name}</h1>
          <p className="text-body-sm text-text-muted">Źródło opisu: {card.source}.</p>
        </div>
        {card.plainText && (
          <SoftButton type="button" variant="secondary" onClick={() => setPlain((current) => !current)}>
            {plain ? 'Pokaż pełny opis' : 'Prościej'}
          </SoftButton>
        )}
      </header>

      <p className="max-w-default text-lead">{plain && card.plainText ? card.plainText : card.definition}</p>

      <Section title="Kluczowe wyzwania">
        <CeramicCard padding="lg">
          <ul className="grid gap-2 text-body">
            {card.keyChallenges.map((challenge) => (
              <li key={challenge} className="border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                {challenge}
              </li>
            ))}
          </ul>
        </CeramicCard>
      </Section>

      {card.personas.length > 0 && (
        <Section title="Persony" description="Osoby z Mapy Wyzwań są fikcyjne. Pokazują, kogo ten obszar dotyczy.">
          <ul className="grid gap-3">
            {card.personas.map((persona) => (
              <li key={persona.name}>
                <CeramicCard padding="lg" className="grid gap-3">
                  <h3 className="font-display text-section-title tracking-display">
                    {persona.name}
                    {persona.age !== null && `, ${persona.age} lat`}
                  </h3>
                  {persona.description.map((paragraph) => (
                    <p key={paragraph} className="text-body text-text-primary">
                      {paragraph}
                    </p>
                  ))}
                  {persona.goals.length > 0 && (
                    <p className="text-body-sm text-text-muted">Cele: {persona.goals.join('; ')}</p>
                  )}
                  {persona.challenges.length > 0 && (
                    <p className="text-body-sm text-text-muted">Trudności: {persona.challenges.join('; ')}</p>
                  )}
                </CeramicCard>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title="Dane gminy"
        description="Wskaźniki Obserwatora dla tego obszaru, obok średniej Małopolski z tego samego roku."
      >
        <div className="grid gap-4">
          {session?.municipalityTeryt && !municipality && (
            <p className="text-body-sm text-text-muted">
              Pokazuję gminę przypisaną do Twojego konta. Możesz wybrać inną.
            </p>
          )}
          <MunicipalityPicker selected={municipality} onSelect={setMunicipality} />

          <div aria-live="polite" className="grid gap-4">
            {!teryt && <p className="text-body-sm text-text-muted">Wybierz gminę, żeby zobaczyć jej dane.</p>}
            {profile.isPending && <LoadingState label="Wczytuję dane gminy…" />}
            {profile.isError && (
              <ErrorState
                description={errorMessage(profile.error, { 404: 'Nie znaleźliśmy tej gminy.' })}
                onRetry={() => {
                  void profile.refetch()
                }}
              />
            )}
          </div>

          {profile.data && (
            <div className="grid gap-3">
              <p className="text-body-sm text-text-muted">
                {profile.data.data.qualifiedName}, powiat {profile.data.data.powiat}.
              </p>
              <CeramicCard padding="none" className="overflow-x-auto p-1">
                <table className="w-full min-w-[40rem] text-left text-body-sm">
                  <caption className="px-3 pt-3 pb-1 text-left text-body font-medium">
                    Wskaźniki gminy {profile.data.data.qualifiedName}
                  </caption>
                  <thead className="text-label text-text-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">
                        Wskaźnik
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Wartość
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Średnia regionu
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Rok
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {profile.data.data.indicators.map((indicator) => (
                      <tr key={indicator.indicatorId}>
                        <th scope="row" className="px-3 py-3 font-medium">
                          {indicator.name}
                          {indicator.level === 'POWIAT' && (
                            <span className="font-normal text-text-muted"> (dane dla powiatu)</span>
                          )}
                          {indicator.general && <span className="font-normal text-text-muted"> (wskaźnik ogólny)</span>}
                        </th>
                        <td className="px-3 py-3 text-right tabular">
                          {formatMeasure(indicator.value, indicator.unit)}
                        </td>
                        <td className="px-3 py-3 text-right tabular text-text-muted">
                          {formatMeasure(indicator.regionAverage, indicator.unit)}
                        </td>
                        <td className="px-3 py-3 text-right tabular">{indicator.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CeramicCard>
            </div>
          )}
        </div>
      </Section>

      <Section title="Innowacje w tym obszarze">
        <div className="grid gap-4">
          {innovations.isPending && <LoadingState label="Wczytuję innowacje…" />}
          {!innovations.isPending && innovationRows.length === 0 && (
            <p className="text-body-sm text-text-muted">Nie ma jeszcze innowacji przypisanych do tego obszaru.</p>
          )}
          {innovationRows.length > 0 && (
            <CeramicCard asChild padding="none" className="p-1">
              <ul className="grid divide-y divide-border-subtle">
                {innovationRows.map((innovation) => (
                  <li key={innovation.id}>
                    <div className="grid gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="grid min-w-0 gap-1">
                        <Link
                          to={`/innowacje/${innovation.id}`}
                          className="font-medium text-text-primary underline-offset-4 hover:underline"
                        >
                          {innovation.title}
                        </Link>
                        <p className="text-body-sm text-text-muted">
                          {stageLabels[innovation.stage] ?? innovation.stage}
                        </p>
                      </div>
                      <SoftButton asChild variant="ghost">
                        <Link to={`/innowacje/${innovation.id}`}>Otwórz</Link>
                      </SoftButton>
                    </div>
                  </li>
                ))}
              </ul>
            </CeramicCard>
          )}
          <p>
            <SoftButton asChild variant="secondary">
              <Link to={`/biblioteka?obszar=${card.code}`}>Otwórz te innowacje w Bibliotece</Link>
            </SoftButton>
          </p>
        </div>
      </Section>
    </div>
  )
}

function formatMeasure(value: number | string, unit: string | null): string {
  const formatted = numberFormat.format(Number(value))
  return unit ? `${formatted} ${unit}` : formatted
}
