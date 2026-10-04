import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { ArrowDown } from 'lucide-react'
import {
  usePostApiProblemReports,
  usePostApiProblemReportsProblemReportIdAnswers,
  type ProblemReportResponse,
} from '@/api/generated/castor'
import { ClarifyingQuestionsStep } from '@/features/problem-reports/ClarifyingQuestionsStep'
import {
  DescribeProblemForm,
  descriptionMaxLength,
  descriptionMinLength,
} from '@/features/problem-reports/DescribeProblemForm'
import { ReportSteps } from '@/features/problem-reports/ReportSteps'
import { SceneHeader } from '@/features/problem-reports/SceneHeader'
import { TrackingTicket } from '@/features/problem-reports/TrackingTicket'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { rynekChurchMask, rynekPhoto } from '@/lib/rynek-scene'
import './describe-problem.css'

type DescribeProblemLocationState = { description?: string } | null

function descriptionLengthInvalid(description: string | null | undefined): boolean {
  const length = description?.trim().length ?? 0
  return length < descriptionMinLength || length > descriptionMaxLength
}

/**
 * Module I, "Opisz problem", where the home page field leads. The Rynek scene with the report on a glass panel
 * (description carried over from the home page, dictation, optional gmina, consents), then the clarifying questions
 * on the light sheet below. Once the report has its matches, the page hands over to the tracking page, which shows
 * them in the application's own layout.
 */
export function DescribeProblemPage() {
  usePageTitle('Opisz problem')

  const handedOverDescription = (useLocation().state as DescribeProblemLocationState)?.description?.trim() ?? ''
  const [report, setReport] = useState<ProblemReportResponse | null>(null)
  const createReport = usePostApiProblemReports()
  const answerQuestions = usePostApiProblemReportsProblemReportIdAnswers()
  const sheetRef = useRef<HTMLElement>(null)

  // The next step takes the focus, so keyboard and screen reader users land where the page changed.
  useEffect(() => {
    if (report?.awaitsAnswers) {
      sheetRef.current?.focus()
    }
  }, [report])

  function submitAnswers(answers: string[]) {
    if (!report) {
      return
    }

    answerQuestions.mutate(
      { problemReportId: report.id, data: { answers }, headers: { 'X-Tracking-Code': report.trackingCode } },
      { onSuccess: (response) => setReport(response.data) },
    )
  }

  // Matches live in the application's layout, not on the scene: the tracking page shows them.
  if (report && !report.awaitsAnswers) {
    return <Navigate to={`/zgloszenie/${encodeURIComponent(report.trackingCode)}`} replace />
  }

  return (
    <div className="dp">
      <SceneHeader />

      <main>
        <div className="dp-frame">
          <div className="dp-scene" aria-hidden="true">
            <ScenePlate />
            <ScenePlate front />
          </div>
          {/* The header names the service; this is the decorative title of the scene. */}
          <div className="dp-container dp-wordmark" aria-hidden="true">
            <span>CASTOR</span>
          </div>

          <div className="dp-container dp-main">
            {/* The page has one h1, but the scene shows only the form: the title is for screen readers. */}
            <h1 className="dp-sr">Opisz problem</h1>

            {report ? (
              <SentPanel report={report} />
            ) : (
              <DescribeProblemForm
                pending={createReport.isPending}
                initialDescription={handedOverDescription}
                onSubmit={(request) =>
                  createReport.mutate({ data: request }, { onSuccess: (response) => setReport(response.data) })
                }
                failure={
                  createReport.isError &&
                  errorMessage(
                    createReport.error,
                    descriptionLengthInvalid(createReport.variables?.data.description)
                      ? { 400: `Sprawdź opis: musi mieć od ${descriptionMinLength} do ${descriptionMaxLength} znaków.` }
                      : undefined,
                  )
                }
              />
            )}
          </div>
        </div>

        {report && (
          <section
            id="dalej"
            ref={sheetRef}
            tabIndex={-1}
            aria-label="Pytania do zgłoszenia"
            className="dp-sheet"
          >
            <div className="dp-container @container">
              <div key="questions" className="split-aside animate-step-in">
                <div className="grid content-start gap-4">
                  <ClarifyingQuestionsStep
                    questions={report.clarifyingQuestions}
                    pending={answerQuestions.isPending}
                    onSubmit={submitAnswers}
                  />
                  <p aria-live="polite" className="text-body-sm text-text-muted">
                    {answerQuestions.isPending && 'Szukam rozwiązań na podstawie Twoich odpowiedzi…'}
                  </p>
                  {answerQuestions.isError && (
                    <p role="alert" className="rounded-control bg-danger-soft p-4 text-body-sm text-danger">
                      {errorMessage(answerQuestions.error)}
                    </p>
                  )}
                </div>
                <aside aria-label="Twoje zgłoszenie" className="@min-[56rem]:self-start">
                  <TrackingTicket report={report} headingLevel={3} details={false} trackingLink />
                </aside>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

/** The panel once the report is sent: the description as written, the steps, and the way down to the questions. */
function SentPanel({ report }: { report: ProblemReportResponse }) {
  return (
    <div className="dp-panel">
      <div className="dp-column">
        <div className="dp-field">
          <p className="dp-field-label">Twój opis</p>
          <p className="dp-summary">{report.description}</p>
        </div>
      </div>

      <div className="dp-aside">
        <ReportSteps current={1} />

        <div className="dp-group">
          <h2 className="dp-sent-title">Zgłoszenie wysłane</h2>
          <p className="dp-group-hint">Odpowiedz jeszcze na kilka krótkich pytań, żeby lepiej dobrać rozwiązania.</p>
        </div>

        <div className="dp-actions">
          <a href="#dalej" className="dp-submit">
            <span>Przejdź do pytań</span>
            <span className="dp-submit-icon" aria-hidden="true">
              <ArrowDown strokeWidth={2} />
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * The graded photo. Drawn twice: under the wordmark, and over it cut down to the church by the mask, so the towers
 * stand in front of the letters.
 */
function ScenePlate({ front = false }: { front?: boolean }) {
  return (
    <div
      className={front ? 'dp-plate dp-plate-front' : 'dp-plate'}
      style={front ? { maskImage: rynekChurchMask, WebkitMaskImage: rynekChurchMask } : undefined}
    >
      <img src={rynekPhoto} alt="" decoding="async" />
      <div className="dp-grade" />
    </div>
  )
}
