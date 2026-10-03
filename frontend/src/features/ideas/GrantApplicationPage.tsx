import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import {
  getGetApiGrantApplicationsGrantApplicationIdQueryKey,
  useGetApiGrantApplicationsGrantApplicationId,
  usePutApiGrantApplicationsGrantApplicationId,
  type GrantApplicationResponse,
} from '@/api/generated/castor'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** A draft grant application written from an idea's Canvas: the authors edit it and print it for the call. */
export function GrantApplicationPage() {
  const { grantApplicationId = '' } = useParams()
  const application = useGetApiGrantApplicationsGrantApplicationId(grantApplicationId)
  const draft = application.data?.data
  usePageTitle(draft?.title ?? 'Wniosek')

  if (application.isPending) {
    return (
      <p>
        <output>Wczytuję wniosek…</output>
      </p>
    )
  }

  if (application.isError || !draft) {
    return (
      <>
        <h1>Wniosek</h1>
        <p role="alert">{errorMessage(application.error, { 401: 'Zaloguj się, aby zobaczyć wniosek.', 404: 'Nie znaleźliśmy tego wniosku.' })}</p>
      </>
    )
  }

  return <GrantApplicationDetails key={draft.updatedAt} application={draft} />
}

function GrantApplicationDetails({ application }: { application: GrantApplicationResponse }) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <p className="no-print">
        <Link to={`/pomysly/${application.ideaId}`}>Pomysł „{application.ideaTitle}”</Link>
      </p>
      <h1>{application.title}</h1>
      <p>
        Wniosek do naboru „{application.grantCallTitle}”{application.grantCallOpen ? '' : ' (nabór jest zamknięty)'}. Ostatnia zmiana:{' '}
        {formatDateTime(application.updatedAt)}.
      </p>
      <p className="no-print">To szkic przygotowany przez asystenta na podstawie Canvasu. Przeczytaj go i popraw, zanim go złożysz.</p>

      {editing ? (
        <GrantApplicationForm application={application} onDone={() => setEditing(false)} />
      ) : (
        <>
          <section aria-labelledby="application-summary">
            <h2 id="application-summary">Streszczenie</h2>
            <p>{application.summary ?? 'Do uzupełnienia.'}</p>
          </section>
          {application.answers.map((answer, index) => (
            <section key={answer.criterion} aria-labelledby={`criterion-${index}`}>
              <h2 id={`criterion-${index}`}>{answer.criterion}</h2>
              <p>{answer.answer ?? 'Do uzupełnienia.'}</p>
            </section>
          ))}
          <p className="no-print">
            {application.canEdit && (
              <>
                <button type="button" onClick={() => setEditing(true)}>
                  Edytuj wniosek
                </button>{' '}
              </>
            )}
            <button type="button" onClick={() => window.print()}>
              Drukuj wniosek
            </button>
          </p>
        </>
      )}
    </>
  )
}

function GrantApplicationForm({ application, onDone }: { application: GrantApplicationResponse; onDone: () => void }) {
  const [title, setTitle] = useState(application.title)
  const [summary, setSummary] = useState(application.summary ?? '')
  const [answers, setAnswers] = useState(application.answers.map((answer) => answer.answer ?? ''))
  const queryClient = useQueryClient()
  const revise = usePutApiGrantApplicationsGrantApplicationId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    revise.mutate(
      { grantApplicationId: application.id, data: { title, summary: summary || null, answers } },
      {
        onSuccess: (response) => {
          queryClient.setQueryData(getGetApiGrantApplicationsGrantApplicationIdQueryKey(application.id), response)
          onDone()
        },
      },
    )
  }

  return (
    <form onSubmit={submit}>
      <p>
        <label>
          Tytuł wniosku
          <br />
          <input size={70} required maxLength={300} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
      </p>
      <p>
        <label>
          Streszczenie
          <br />
          <textarea rows={5} cols={70} maxLength={4000} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
      </p>
      {application.answers.map((answer, index) => (
        <p key={answer.criterion}>
          <label>
            {answer.criterion}
            <br />
            <textarea
              rows={5}
              cols={70}
              maxLength={4000}
              value={answers[index]}
              onChange={(event) => setAnswers(answers.map((current, position) => (position === index ? event.target.value : current)))}
            />
          </label>
        </p>
      ))}
      <button type="submit" disabled={revise.isPending}>
        Zapisz wniosek
      </button>{' '}
      <button type="button" onClick={onDone}>
        Anuluj
      </button>
      <div aria-live="polite">
        {revise.isError && <p role="alert">{errorMessage(revise.error, { 400: 'Wniosek potrzebuje tytułu.' })}</p>}
      </div>
    </form>
  )
}
