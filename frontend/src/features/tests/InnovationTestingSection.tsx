import { useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  getGetApiInnovationsInnovationIdFeedbackQueryKey,
  getGetApiInnovationsInnovationIdFeedbackSummaryQueryKey,
  getGetApiInnovationsInnovationIdQueryKey,
  useGetApiInnovationsInnovationIdFeedback,
  useGetApiInnovationsInnovationIdFeedbackSummary,
  usePostApiInnovationsInnovationIdFeedback,
  usePutApiInnovationsInnovationIdSeeksTesters,
  type InnovationResponse,
} from '@/api/generated/castor'
import { DictationButton } from '@/features/problem-reports/DictationButton'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** Ratings on an innovation card, the AI summary for the team, and the "szukam testerów" switch. */
export function InnovationTestingSection({
  innovation,
  onUpdated,
}: {
  innovation: InnovationResponse
  onUpdated: (innovation: InnovationResponse) => void
}) {
  const session = useSession()
  const feedback = useGetApiInnovationsInnovationIdFeedback(innovation.id, { query: { enabled: Boolean(session?.signedIn) } })
  const summary = useGetApiInnovationsInnovationIdFeedbackSummary(innovation.id, {
    query: { enabled: innovation.canToggleSeeksTesters, retry: false },
  })
  const write = usePostApiInnovationsInnovationIdFeedback()
  const toggle = usePutApiInnovationsInnovationIdSeeksTesters()
  const queryClient = useQueryClient()
  const [stars, setStars] = useState(5)
  const [whatWorks, setWhatWorks] = useState('')
  const [whatToImprove, setWhatToImprove] = useState('')
  const [dictated, setDictated] = useState(false)
  const worksId = useId()
  const improveId = useId()
  const mine = feedback.data?.data.find((entry) => entry.mine)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    write.mutate(
      { innovationId: innovation.id, data: { stars, whatWorks: whatWorks || null, whatToImprove: whatToImprove || null, dictated } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetApiInnovationsInnovationIdFeedbackQueryKey(innovation.id) })
          void queryClient.invalidateQueries({ queryKey: getGetApiInnovationsInnovationIdFeedbackSummaryQueryKey(innovation.id) })
        },
      },
    )
  }

  return (
    <section aria-labelledby="testing-title" className="no-print">
      <h2 id="testing-title">Poletko - ocena i testy</h2>
      {innovation.seeksTesters && (
        <p>
          Zespół szuka testerów. <Link to="/testy">Zapisz się na liście testów</Link>
          {session?.signedIn ? (
            <>
              {' '}
              albo <Link to="/profil-testera">uzupełnij profil testera</Link>.
            </>
          ) : null}
        </p>
      )}

      {innovation.canToggleSeeksTesters && (
        <p>
          <button
            type="button"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate(
                { innovationId: innovation.id, data: { seeksTesters: !innovation.seeksTesters } },
                {
                  onSuccess: (response) => {
                    onUpdated(response.data)
                    queryClient.setQueryData(getGetApiInnovationsInnovationIdQueryKey(innovation.id), response)
                  },
                },
              )
            }
          >
            {innovation.seeksTesters ? 'Wyłącz „szukam testerów”' : 'Włącz „szukam testerów”'}
          </button>
        </p>
      )}
      <div aria-live="polite">
        {toggle.isError && (
          <p role="alert">
            {errorMessage(toggle.error, {
              403: 'Tylko zespół innowacji albo ROPS włącza szukanie testerów.',
              409: 'Testerów szuka się przy etapie pomysł albo prototyp.',
            })}
          </p>
        )}
      </div>

      {!session?.signedIn && (
        <p>
          <Link to="/logowanie">Zaloguj się</Link>, żeby ocenić innowację.
        </p>
      )}

      {session?.signedIn && (
        <form onSubmit={submit}>
          <fieldset>
            <legend>{mine ? 'Popraw swoją ocenę' : 'Oceń innowację'}</legend>
            <p>
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value}>
                  <input type="radio" name="stars" checked={stars === value} onChange={() => setStars(value)} /> {value}{' '}
                </label>
              ))}
              gwiazdek
            </p>
            <p>
              <label htmlFor={worksId}>Co działa</label>
              <br />
              <textarea id={worksId} rows={3} cols={60} maxLength={4000} value={whatWorks} onChange={(event) => setWhatWorks(event.target.value)} />
            </p>
            <p>
              <label htmlFor={improveId}>Co poprawić</label>
              <br />
              <textarea
                id={improveId}
                rows={3}
                cols={60}
                maxLength={4000}
                value={whatToImprove}
                onChange={(event) => setWhatToImprove(event.target.value)}
              />
            </p>
            <DictationButton
              onPhrase={(phrase) => {
                setDictated(true)
                setWhatToImprove((current) => (current ? `${current} ${phrase}` : phrase))
              }}
            />
            <button type="submit" disabled={write.isPending}>
              Zapisz ocenę
            </button>
          </fieldset>
          <div aria-live="polite">
            {write.isError && <p role="alert">{errorMessage(write.error, { 400: 'Podaj gwiazdki i napisz, co działa albo co poprawić.' })}</p>}
            {write.isSuccess && <p>Ocena zapisana.</p>}
          </div>
        </form>
      )}

      {innovation.canToggleSeeksTesters && summary.isSuccess && (
        <section aria-labelledby="summary-title">
          <h3 id="summary-title">Podsumowanie ocen</h3>
          <p>
            Ocen: {summary.data.data.ratings}
            {Number(summary.data.data.ratings) > 0 && `, średnia ${summary.data.data.averageStars} na 5`}.
          </p>
          {summary.data.data.improvements.length === 0 ? (
            <p>Brak usprawnień do zaproponowania.</p>
          ) : (
            <ul>
              {summary.data.data.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      )}
      {innovation.canToggleSeeksTesters && summary.isError && (
        <p role="alert">{errorMessage(summary.error, { 403: 'Podsumowanie ocen widzi zespół innowacji i ROPS.' })}</p>
      )}
    </section>
  )
}
