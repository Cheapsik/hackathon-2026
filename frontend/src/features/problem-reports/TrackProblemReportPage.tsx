import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'
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
import { CodeLookup, TrackedReportRail } from '@/features/problem-reports/TrackedReportRail'
import { ErrorState, LoadingState } from '@/design-system'
import { useLiveEvent } from '@/hooks/use-live-event'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/**
 * "Śledź zgłoszenie": the tracking code opens a report without an account (SPEC §7 I). The page is one workspace, full
 * width and height: the status line across the top, under it the report on a dusk column and beside it the matches
 * and the thread with ROPS (SPEC §7 V). Before a report is loaded the page is only the lookup of a code.
 */
export function TrackProblemReportPage() {
  usePageTitle('Śledź zgłoszenie')
  const { trackingCode = '' } = useParams()
  const report = useGetApiProblemReportsTrackTrackingCode(trackingCode, { query: { enabled: trackingCode !== '' } })
  const loaded = report.data?.data

  if (!loaded) {
    return (
      <div className="mx-auto grid w-full max-w-panel gap-6 px-6 py-16 lg:py-24">
        <h1 className="text-section-title font-medium tracking-display">Śledź zgłoszenie</h1>
        <p className="text-body text-text-muted">
          Wpisz kod śledzenia, żeby sprawdzić status i napisać do ROPS - bez konta.
        </p>
        <CodeLookup tone="sheet" />
        {trackingCode !== '' && report.isPending && <LoadingState label="Sprawdzam zgłoszenie…" />}
        {report.isError && (
          <ErrorState
            description={errorMessage(report.error, {
              404: 'Nie znaleźliśmy zgłoszenia z tym kodem. Sprawdź, czy kod jest poprawny.',
            })}
            onRetry={() => {
              void report.refetch()
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="sr-only">Śledź zgłoszenie</h1>
      <StatusTimeline status={loaded.status} />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <aside aria-label="Twoje zgłoszenie" className="on-frame">
          <TrackedReportRail report={loaded} />
        </aside>
        <TrackedProblemReport
          key={loaded.id}
          trackingCode={trackingCode}
          report={loaded}
          onRecheck={() => {
            void report.refetch()
          }}
          rechecking={report.isFetching && !report.isPending}
        />
      </div>
    </div>
  )
}

function TrackedProblemReport({
  trackingCode,
  report,
  onRecheck,
  rechecking,
}: {
  trackingCode: string
  report: ProblemReportResponse
  onRecheck: () => void
  rechecking: boolean
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
    <div className="grid content-start gap-14 px-6 py-10 lg:px-12 lg:py-12">
      {report.awaitsAnswers ? (
        <div className="grid max-w-default gap-4">
          <ClarifyingQuestionsStep
            questions={report.clarifyingQuestions}
            pending={answerQuestions.isPending}
            onSubmit={submitAnswers}
          />
          <p aria-live="polite" className="text-body-sm text-text-muted">
            {answerQuestions.isPending && 'Szukam rozwiązań na podstawie Twoich odpowiedzi…'}
          </p>
          {answerQuestions.isError && (
            <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
              {errorMessage(answerQuestions.error)}
            </p>
          )}
        </div>
      ) : (
        <ProblemReportResults
          report={report}
          headingLevel={2}
          onRecheck={onRecheck}
          rechecking={rechecking}
          ticket={false}
        />
      )}

      <section aria-label="Wątek z ROPS" className="grid max-w-default gap-3 border-t border-border-subtle pt-10">
        <p className="text-body-sm text-text-muted">
          Masz pytanie albo coś się zmieniło? Napisz do ROPS w wątku zgłoszenia. Odpowiedź pojawi się tutaj.
        </p>
        <ConversationThread conversationId={report.conversationId} trackingCode={report.trackingCode} headingLevel={3} />
      </section>
    </div>
  )
}
