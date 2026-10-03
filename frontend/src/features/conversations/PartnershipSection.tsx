import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { usePostApiConversationsPartnerships } from '@/api/generated/castor'
import { CeramicCard, Section, SoftButton, TextAreaField, TextField } from '@/design-system'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** The same limits as the API's (Conversation.Subject, Message.Text). */
const subjectMaxLength = 200
const messageMaxLength = 4000

/**
 * "Napisz do zespołu innowacji": a thread with ROPS administrators, who pass the message on to the innovation's
 * authors - they have no accounts on the platform yet.
 */
export function PartnershipSection({ innovationId, innovationTitle }: { innovationId: string; innovationTitle: string }) {
  const session = useSession()

  return (
    <Section
      title="Napisz do zespołu innowacji"
      description="Chcesz wdrożyć tę innowację albo współpracować przy niej? ROPS przekaże wiadomość autorom i odpowie w wątku."
      className="no-print"
    >
      <CeramicCard padding="lg" className="max-w-default">
        {session?.signedIn ? (
          <PartnershipForm innovationId={innovationId} innovationTitle={innovationTitle} />
        ) : (
          <p className="text-body-sm text-text-muted">
            <Link to="/logowanie" className="font-medium text-text-primary underline underline-offset-4">
              Zaloguj się
            </Link>
            , żeby napisać do zespołu innowacji.
          </p>
        )}
      </CeramicCard>
    </Section>
  )
}

function PartnershipForm({ innovationId, innovationTitle }: { innovationId: string; innovationTitle: string }) {
  const [subject, setSubject] = useState(`Współpraca: ${innovationTitle}`.slice(0, subjectMaxLength))
  const [text, setText] = useState('')
  const navigate = useNavigate()
  const propose = usePostApiConversationsPartnerships()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    propose.mutate(
      { data: { innovationId, subject, text } },
      { onSuccess: (response) => navigate(`/watki/${response.data.id}`) },
    )
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <TextField
        label="Temat"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        maxLength={subjectMaxLength}
        required
      />
      <TextAreaField
        label="Wiadomość"
        rows={6}
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={messageMaxLength}
        required
      />
      <div>
        <SoftButton type="submit" variant="primary" loading={propose.isPending}>
          Wyślij wiadomość
        </SoftButton>
      </div>
      <div aria-live="polite" className="empty:hidden">
        {propose.isPending && (
          <p className="text-body-sm text-text-muted">
            <output>Wysyłam wiadomość…</output>
          </p>
        )}
        {propose.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
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
