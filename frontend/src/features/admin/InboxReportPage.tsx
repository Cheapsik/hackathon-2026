import { useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import {
  getGetApiAdminProblemReportsProblemReportIdQueryKey,
  useGetApiAdminProblemReportsProblemReportId,
  usePostApiAdminProblemReportsProblemReportIdMove,
  usePostApiAdminProblemReportsProblemReportIdReplyDraft,
  usePutApiAdminProblemReportsProblemReportIdReplyDraft,
  type InboxProblemReportResponse,
} from '@/api/generated/castor'
import { urgencyLabels } from '@/features/admin/labels'
import { ProblemReportResults } from '@/features/problem-reports/ProblemReportResults'
import { problemReportStatusLabels, statusLabel } from '@/features/problem-reports/status-labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime, timeSince } from '@/lib/format'

/** One report as an administrator works on it: classification, suggested experts, the reply draft and the status. */
export function InboxReportPage() {
  const { problemReportId = '' } = useParams()
  const report = useGetApiAdminProblemReportsProblemReportId(problemReportId)
  const item = report.data?.data
  usePageTitle(item ? `Zgłoszenie ${item.report.trackingCode}` : 'Zgłoszenie')

  return (
    <>
      <p>
        <Link to="/admin/zgloszenia">Wróć do skrzynki</Link>
      </p>
      {report.isPending && (
        <p>
          <output>Wczytuję zgłoszenie…</output>
        </p>
      )}
      {report.isError && <p role="alert">{errorMessage(report.error, { 404: 'Nie ma takiego zgłoszenia.' })}</p>}
      {item && <InboxReport item={item} />}
    </>
  )
}

function InboxReport({ item }: { item: InboxProblemReportResponse }) {
  const report = item.report

  return (
    <>
      <h1>Zgłoszenie {report.trackingCode}</h1>
      <p>
        Wpłynęło {formatDateTime(report.createdAt)} ({timeSince(report.createdAt)}). Status: {statusLabel(report.status)}. Pilność:{' '}
        {item.urgency ? urgencyLabels[item.urgency] : 'brak oceny'}. Kanał: {report.channel}
        {report.submittedOnBehalf && ', w czyimś imieniu'}.
      </p>

      <h2>Treść (po anonimizacji)</h2>
      <p>{report.description}</p>
      {report.originalDescription && (
        <>
          <h2>Opis oryginalny (autor wyraził zgodę)</h2>
          <p>{report.originalDescription}</p>
        </>
      )}
      {report.clarifyingQuestions.length > 0 && (
        <>
          <h2>Pytania doprecyzowujące</h2>
          <dl>
            {report.clarifyingQuestions.map((question) => (
              <div key={question.question}>
                <dt>{question.question}</dt>
                <dd>{question.answer ?? 'bez odpowiedzi'}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <h2>Sugerowani eksperci</h2>
      {item.suggestedExperts.length === 0 ? (
        <p>Brak ekspertów z obszarów tego zgłoszenia. Nadaj rolę eksperta w zakładce „Użytkownicy i role”.</p>
      ) : (
        <ul>
          {item.suggestedExperts.map((expert) => (
            <li key={expert.userId}>
              {expert.email} (wspólne obszary: {expert.sharedChallengeAreaCodes.join(', ')})
            </li>
          ))}
        </ul>
      )}

      <StatusForm problemReportId={report.id} status={report.status} />
      {/* A new draft from the assistant starts the form again with its text. */}
      <ReplyDraftForm
        key={item.replyDraftUpdatedAt ?? 'none'}
        problemReportId={report.id}
        draft={item.replyDraft}
        updatedAt={item.replyDraftUpdatedAt}
      />

      {!report.awaitsAnswers && <ProblemReportResults report={report} headingLevel={2} />}
    </>
  )
}

function useStoreReport(problemReportId: string) {
  const queryClient = useQueryClient()

  return (response: { data: InboxProblemReportResponse }) =>
    queryClient.setQueryData(getGetApiAdminProblemReportsProblemReportIdQueryKey(problemReportId), response)
}

function StatusForm({ problemReportId, status }: { problemReportId: string; status: string }) {
  const [next, setNext] = useState(status)
  const move = usePostApiAdminProblemReportsProblemReportIdMove()
  const store = useStoreReport(problemReportId)
  const statusId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    move.mutate({ problemReportId, data: { status: next } }, { onSuccess: store })
  }

  return (
    <section aria-labelledby="status-title">
      <h2 id="status-title">Status</h2>
      <p>Administrator przestawia zgłoszenie do przodu albo je zamyka.</p>
      <form onSubmit={submit}>
        <label htmlFor={statusId}>Nowy status</label>{' '}
        <select id={statusId} value={next} onChange={(event) => setNext(event.target.value)}>
          {Object.entries(problemReportStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>{' '}
        <button type="submit" disabled={move.isPending || next === status}>
          Zmień status
        </button>
      </form>
      <div aria-live="polite">
        {move.isError && (
          <p role="alert">
            {errorMessage(move.error, { 400: 'Zgłoszenie można tylko przesunąć do przodu albo zamknąć.', 409: 'Tego zgłoszenia nie da się już zmienić.' })}
          </p>
        )}
      </div>
    </section>
  )
}

function ReplyDraftForm({ problemReportId, draft, updatedAt }: { problemReportId: string; draft: string | null; updatedAt: string | null }) {
  const [text, setText] = useState(draft ?? '')
  const generate = usePostApiAdminProblemReportsProblemReportIdReplyDraft()
  const save = usePutApiAdminProblemReportsProblemReportIdReplyDraft()
  const store = useStoreReport(problemReportId)
  const draftId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    save.mutate({ problemReportId, data: { text } }, { onSuccess: store })
  }

  return (
    <section aria-labelledby="reply-title">
      <h2 id="reply-title">Szkic odpowiedzi</h2>
      <p>Asystent przygotowuje szkic, który poprawiasz. Wysyłka dojdzie z wątkami zgłoszeń (moduł V).</p>
      {updatedAt && <p>Ostatnia zmiana: {formatDateTime(updatedAt)}</p>}
      <p>
        <button type="button" onClick={() => generate.mutate({ problemReportId }, { onSuccess: store })} disabled={generate.isPending}>
          {draft ? 'Wygeneruj szkic od nowa' : 'Wygeneruj szkic odpowiedzi'}
        </button>
      </p>
      <form onSubmit={submit}>
        <label htmlFor={draftId}>Treść odpowiedzi</label>
        <br />
        <textarea id={draftId} rows={8} cols={70} value={text} onChange={(event) => setText(event.target.value)} />
        <br />
        <button type="submit" disabled={save.isPending || text.trim().length === 0}>
          Zapisz szkic
        </button>
      </form>
      <div aria-live="polite">
        {generate.isPending && (
          <p>
            <output>Asystent pisze szkic…</output>
          </p>
        )}
        {save.isSuccess && (
          <p>
            <output>Szkic zapisany.</output>
          </p>
        )}
        {(generate.isError || save.isError) && <p role="alert">{errorMessage(generate.error ?? save.error)}</p>}
      </div>
    </section>
  )
}
