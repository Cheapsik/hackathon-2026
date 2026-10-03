import { useQueryClient } from '@tanstack/react-query'
import { MapPin, Printer, RefreshCw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { ApiError } from '@/api/castor-fetch'
import {
  getGetApiInnovationsInnovationIdFitQueryKey,
  useGetApiInnovationsInnovationIdFit,
  usePostApiInnovationsInnovationIdFit,
  usePostApiInnovationsInnovationIdFitFitAssessmentIdRecalculate,
  type MunicipalityResponse,
} from '@/api/generated/castor'
import { MunicipalityPicker } from '@/components/MunicipalityPicker'
import { CeramicCard, Section, SoftButton } from '@/design-system'
import { FitAssessmentCard } from '@/features/fit-assessments/FitAssessmentCard'
import { FitAssistantChat } from '@/features/fit-assessments/FitAssistantChat'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

const municipalityParam = 'gmina'

const linkClass = 'font-medium text-text-primary underline underline-offset-4'

/**
 * "Sprawdź dla mojej gminy": choose a gmina, then see its stored card or - when signed in - generate it. The gmina lives
 * in the URL (?gmina=TERYT), so a card can be shared as a link.
 */
export function FitAssessmentSection({ innovationId }: { innovationId: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const teryt = searchParams.get(municipalityParam)
  const session = useSession()
  const queryClient = useQueryClient()

  const stored = useGetApiInnovationsInnovationIdFit(innovationId, { teryt: teryt ?? undefined }, { query: { enabled: Boolean(teryt) } })
  const generate = usePostApiInnovationsInnovationIdFit()
  const card = stored.data?.data
  const notGeneratedYet = stored.error instanceof ApiError && stored.error.status === 404
  const recalculate = usePostApiInnovationsInnovationIdFitFitAssessmentIdRecalculate()
  const suggestedTeryt = session?.municipalityTeryt ?? null

  function choose(municipality: MunicipalityResponse | null) {
    const next = new URLSearchParams(searchParams)
    if (municipality) {
      next.set(municipalityParam, municipality.teryt)
    } else {
      next.delete(municipalityParam)
    }
    setSearchParams(next, { replace: true })
  }

  function generateCard() {
    if (!teryt) {
      return
    }

    generate.mutate(
      { innovationId, data: { teryt } },
      {
        onSuccess: (response) =>
          queryClient.setQueryData(getGetApiInnovationsInnovationIdFitQueryKey(innovationId, { teryt }), response),
      },
    )
  }

  return (
    <Section
      title="Sprawdź dla mojej gminy"
      description={
        <span className="no-print">
          Karta dopasowania pokazuje, czy innowacja przyjmie się w wybranej gminie, na podstawie danych Obserwatora Statystyk
          Społecznych.
        </span>
      }
      action={
        teryt ? (
          <SoftButton className="no-print" onClick={() => choose(null)}>
            Wybierz inną gminę
          </SoftButton>
        ) : undefined
      }
    >
      {!teryt && (
        <CeramicCard padding="lg" className="no-print grid max-w-default gap-4">
          {suggestedTeryt && (
            <div>
              <SoftButton
                variant="primary"
                icon={<MapPin aria-hidden />}
                onClick={() => setSearchParams({ [municipalityParam]: suggestedTeryt }, { replace: true })}
              >
                Sprawdź dla mojej gminy (z mojego konta)
              </SoftButton>
            </div>
          )}
          <MunicipalityPicker selected={null} onSelect={choose} />
        </CeramicCard>
      )}

      <div aria-live="polite" className="grid gap-2 empty:hidden">
        {teryt && stored.isPending && (
          <p className="text-body-sm text-text-muted">
            <output>Sprawdzam, czy karta dla tej gminy już istnieje…</output>
          </p>
        )}
        {generate.isPending && (
          <p className="text-body-sm text-text-muted">
            <output>Przygotowuję kartę dopasowania… To może potrwać kilka sekund.</output>
          </p>
        )}
        {generate.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(generate.error, {
              400: 'Wybierz gminę z listy.',
              409: 'Nie da się teraz przygotować karty: brakuje danych innowacji albo gminy. Spróbuj za chwilę.',
            })}
          </p>
        )}
        {stored.isError && !notGeneratedYet && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(stored.error)}
          </p>
        )}
      </div>

      {teryt && notGeneratedYet && !card && (
        <CeramicCard padding="lg" className="no-print grid max-w-default gap-3">
          <p className="text-body">Dla tej gminy nikt jeszcze nie przygotował karty dopasowania.</p>
          {session?.signedIn ? (
            <div>
              <SoftButton variant="primary" onClick={generateCard} loading={generate.isPending}>
                Przygotuj kartę dopasowania
              </SoftButton>
            </div>
          ) : (
            <p className="text-body-sm text-text-muted">
              <Link to="/logowanie" className={linkClass}>
                Zaloguj się
              </Link>
              , żeby przygotować kartę dla tej gminy.
            </p>
          )}
        </CeramicCard>
      )}

      {card && (
        <>
          <FitAssessmentCard card={card} />
          <div className="no-print flex flex-wrap gap-3">
            <SoftButton icon={<Printer aria-hidden />} onClick={() => window.print()}>
              Drukuj kartę albo zapisz jako PDF
            </SoftButton>
            {session?.role === 'ADMIN' && (
              <SoftButton
                variant="ghost"
                icon={<RefreshCw aria-hidden />}
                loading={recalculate.isPending}
                onClick={() =>
                  recalculate.mutate(
                    { innovationId, fitAssessmentId: card.id },
                    { onSuccess: (response) => queryClient.setQueryData(getGetApiInnovationsInnovationIdFitQueryKey(innovationId, { teryt: teryt ?? undefined }), response) },
                  )
                }
              >
                Przelicz kartę (administrator)
              </SoftButton>
            )}
          </div>
          {session?.signedIn ? (
            <FitAssistantChat innovationId={innovationId} fitAssessmentId={card.id} />
          ) : (
            <p className="no-print text-body-sm text-text-muted">
              <Link to="/logowanie" className={linkClass}>
                Zaloguj się
              </Link>
              , żeby zapytać asystenta, jak dopasować innowację do Twojej instytucji.
            </p>
          )}
        </>
      )}
    </Section>
  )
}
