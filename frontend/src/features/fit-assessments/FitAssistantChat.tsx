import { useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetApiInnovationsInnovationIdFitFitAssessmentIdAssistantQueryKey,
  useGetApiInnovationsInnovationIdFitFitAssessmentIdAssistant,
  usePostApiInnovationsInnovationIdFitFitAssessmentIdAssistant,
} from '@/api/generated/castor'
import { errorMessage } from '@/lib/error-message'

const messageMaxLength = 2000

/** The assistant next to the card: the user's own chat about fitting the innovation to their institution. */
export function FitAssistantChat({ innovationId, fitAssessmentId }: { innovationId: string; fitAssessmentId: string }) {
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const history = useGetApiInnovationsInnovationIdFitFitAssessmentIdAssistant(innovationId, fitAssessmentId)
  const ask = usePostApiInnovationsInnovationIdFitFitAssessmentIdAssistant()
  const messageId = useId()
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
    <section aria-labelledby="fit-assistant-title" className="no-print">
      <h3 id="fit-assistant-title">Asystent: jak to wdrożyć u nas</h3>
      <p>Opisz swoje zasoby, np. „mamy 2 opiekunki i budżet 50 tys. zł”, a asystent podpowie, jak dopasować usługę.</p>

      <div aria-live="polite">
        {history.isPending && (
          <p>
            <output>Wczytuję rozmowę…</output>
          </p>
        )}
        {messages.length > 0 && (
          <ol>
            {messages.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.role === 'USER' ? 'Ty' : 'Asystent'}:</strong> {entry.text}
              </li>
            ))}
          </ol>
        )}
        {ask.isPending && (
          <p>
            <output>Asystent pisze odpowiedź…</output>
          </p>
        )}
        {ask.isError && <p role="alert">{errorMessage(ask.error, { 400: 'Napisz wiadomość do asystenta.' })}</p>}
      </div>

      <form onSubmit={submit}>
        <label htmlFor={messageId}>Twoja wiadomość</label>
        <br />
        <textarea
          id={messageId}
          rows={3}
          cols={60}
          required
          maxLength={messageMaxLength}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <br />
        <button type="submit" disabled={ask.isPending}>
          Zapytaj asystenta
        </button>
      </form>
    </section>
  )
}
