import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { usePostApiConversationsPartnerships } from '@/api/generated/castor'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** The same limits as the API's (Conversation.Subject, Message.Text). */
const subjectMaxLength = 200
const messageMaxLength = 4000

/**
 * "Napisz do zespołu innowacji": a thread with ROPS administrators, who pass the message on to the innovation's
 * authors — they have no accounts on the platform yet.
 */
export function PartnershipSection({ innovationId, innovationTitle }: { innovationId: string; innovationTitle: string }) {
  const session = useSession()

  return (
    <section aria-labelledby="partnership-title" className="no-print">
      <h2 id="partnership-title">Napisz do zespołu innowacji</h2>
      <p>Chcesz wdrożyć tę innowację albo współpracować przy niej? ROPS przekaże wiadomość autorom i odpowie w wątku.</p>
      {session?.signedIn ? (
        <PartnershipForm innovationId={innovationId} innovationTitle={innovationTitle} />
      ) : (
        <p>
          <Link to="/logowanie">Zaloguj się</Link>, żeby napisać do zespołu innowacji.
        </p>
      )}
    </section>
  )
}

function PartnershipForm({ innovationId, innovationTitle }: { innovationId: string; innovationTitle: string }) {
  const [subject, setSubject] = useState(`Współpraca: ${innovationTitle}`.slice(0, subjectMaxLength))
  const [text, setText] = useState('')
  const navigate = useNavigate()
  const propose = usePostApiConversationsPartnerships()
  const subjectId = useId()
  const textId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    propose.mutate(
      { data: { innovationId, subject, text } },
      { onSuccess: (response) => navigate(`/watki/${response.data.id}`) },
    )
  }

  return (
    <form onSubmit={submit}>
      <p>
        <label htmlFor={subjectId}>Temat</label>
        <br />
        <input
          id={subjectId}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={subjectMaxLength}
          required
          size={60}
        />
      </p>
      <p>
        <label htmlFor={textId}>Wiadomość</label>
        <br />
        <textarea
          id={textId}
          rows={6}
          cols={70}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={messageMaxLength}
          required
        />
      </p>
      <button type="submit" disabled={propose.isPending}>
        Wyślij wiadomość
      </button>
      <div aria-live="polite">
        {propose.isPending && (
          <p>
            <output>Wysyłam wiadomość…</output>
          </p>
        )}
        {propose.isError && (
          <p role="alert">
            {errorMessage(propose.error, {
              400: `Wpisz temat (do ${subjectMaxLength} znaków) i wiadomość (do ${messageMaxLength} znaków).`,
              401: 'Sesja wygasła. Zaloguj się ponownie.',
              404: 'Tej innowacji nie ma już w bibliotece.',
            })}
          </p>
        )}
      </div>
    </form>
  )
}
