import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { CircleHelp } from 'lucide-react'
import { useGetApiChallengeAreas, usePostApiConversationsExpertQuestions } from '@/api/generated/castor'
import {
  CeramicCard,
  EmptyState,
  LoadingState,
  SelectField,
  SoftButton,
  TextAreaField,
  TextField,
} from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** The same limits as the API's (Conversation.Subject, Message.Text). */
const subjectMaxLength = 200
const messageMaxLength = 4000

/** A question to the experts of one challenge area; every expert of the area sees the thread (SPEC §7 V). */
export function AskExpertPage() {
  usePageTitle('Zapytaj eksperta')
  const session = useSession()

  if (!session) {
    return <LoadingState label="Sprawdzam sesję…" />
  }

  if (!session.signedIn) {
    return (
      <div className="grid gap-8">
        <header className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Zapytaj eksperta</h1>
          <p className="text-body text-text-muted">
            Pytanie trafi do ekspertów wybranego obszaru. Odpowiedź znajdziesz w „Moje wątki”.
          </p>
        </header>
        <EmptyState
          title="Zaloguj się, żeby zadać pytanie"
          description="Po zalogowaniu możesz napisać do ekspertów i śledzić odpowiedź w wątku."
          icon={CircleHelp}
          action={
            <SoftButton asChild variant="primary">
              <Link to="/logowanie">Zaloguj się</Link>
            </SoftButton>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Zapytaj eksperta</h1>
        <p className="text-body text-text-muted">
          Pytanie trafi do wszystkich ekspertów wybranego obszaru wyzwań. Odpowiedź pojawi się w wątku.
        </p>
      </header>
      <ExpertQuestionForm />
    </div>
  )
}

function ExpertQuestionForm() {
  const [challengeAreaCode, setChallengeAreaCode] = useState('')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const navigate = useNavigate()
  const areas = useGetApiChallengeAreas()
  const ask = usePostApiConversationsExpertQuestions()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    ask.mutate(
      { data: { challengeAreaCode, subject, text } },
      { onSuccess: (response) => navigate(`/watki/${response.data.id}`) },
    )
  }

  return (
    <CeramicCard padding="lg" className="max-w-default">
      <form className="grid gap-5" onSubmit={submit}>
        <SelectField
          label="Obszar wyzwań"
          required
          value={challengeAreaCode}
          placeholder="Wybierz obszar"
          loading={areas.isPending}
          options={(areas.data?.data ?? []).map((area) => ({
            value: area.code,
            label: `${area.number}. ${area.name}`,
          }))}
          onChange={(event) => setChallengeAreaCode(event.target.value)}
          error={areas.isError ? 'Nie udało się wczytać obszarów. Odśwież stronę.' : undefined}
        />
        <TextField
          label="Temat"
          required
          value={subject}
          maxLength={subjectMaxLength}
          onChange={(event) => setSubject(event.target.value)}
          hint={`Do ${subjectMaxLength} znaków.`}
        />
        <TextAreaField
          label="Pytanie"
          required
          rows={8}
          value={text}
          maxLength={messageMaxLength}
          onChange={(event) => setText(event.target.value)}
          hint={`Do ${messageMaxLength} znaków.`}
        />
        <div className="flex flex-wrap gap-3">
          <SoftButton type="submit" variant="primary" loading={ask.isPending}>
            Wyślij pytanie
          </SoftButton>
        </div>
        {ask.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(ask.error, {
              400: `Wybierz obszar, wpisz temat (do ${subjectMaxLength} znaków) i pytanie (do ${messageMaxLength} znaków).`,
              401: 'Sesja wygasła. Zaloguj się ponownie.',
            })}
          </p>
        )}
      </form>
    </CeramicCard>
  )
}
