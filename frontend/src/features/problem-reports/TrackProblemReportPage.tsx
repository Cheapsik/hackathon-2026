import { useState, type FormEvent } from 'react'
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
import {
  CeramicCard,
  ErrorState,
  LoadingState,
  SoftButton,
  TextField,
} from '@/design-system'
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
    <div className="grid gap-6">
      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Śledź zgłoszenie</h1>
        <p className="text-body text-text-muted">
          Wpisz kod śledzenia, żeby sprawdzić status i napisać do ROPS - bez konta.
        </p>
      </header>
      <TrackingCodeForm initialCode={trackingCode ?? ''} />
      {trackingCode && <TrackedProblemReport key={trackingCode} trackingCode={trackingCode} />}
    </div>
  )
}

function TrackingCodeForm({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode)
  const navigate = useNavigate()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = code.trim()
    if (trimmed) {
      navigate(`/zgloszenie/${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <CeramicCard padding="lg" className="max-w-default">
      <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={submit}>
        <TextField
          label="Kod śledzenia"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
          autoComplete="off"
          hint="Osiem znaków, np. K7QM-2XDF. Wielkość liter i myślnik nie mają znaczenia."
        />
        <SoftButton type="submit" variant="primary">
          Sprawdź zgłoszenie
        </SoftButton>
      </form>
    </CeramicCard>
  )
}

function TrackedProblemReport({ trackingCode }: { trackingCode: string }) {
  const report = useGetApiProblemReportsTrackTrackingCode(trackingCode)

  if (report.isPending) {
    return <LoadingState label="Sprawdzam zgłoszenie…" />
  }

  if (report.isError) {
    return (
      <ErrorState
        description={errorMessage(report.error, {
          404: 'Nie znaleźliśmy zgłoszenia z tym kodem. Sprawdź, czy kod jest poprawny.',
        })}
        onRetry={() => {
          void report.refetch()
        }}
      />
    )
  }

  return <TrackedProblemReportDetails trackingCode={trackingCode} report={report.data.data} />
}

function TrackedProblemReportDetails({
  trackingCode,
  report,
}: {
  trackingCode: string
  report: ProblemReportResponse
}) {
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
    <div className="grid gap-6">
      <CeramicCard padding="lg" className="grid gap-4">
        <div className="grid gap-2">
          <h2 className="text-section-title font-medium">Twoje zgłoszenie</h2>
          <p className="whitespace-pre-line text-body text-text-primary">{report.description}</p>
        </div>
        <StatusTimeline status={report.status} />
      </CeramicCard>

      {answerQuestions.isPending && (
        <p aria-live="polite" className="text-body-sm text-text-muted">
          <output>Szukam rozwiązań na podstawie Twoich odpowiedzi…</output>
        </p>
      )}
      {answerQuestions.isError && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {errorMessage(answerQuestions.error)}
        </p>
      )}

      {report.awaitsAnswers ? (
        <ClarifyingQuestionsStep
          questions={report.clarifyingQuestions}
          pending={answerQuestions.isPending}
          onSubmit={submitAnswers}
        />
      ) : (
        <ProblemReportResults report={report} headingLevel={3} />
      )}

      <div className="grid gap-3">
        <p className="text-body-sm text-text-muted">
          Masz pytanie albo coś się zmieniło? Napisz do ROPS w wątku zgłoszenia. Odpowiedź pojawi się tutaj.
        </p>
        <ConversationThread conversationId={report.conversationId} trackingCode={report.trackingCode} headingLevel={3} />
      </div>
    </div>
  )
}
