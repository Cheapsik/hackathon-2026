import { useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetApiIdeasIdeaIdAssistantQueryKey,
  useGetApiIdeasIdeaIdAssistant,
  usePostApiIdeasIdeaIdAssistant,
} from '@/api/generated/castor'
import { errorMessage } from '@/lib/error-message'

const messageMaxLength = 2000
const visualizationRequest = 'Opisz wizualizację mojego pomysłu: jak mogłaby wyglądać ta usługa w praktyce?'

/** The Kreator's assistant: asks about the gaps in the Canvas and can describe how the idea would look in practice. */
export function IdeaAssistantChat({ ideaId }: { ideaId: string }) {
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const history = useGetApiIdeasIdeaIdAssistant(ideaId)
  const ask = usePostApiIdeasIdeaIdAssistant()
  const messageId = useId()
  const messages = history.data?.data ?? []

  function send(text: string) {
    ask.mutate(
      { ideaId, data: { message: text } },
      {
        onSuccess: (response) => {
          setMessage('')
          queryClient.setQueryData(getGetApiIdeasIdeaIdAssistantQueryKey(ideaId), response)
        },
      },
    )
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    send(message)
  }

  return (
    <section aria-labelledby="idea-assistant-title">
      <h2 id="idea-assistant-title">Asystent Kreatora</h2>
      <p>
        Asystent podpowie, czego brakuje w Canvasie, i pomoże opisać pomysł. Nie wpisuj danych osobowych - imiona,
        telefony i adresy usuwamy, zanim wiadomość trafi do modelu językowego.
      </p>

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

      <p>
        <button type="button" onClick={() => send(visualizationRequest)} disabled={ask.isPending}>
          Poproś o opis wizualizacji pomysłu
        </button>
      </p>
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
