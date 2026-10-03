import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import {
  getGetApiIdeasIdeaIdAssistantQueryKey,
  useGetApiIdeasIdeaIdAssistant,
  usePostApiIdeasIdeaIdAssistant,
} from '@/api/generated/castor'
import { CeramicCard, SoftButton, TextAreaField } from '@/design-system'
import { errorMessage } from '@/lib/error-message'
import { cn } from '@/lib/utils'

const messageMaxLength = 2000
const visualizationRequest = 'Opisz wizualizację mojego pomysłu: jak mogłaby wyglądać ta usługa w praktyce?'

/** The Kreator's assistant: asks about the gaps in the Canvas and can describe how the idea would look in practice. */
export function IdeaAssistantChat({ ideaId }: { ideaId: string }) {
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const history = useGetApiIdeasIdeaIdAssistant(ideaId)
  const ask = usePostApiIdeasIdeaIdAssistant()
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
    <CeramicCard asChild padding="lg">
      <section aria-labelledby="idea-assistant-title" className="grid max-w-default gap-4">
        <div className="grid gap-1">
          <h2 id="idea-assistant-title" className="flex items-center gap-2 font-display text-section-title tracking-display">
            <Sparkles aria-hidden className="size-icon text-accent" />
            Asystent Kreatora
          </h2>
          <p className="text-body-sm text-text-muted">
            Asystent podpowie, czego brakuje w Canvasie, i pomoże opisać pomysł. Nie wpisuj danych osobowych - imiona,
            telefony i adresy usuwamy, zanim wiadomość trafi do modelu językowego.
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

        <div>
          <SoftButton
            type="button"
            variant="secondary"
            disabled={ask.isPending}
            onClick={() => send(visualizationRequest)}
          >
            Poproś o opis wizualizacji pomysłu
          </SoftButton>
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
