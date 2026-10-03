import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { Link } from 'react-router'
import type { ProblemReportResponse } from '@/api/generated/castor'
import { statusLabel } from '@/features/problem-reports/status-labels'
import { pluralPl } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TrackingTicketProps {
  report: ProblemReportResponse
  headingLevel: 2 | 3 | 4
  /** Link to the report's own page (status and thread); off where the reader already is on it. */
  trackingLink?: boolean
  /** The status, gmina, areas and similar reports under the code; off while the report still awaits answers. */
  details?: boolean
  className?: string
}

type CopyState = 'idle' | 'copied' | 'failed'

/** How long "Skopiowano" stays before the button reads "Kopiuj kod" again. */
const COPIED_FOR_MS = 2500

const frameButtonClassName =
  'inline-flex min-h-touch items-center gap-2 rounded-button border border-on-frame-line px-4 text-body-sm font-medium text-on-frame transition-control press hover:bg-on-frame-line'

/**
 * The report's tracking code on a dusk ticket, in lamplight - it works like a password, so it is the one thing on the
 * results page set to be noticed and kept. With a copy button, the link to the report and, below, what the report is.
 */
export function TrackingTicket({ report, headingLevel, trackingLink = false, details = true, className }: TrackingTicketProps) {
  const Heading = `h${headingLevel}` as const
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const reports = Number(report.similarReports.reports)
  const municipalities = Number(report.similarReports.municipalities)

  useEffect(() => {
    if (copyState !== 'copied') {
      return
    }

    const timer = window.setTimeout(() => setCopyState('idle'), COPIED_FOR_MS)
    return () => window.clearTimeout(timer)
  }, [copyState])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(report.trackingCode)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <section aria-labelledby={`ticket-${report.id}`} className={cn('grid gap-5 rounded-card p-6 on-frame', className)}>
      <div className="grid gap-2">
        <Heading id={`ticket-${report.id}`} className="text-label font-medium text-on-frame-muted">
          Kod zgłoszenia
        </Heading>
        <p className="text-value font-medium tracking-display text-lamp tabular select-all">{report.trackingCode}</p>
        <p className="text-body-sm text-on-frame-muted">
          Zapisz go. Z tym kodem sprawdzisz status i napiszesz do ROPS bez logowania.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={frameButtonClassName} onClick={() => void copyCode()}>
          <Copy aria-hidden className="size-icon" strokeWidth={1.75} />
          {copyState === 'copied' ? 'Skopiowano' : 'Kopiuj kod'}
        </button>
        {trackingLink && (
          <Link to={`/zgloszenie/${encodeURIComponent(report.trackingCode)}`} className={frameButtonClassName}>
            Otwórz zgłoszenie
          </Link>
        )}
      </div>
      <p aria-live="polite" className="-mt-3 text-label text-on-frame-muted">
        {copyState === 'copied' && 'Kod jest w schowku.'}
        {copyState === 'failed' && 'Nie udało się skopiować. Zaznacz kod i skopiuj go ręcznie.'}
      </p>

      {details && (
        <dl className="grid gap-3 border-t border-on-frame-line pt-5 text-body-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-on-frame-muted">Status</dt>
            <dd className="font-medium">{statusLabel(report.status)}</dd>
          </div>
          {report.municipality && (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-on-frame-muted">Gmina</dt>
              <dd className="text-right font-medium">{report.municipality.name}</dd>
            </div>
          )}
          {report.challengeAreas.length > 0 && (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-on-frame-muted">{report.challengeAreas.length === 1 ? 'Obszar' : 'Obszary'}</dt>
              <dd className="text-right font-medium">{report.challengeAreas.map((area) => area.name).join(', ')}</dd>
            </div>
          )}
        </dl>
      )}

      {details && reports > 0 && (
        <p className="border-t border-on-frame-line pt-5 text-body-sm">
          <span className="font-medium tabular">
            {reports} {pluralPl(reports, 'osoba', 'osoby', 'osób')}
          </span>{' '}
          z {municipalities} {municipalities === 1 ? 'gminy' : 'gmin'}{' '}
          {pluralPl(reports, 'zgłosiła', 'zgłosiły', 'zgłosiło')} podobny problem.
        </p>
      )}
    </section>
  )
}
