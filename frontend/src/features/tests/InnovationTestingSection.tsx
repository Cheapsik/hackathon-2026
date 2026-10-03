import { useState, type FormEvent } from 'react'
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
import { CeramicCard, Section, SegmentedControl, SoftButton, TextAreaField, type SegmentedOption } from '@/design-system'
import { DictationButton } from '@/features/problem-reports/DictationButton'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

const linkClass = 'font-medium text-text-primary underline underline-offset-4'

const starOptions: SegmentedOption<string>[] = [1, 2, 3, 4, 5].map((value) => ({
  value: String(value),
  label: `${value} ★`,
  ariaLabel: `${value} na 5 gwiazdek`,
}))

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
    <Section
      title="Poletko - ocena i testy"
      description={
        innovation.seeksTesters ? (
          <>
            Zespół szuka testerów.{' '}
            <Link to="/testy" className={linkClass}>
              Zapisz się na liście testów
            </Link>
            {session?.signedIn ? (
              <>
                {' '}
                albo{' '}
                <Link to="/profil-testera" className={linkClass}>
                  uzupełnij profil testera
                </Link>
                .
              </>
            ) : null}
          </>
        ) : undefined
      }
      action={
        innovation.canToggleSeeksTesters ? (
          <SoftButton
            aria-pressed={innovation.seeksTesters}
            loading={toggle.isPending}
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
          </SoftButton>
        ) : undefined
      }
      className="no-print"
    >
      <div aria-live="polite" className="empty:hidden">
        {toggle.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(toggle.error, {
              403: 'Tylko zespół innowacji albo ROPS włącza szukanie testerów.',
              409: 'Testerów szuka się przy etapie pomysł albo prototyp.',
            })}
          </p>
        )}
      </div>

      <CeramicCard padding="lg" className="max-w-default">
        {!session?.signedIn && (
          <p className="text-body-sm text-text-muted">
            <Link to="/logowanie" className={linkClass}>
              Zaloguj się
            </Link>
            , żeby ocenić innowację.
          </p>
        )}

        {session?.signedIn && (
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-2">
              <p className="text-label font-medium">{mine ? 'Popraw swoją ocenę' : 'Oceń innowację'}</p>
              <SegmentedControl
                label="Ocena w gwiazdkach, od 1 do 5"
                options={starOptions}
                value={String(stars)}
                onValueChange={(value) => setStars(Number(value))}
              />
            </div>
            <TextAreaField label="Co działa" rows={3} maxLength={4000} value={whatWorks} onChange={(event) => setWhatWorks(event.target.value)} />
            <TextAreaField
              label="Co poprawić"
              rows={3}
              maxLength={4000}
              value={whatToImprove}
              onChange={(event) => setWhatToImprove(event.target.value)}
            />
            <DictationButton
              onPhrase={(phrase) => {
                setDictated(true)
                setWhatToImprove((current) => (current ? `${current} ${phrase}` : phrase))
              }}
            />
            <div>
              <SoftButton type="submit" variant="primary" loading={write.isPending}>
                Zapisz ocenę
              </SoftButton>
            </div>
            <div aria-live="polite" className="empty:hidden">
              {write.isError && (
                <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
                  {errorMessage(write.error, { 400: 'Podaj gwiazdki i napisz, co działa albo co poprawić.' })}
                </p>
              )}
              {write.isSuccess && <p className="rounded-control bg-success-soft p-3 text-body-sm text-success">Ocena zapisana.</p>}
            </div>
          </form>
        )}
      </CeramicCard>

      {innovation.canToggleSeeksTesters && summary.isSuccess && (
        <CeramicCard asChild padding="lg">
          <section aria-labelledby="summary-title" className="grid max-w-default gap-3">
            <h3 id="summary-title" className="text-body font-medium">
              Podsumowanie ocen
            </h3>
            <p className="text-body-sm">
              Ocen: {summary.data.data.ratings}
              {Number(summary.data.data.ratings) > 0 && `, średnia ${summary.data.data.averageStars} na 5`}.
            </p>
            {summary.data.data.improvements.length === 0 ? (
              <p className="text-body-sm text-text-muted">Brak usprawnień do zaproponowania.</p>
            ) : (
              <ul className="grid list-disc gap-1.5 pl-5 text-body-sm">
                {summary.data.data.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        </CeramicCard>
      )}
      {innovation.canToggleSeeksTesters && summary.isError && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {errorMessage(summary.error, { 403: 'Podsumowanie ocen widzi zespół innowacji i ROPS.' })}
        </p>
      )}
    </Section>
  )
}
