import { useQueryClient } from '@tanstack/react-query'
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
import { FitAssessmentCard } from '@/features/fit-assessments/FitAssessmentCard'
import { FitAssistantChat } from '@/features/fit-assessments/FitAssistantChat'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

const municipalityParam = 'gmina'

/**
 * "Sprawdź dla mojej gminy": choose a gmina, then see its stored card or — when signed in — generate it. The gmina lives
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
    <section aria-labelledby="fit-title">
      <h2 id="fit-title">Sprawdź dla mojej gminy</h2>
      <p className="no-print">
        Karta dopasowania pokazuje, czy innowacja przyjmie się w wybranej gminie, na podstawie danych Obserwatora Statystyk
        Społecznych.
      </p>

      <div className="no-print">
        {teryt ? (
          <p>
            <button type="button" onClick={() => choose(null)}>
              Wybierz inną gminę
            </button>
          </p>
        ) : (
          <>
            {suggestedTeryt && (
              <p>
                <button type="button" onClick={() => setSearchParams({ [municipalityParam]: suggestedTeryt }, { replace: true })}>
                  Sprawdź dla mojej gminy (z mojego konta)
                </button>
              </p>
            )}
            <MunicipalityPicker selected={null} onSelect={choose} />
          </>
        )}
      </div>

      <div aria-live="polite">
        {teryt && stored.isPending && (
          <p>
            <output>Sprawdzam, czy karta dla tej gminy już istnieje…</output>
          </p>
        )}
        {generate.isPending && (
          <p>
            <output>Przygotowuję kartę dopasowania… To może potrwać kilka sekund.</output>
          </p>
        )}
        {generate.isError && (
          <p role="alert">
            {errorMessage(generate.error, {
              400: 'Wybierz gminę z listy.',
              409: 'Nie da się teraz przygotować karty: brakuje danych innowacji albo gminy. Spróbuj za chwilę.',
            })}
          </p>
        )}
        {stored.isError && !notGeneratedYet && <p role="alert">{errorMessage(stored.error)}</p>}
      </div>

      {teryt && notGeneratedYet && !card && (
        <div className="no-print">
          <p>Dla tej gminy nikt jeszcze nie przygotował karty dopasowania.</p>
          {session?.signedIn ? (
            <button type="button" onClick={generateCard} disabled={generate.isPending}>
              Przygotuj kartę dopasowania
            </button>
          ) : (
            <p>
              <Link to="/logowanie">Zaloguj się</Link>, żeby przygotować kartę dla tej gminy.
            </p>
          )}
        </div>
      )}

      {card && (
        <>
          <FitAssessmentCard card={card} />
          <p className="no-print">
            <button type="button" onClick={() => window.print()}>
              Drukuj kartę albo zapisz jako PDF
            </button>
            {session?.role === 'ADMIN' && (
              <>
                {' '}
                <button
                  type="button"
                  disabled={recalculate.isPending}
                  onClick={() =>
                    recalculate.mutate(
                      { innovationId, fitAssessmentId: card.id },
                      { onSuccess: (response) => queryClient.setQueryData(getGetApiInnovationsInnovationIdFitQueryKey(innovationId, { teryt: teryt ?? undefined }), response) },
                    )
                  }
                >
                  Przelicz kartę (administrator)
                </button>
              </>
            )}
          </p>
          {session?.signedIn ? (
            <FitAssistantChat innovationId={innovationId} fitAssessmentId={card.id} />
          ) : (
            <p className="no-print">
              <Link to="/logowanie">Zaloguj się</Link>, żeby zapytać asystenta, jak dopasować innowację do Twojej instytucji.
            </p>
          )}
        </>
      )}
    </section>
  )
}
