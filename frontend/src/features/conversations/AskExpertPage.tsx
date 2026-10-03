import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useGetApiChallengeAreas, usePostApiConversationsExpertQuestions } from '@/api/generated/castor'
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

  if (session && !session.signedIn) {
    return (
      <>
        <h1>Zapytaj eksperta</h1>
        <p>
          <Link to="/logowanie">Zaloguj się</Link>, żeby zadać pytanie ekspertom. Odpowiedź znajdziesz potem w zakładce
          „Moje wątki”.
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Zapytaj eksperta</h1>
      <p>Pytanie trafi do wszystkich ekspertów wybranego obszaru wyzwań. Odpowiedź pojawi się w wątku.</p>
      <ExpertQuestionForm />
    </>
  )
}

function ExpertQuestionForm() {
  const [challengeAreaCode, setChallengeAreaCode] = useState('')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const navigate = useNavigate()
  const areas = useGetApiChallengeAreas()
  const ask = usePostApiConversationsExpertQuestions()
  const areaId = useId()
  const subjectId = useId()
  const textId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    ask.mutate(
      { data: { challengeAreaCode, subject, text } },
      { onSuccess: (response) => navigate(`/watki/${response.data.id}`) },
    )
  }

  return (
    <form onSubmit={submit}>
      <p>
        <label htmlFor={areaId}>Obszar wyzwań</label>
        <br />
        <select id={areaId} value={challengeAreaCode} onChange={(event) => setChallengeAreaCode(event.target.value)} required>
          <option value="">Wybierz obszar</option>
          {(areas.data?.data ?? []).map((area) => (
            <option key={area.code} value={area.code}>
              {area.number}. {area.name}
            </option>
          ))}
        </select>
      </p>
      {areas.isError && <p role="alert">Nie udało się wczytać obszarów wyzwań. Odśwież stronę.</p>}
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
        <label htmlFor={textId}>Pytanie</label>
        <br />
        <textarea
          id={textId}
          rows={8}
          cols={70}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={messageMaxLength}
          required
        />
      </p>
      <button type="submit" disabled={ask.isPending}>
        Wyślij pytanie
      </button>
      <div aria-live="polite">
        {ask.isPending && (
          <p>
            <output>Wysyłam pytanie…</output>
          </p>
        )}
        {ask.isError && (
          <p role="alert">
            {errorMessage(ask.error, {
              400: `Wybierz obszar, wpisz temat (do ${subjectMaxLength} znaków) i pytanie (do ${messageMaxLength} znaków).`,
              401: 'Sesja wygasła. Zaloguj się ponownie.',
            })}
          </p>
        )}
      </div>
    </form>
  )
}
