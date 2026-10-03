import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import {
  getGetApiInnovationsInnovationIdFitFitAssessmentIdAssistantQueryKey,
  useGetApiInnovationsInnovationIdFitFitAssessmentIdAssistant,
  usePostApiInnovationsInnovationIdFitFitAssessmentIdAssistant,
} from '@/api/generated/castor'
import { CeramicCard, SoftButton, TextAreaField } from '@/design-system'
import { errorMessage } from '@/lib/error-message'
import { cn } from '@/lib/utils'

const messageMaxLength = 2000

/** The assistant next to the card: the user's own chat about fitting the innovation to their institution. */
export function FitAssistantChat({ innovationId, fitAssessmentId }: { innovationId: string; fitAssessmentId: string }) {
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const history = useGetApiInnovationsInnovationIdFitFitAssessmentIdAssistant(innovationId, fitAssessmentId)
  const ask = usePostApiInnovationsInnovationIdFitFitAssessmentIdAssistant()
  const messages = history.data?.data ?? []

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    ask.mutate(
      { innovationId, fitAssessmentId, data: { message } },
      {
        onSuccess: (response) => {
          setMessage('')
          queryClient.setQueryData(
            getGetApiInnovationsInnovationIdFitFitAssessmentIdAssistantQueryKey(innovationId, fitAssessmentId),
            response,
          )
        },
      },
    )
  }

  return (
    <CeramicCard asChild padding="lg">
      <section aria-labelledby="fit-assistant-title" className="no-print grid max-w-default gap-4">
        <div className="grid gap-1">
          <h3 id="fit-assistant-title" className="flex items-center gap-2 text-section-title font-medium">
            <Sparkles aria-hidden className="size-icon text-accent" />
            Asystent: jak to wdrożyć u nas
          </h3>
          <p className="text-body-sm text-text-muted">
            Opisz swoje zasoby, np. „mamy 2 opiekunki i budżet 50 tys. zł”, a asystent podpowie, jak dopasować usługę.
          </p>
        </div>

        <div aria-live="polite" className="grid gap-3 empty:hidden">
          {history.isPending && (
            <p className="text-body-sm text-text-muted">
              <output>Wczytuję rozmowę…</output>
            </p>
          )}
          {messages.length > 0 && (
            <ol className="grid gap-3">
              {messages.map((entry) => {
                const mine = entry.role === 'USER'
                return (
                  <li
                    key={entry.id}
                    className={cn(
                      'grid max-w-[85%] gap-1 rounded-card px-4 py-3 text-body-sm',
                      mine ? 'justify-self-end bg-surface-active text-text-inverse' : 'justify-self-start bg-chip',
                    )}
                  >
                    <span className={cn('text-label font-medium', mine ? 'text-text-inverse' : 'text-text-muted')}>
                      {mine ? 'Ty' : 'Asystent'}
                    </span>
                    <span className="whitespace-pre-line">{entry.text}</span>
                  </li>
                )
              })}
            </ol>
          )}
          {ask.isPending && (
            <p className="text-body-sm text-text-muted">
              <output>Asystent pisze odpowiedź…</output>
            </p>
          )}
          {ask.isError && (
            <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
              {errorMessage(ask.error, { 400: 'Napisz wiadomość do asystenta.' })}
            </p>
          )}
        </div>

        <form className="grid gap-3" onSubmit={submit}>
          <TextAreaField
            label="Twoja wiadomość"
            rows={3}
            required
            maxLength={messageMaxLength}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div>
            <SoftButton type="submit" variant="primary" loading={ask.isPending}>
              Zapytaj asystenta
            </SoftButton>
          </div>
        </form>
      </section>
    </CeramicCard>
  )
}
