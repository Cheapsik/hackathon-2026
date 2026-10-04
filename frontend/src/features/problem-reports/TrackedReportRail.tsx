import { useEffect, useState, type FormEvent } from 'react'
import { Check, Copy } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { ProblemReportResponse } from '@/api/generated/castor'
import { SoftButton, TextField } from '@/design-system'
import { pluralPl } from '@/lib/format'

/** How long "Skopiowano" stays before the button reads "Kopiuj kod" again. */
const COPIED_FOR_MS = 2500

/**
 * The report as a dusk column beside its matches: the code in lamplight with a copy button, the text of the report,
 * where it is about and how many others reported the same; the lookup of another code sits at the foot. Everything
 * the person needs to recognise their report, nothing they need to act on - the matches are the other column.
 */
export function TrackedReportRail({ report }: { report: ProblemReportResponse }) {
  const [copied, setCopied] = useState(false)
  const reports = Number(report.similarReports.reports)
  const municipalities = Number(report.similarReports.municipalities)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = window.setTimeout(() => setCopied(false), COPIED_FOR_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copyCode() {
    await navigator.clipboard.writeText(report.trackingCode)
    setCopied(true)
  }

  return (
    <div className="grid gap-8 p-6 lg:sticky lg:top-0 lg:p-8">
      <div className="grid gap-3">
        <h2 className="text-label font-medium text-on-frame-muted">Kod zgłoszenia</h2>
        <p className="text-value leading-none font-medium tracking-display text-lamp tabular select-all">
          {report.trackingCode}
        </p>
        <div>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="inline-flex min-h-touch items-center gap-2 rounded-button border border-on-frame-line px-4 text-body-sm font-medium text-on-frame transition-control press hover:bg-on-frame-line"
          >
            {copied ? (
              <Check aria-hidden className="size-icon" strokeWidth={2} />
            ) : (
              <Copy aria-hidden className="size-icon" strokeWidth={1.75} />
            )}
            {copied ? 'Skopiowano' : 'Kopiuj kod'}
          </button>
          <span aria-live="polite" className="sr-only">
            {copied && 'Kod jest w schowku.'}
          </span>
        </div>
      </div>

      <section aria-labelledby={`rail-text-${report.id}`} className="grid gap-2 border-t border-on-frame-line pt-6">
        <h2 id={`rail-text-${report.id}`} className="text-label font-medium text-on-frame-muted">
          Twoje zgłoszenie
        </h2>
        <p className="whitespace-pre-line text-lead">{report.description}</p>
      </section>

      {(report.municipality || report.challengeAreas.length > 0 || reports > 0) && (
        <dl className="grid gap-4 border-t border-on-frame-line pt-6 text-body-sm">
          {report.municipality && (
            <div className="grid gap-0.5">
              <dt className="text-on-frame-muted">Gmina</dt>
              <dd className="font-medium">{report.municipality.name}</dd>
            </div>
          )}
          {report.challengeAreas.length > 0 && (
            <div className="grid gap-0.5">
              <dt className="text-on-frame-muted">{report.challengeAreas.length === 1 ? 'Obszar' : 'Obszary'}</dt>
              <dd className="font-medium">{report.challengeAreas.map((area) => area.name).join(', ')}</dd>
            </div>
          )}
          {reports > 0 && (
            <div className="grid gap-0.5">
              <dt className="text-on-frame-muted">Podobne zgłoszenia</dt>
              <dd className="font-medium">
                {reports} {pluralPl(reports, 'osoba', 'osoby', 'osób')} z {municipalities}{' '}
                {municipalities === 1 ? 'gminy' : 'gmin'}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="border-t border-on-frame-line pt-6">
        <CodeLookup tone="frame" />
      </div>
    </div>
  )
}

/**
 * The lookup of a tracking code: at the foot of the rail of a loaded report (`frame`, on dusk) and alone on the page
 * before one is loaded (`sheet`). The fields keep their white paper on dusk; only the label and the button change.
 */
export function CodeLookup({ tone }: { tone: 'frame' | 'sheet' }) {
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const onFrame = tone === 'frame'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = code.trim()
    if (trimmed) {
      navigate(`/zgloszenie/${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      {onFrame && (
        <p aria-hidden className="text-label font-medium text-on-frame-muted">
          Sprawdź inny kod
        </p>
      )}
      <TextField
        label="Kod śledzenia"
        hideLabel={onFrame}
        placeholder="Np. K7QM-2XDF"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        required
        autoComplete="off"
        hint={onFrame ? undefined : 'Osiem znaków, wielkość liter i myślnik nie mają znaczenia.'}
      />
      {onFrame ? (
        <button
          type="submit"
          className="inline-flex min-h-touch items-center justify-center rounded-button border border-on-frame-line px-4 text-body-sm font-medium text-on-frame transition-control press hover:bg-on-frame-line"
        >
          Sprawdź zgłoszenie
        </button>
      ) : (
        <SoftButton type="submit" variant="primary">
          Sprawdź zgłoszenie
        </SoftButton>
      )}
    </form>
  )
}
