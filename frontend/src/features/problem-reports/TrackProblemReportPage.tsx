import { useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import {
  getGetApiProblemReportsTrackTrackingCodeQueryKey,
  useGetApiProblemReportsTrackTrackingCode,
  usePostApiProblemReportsProblemReportIdAnswers,
  type ProblemReportResponse,
} from '@/api/generated/castor'
import { ConversationThread } from '@/features/conversations/ConversationThread'
import { ClarifyingQuestionsStep } from '@/features/problem-reports/ClarifyingQuestionsStep'
import { ProblemReportResults } from '@/features/problem-reports/ProblemReportResults'
import { StatusTimeline } from '@/features/problem-reports/StatusTimeline'
import { useLiveEvent } from '@/hooks/use-live-event'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/**
 * "Śledź zgłoszenie": the tracking code opens a report without an account (SPEC §7 I) - its status, refreshed live,
 * and its thread with ROPS (SPEC §7 V).
 */
export function TrackProblemReportPage() {
  usePageTitle('Śledź zgłoszenie')
  const { trackingCode } = useParams()

  return (
    <>
      <h1>Śledź zgłoszenie</h1>
      <TrackingCodeForm initialCode={trackingCode ?? ''} />
      {trackingCode && <TrackedProblemReport key={trackingCode} trackingCode={trackingCode} />}
    </>
  )
}

function TrackingCodeForm({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode)
  const navigate = useNavigate()
  const codeId = useId()
  const hintId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = code.trim()
    if (trimmed) {
      navigate(`/zgloszenie/${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form onSubmit={submit}>
      <p>
        <label htmlFor={codeId}>Kod śledzenia</label>
      </p>
      <p id={hintId}>Osiem znaków, np. K7QM-2XDF. Wielkość liter i myślnik nie mają znaczenia.</p>
      <input
        id={codeId}
        aria-describedby={hintId}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        required
        autoComplete="off"
      />{' '}
      <button type="submit">Sprawdź zgłoszenie</button>
    </form>
  )
}

function TrackedProblemReport({ trackingCode }: { trackingCode: string }) {
  const report = useGetApiProblemReportsTrackTrackingCode(trackingCode)

  return (
    <>
      <div aria-live="polite">
        {report.isPending && <p><output>Sprawdzam zgłoszenie…</output></p>}
        {report.isError && (
          <p role="alert">
            {errorMessage(report.error, { 404: 'Nie znaleźliśmy zgłoszenia z tym kodem. Sprawdź, czy kod jest poprawny.' })}
          </p>
        )}
      </div>
      {report.isSuccess && <TrackedProblemReportDetails trackingCode={trackingCode} report={report.data.data} />}
    </>
  )
}

function TrackedProblemReportDetails({ trackingCode, report }: { trackingCode: string; report: ProblemReportResponse }) {
  const queryClient = useQueryClient()
  const answerQuestions = usePostApiProblemReportsProblemReportIdAnswers()

  useLiveEvent(
    'ProblemReportStatusChanged',
    () => {
      void queryClient.invalidateQueries({ queryKey: getGetApiProblemReportsTrackTrackingCodeQueryKey(trackingCode) })
    },
    { followTrackingCode: report.trackingCode },
  )

  // The holder of the code may answer the questions too: the code works like a password.
  function submitAnswers(answers: string[]) {
    answerQuestions.mutate(
      { problemReportId: report.id, data: { answers }, headers: { 'X-Tracking-Code': report.trackingCode } },
      {
        onSuccess: (response) =>
          queryClient.setQueryData(getGetApiProblemReportsTrackTrackingCodeQueryKey(trackingCode), response),
      },
    )
  }

  return (
    <>
      <h2>Twoje zgłoszenie</h2>
      <p>{report.description}</p>
      <StatusTimeline status={report.status} />
      {answerQuestions.isPending && <p><output>Szukam rozwiązań na podstawie Twoich odpowiedzi…</output></p>}
      {answerQuestions.isError && <p role="alert">{errorMessage(answerQuestions.error)}</p>}
      {report.awaitsAnswers ? (
        <ClarifyingQuestionsStep questions={report.clarifyingQuestions} pending={answerQuestions.isPending} onSubmit={submitAnswers} />
      ) : (
        <ProblemReportResults report={report} headingLevel={3} />
      )}
      <p>Masz pytanie albo coś się zmieniło? Napisz do ROPS w wątku zgłoszenia. Odpowiedź pojawi się tutaj.</p>
      <ConversationThread conversationId={report.conversationId} trackingCode={report.trackingCode} headingLevel={3} />
    </>
  )
}
