import { problemReportStatusLabels, statusLabel } from '@/features/problem-reports/status-labels'

const statuses = Object.keys(problemReportStatusLabels)

/**
 * Where the report is now (SPEC §7 V). It shows the current step, not a history: a message from the author moves an
 * answered report back to analysis. The sentence above the steps is announced when the status changes live.
 */
export function StatusTimeline({ status }: { status: string }) {
  return (
    <>
      <p aria-live="polite">Status zgłoszenia: {statusLabel(status)}.</p>
      <ol aria-label="Etapy zgłoszenia">
        {statuses.map((step) => (
          <li key={step} aria-current={step === status ? 'step' : undefined}>
            {step === status ? <strong>{problemReportStatusLabels[step]} (teraz)</strong> : problemReportStatusLabels[step]}
          </li>
        ))}
      </ol>
    </>
  )
}
