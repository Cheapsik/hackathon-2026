import { useState, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import {
  getApiProblemReportsProblemReportIdSimilar,
  usePostApiProblemReportsProblemReportIdMatchesInnovationIdVerdict,
  usePostApiProblemReportsProblemReportIdSimilarSimilarProblemReportIdVerdict,
  type JoinedCaseResponse,
  type MatchResponse,
  type ProblemReportResponse,
  type SimilarProblemReportResponse,
  type SimilarProblemReportsResponse,
} from '@/api/generated/castor'
import { CeramicCard, SoftButton } from '@/design-system'
import { DevelopHybridButton } from '@/features/ideas/DevelopHybridButton'
import { statusLabel } from '@/features/problem-reports/status-labels'
import { TrackingTicket } from '@/features/problem-reports/TrackingTicket'
import { VerdictChoice } from '@/features/problem-reports/VerdictChoice'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime, pluralPl } from '@/lib/format'

const similarPageSize = 5

interface ProblemReportResultsProps {
  report: ProblemReportResponse
  /** The heading level of this block, so it fits the page it is on. */
  headingLevel: 2 | 3
  /** Whether the reader may turn the hybrid into their own idea - the reporter, not ROPS reviewing it. */
  developable?: boolean
  /** Whether the reader says "nie / tak / prawie" under the results - the reporter, not ROPS reviewing them. */
  decidable?: boolean
  /** The report as the API returns it after a verdict, for the page to keep. */
  onReportChange?: (report: ProblemReportResponse) => void
  /** Opening the report retries matching; the tracking page passes a refetch here. */
  onRecheck?: () => void
  rechecking?: boolean
  /** Link from the ticket to the report's own page; for the page the report was just sent from. */
  trackingLink?: boolean
  /** The ticket beside the matches; off where the page already shows the code, which also makes the list one column. */
  ticket?: boolean
}

const externalLinkClassName =
  'inline-flex min-h-touch items-center gap-1.5 text-body-sm font-medium text-text-primary underline decoration-border-strong underline-offset-4 transition-control hover:decoration-text-primary'

/**
 * The matches of a report as a ranked list - 3-5 innovations with why each fits and what to adapt - next to the
 * dusk ticket with the tracking code; a hybrid below when no single innovation fits well enough. Two columns once
 * its container is wide enough, one column (ticket first) otherwise, so it fits every page that shows it.
 */
export function ProblemReportResults({
  report,
  headingLevel,
  developable = true,
  decidable = true,
  onReportChange,
  onRecheck,
  rechecking = false,
  trackingLink = false,
  ticket = true,
}: ProblemReportResultsProps) {
  const Heading = `h${headingLevel}` as const
  const Subheading = `h${headingLevel + 1}` as 'h3' | 'h4'
  const matchCount = report.matches.length
  const similarCount = Number(report.similarReports.reports)
  const joinedCount = Number(report.joinedCount)
  const stillMatching = !report.isMatched && !report.awaitsAnswers
  const trackingPath = `/zgloszenie/${encodeURIComponent(report.trackingCode)}`
  const decideOnMatch = usePostApiProblemReportsProblemReportIdMatchesInnovationIdVerdict()

  function onMatchVerdict(innovationId: string, verdict: string, note: string | null) {
    decideOnMatch.mutate(
      {
        problemReportId: report.id,
        innovationId,
        data: { verdict, note },
        headers: { 'X-Tracking-Code': report.trackingCode },
      },
      {
        onSuccess: (response) => {
          if (response.status === 200) {
            onReportChange?.(response.data)
          }
        },
      },
    )
  }

  return (
    <section aria-labelledby={`report-${report.id}-results`} className="@container">
      <div className={ticket ? 'split-aside' : 'grid gap-8'}>
        <header className="grid gap-3 @min-[56rem]:col-start-1 @min-[56rem]:row-start-1">
          <Heading id={`report-${report.id}-results`} className="text-section-title font-medium tracking-display">
            Wyniki dla Twojego zgłoszenia
          </Heading>

          <div aria-live="polite" className="max-w-default text-lead text-text-muted">
            {stillMatching && (
              <div className="grid gap-4">
                <p>Jeszcze szukamy rozwiązań. Sprawdź za chwilę - wyniki pojawią się po otwarciu zgłoszenia kodem.</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-body">
                  {onRecheck && (
                    <SoftButton type="button" variant="secondary" loading={rechecking} onClick={onRecheck}>
                      Sprawdź ponownie
                    </SoftButton>
                  )}
                  <Link to={trackingPath} className={externalLinkClassName}>
                    Otwórz zgłoszenie kodem {report.trackingCode}
                  </Link>
                </div>
              </div>
            )}
            {report.isMatched && matchCount === 0 && !report.hybrid && (
              <p>Nie znaleźliśmy pasującej innowacji w Bibliotece ROPS. Zgłoszenie trafiło do zespołu ROPS.</p>
            )}
            {matchCount > 0 && (
              <p>
                Znaleźliśmy {matchCount} {pluralPl(matchCount, 'innowację', 'innowacje', 'innowacji')}, które mogą
                pomóc. Najlepiej pasujące są pierwsze.
              </p>
            )}
            {joinedCount > 0 && (
              <p>
                Do Twojej sprawy {pluralPl(joinedCount, 'dołączyła', 'dołączyły', 'dołączyło')} {joinedCount}{' '}
                {pluralPl(joinedCount, 'osoba', 'osoby', 'osób')} z podobnym problemem.
              </p>
            )}
          </div>
        </header>

        {ticket && (
          <aside
            aria-label="Twoje zgłoszenie"
            className="@min-[56rem]:sticky @min-[56rem]:top-6 @min-[56rem]:col-start-2 @min-[56rem]:row-span-3 @min-[56rem]:row-start-1 @min-[56rem]:self-start"
          >
            <TrackingTicket report={report} headingLevel={(headingLevel + 1) as 3 | 4} trackingLink={trackingLink} />
          </aside>
        )}

        {report.joinedCase ? (
          <JoinedCaseSection reportId={report.id} joinedCase={report.joinedCase} Subheading={Subheading} />
        ) : (
          similarCount > 0 && (
            <SimilarReportsSection
              key={report.id}
              reportId={report.id}
              trackingCode={report.trackingCode}
              similar={report.similarReports}
              Subheading={Subheading}
              decidable={decidable}
              onReportChange={onReportChange}
            />
          )
        )}

        {matchCount > 0 && (
          <ol className="border-t border-border-subtle @min-[56rem]:col-start-1">
            {report.matches.map((match, index) => (
              <MatchItem
                key={match.innovationId}
                match={match}
                rank={index + 1}
                Subheading={Subheading}
                verdict={
                  decidable && (
                    <VerdictChoice
                      current={match.verdict}
                      yesLabel="To mi pomogło"
                      subject={match.title}
                      pending={decideOnMatch.isPending && decideOnMatch.variables?.innovationId === match.innovationId}
                      error={
                        decideOnMatch.isError && decideOnMatch.variables?.innovationId === match.innovationId
                          ? errorMessage(decideOnMatch.error)
                          : null
                      }
                      onDecide={(verdict, note) => onMatchVerdict(match.innovationId, verdict, note)}
                    />
                  )
                }
              />
            ))}
          </ol>
        )}

        {report.hybrid && (
          <section
            aria-labelledby={`report-${report.id}-hybrid`}
            className="grid gap-6 rounded-panel bg-surface-solid p-6 sm:p-8 @min-[56rem]:col-start-1"
          >
            <div className="grid gap-2">
              <Subheading id={`report-${report.id}-hybrid`} className="text-section-title font-medium tracking-display">
                Krzyżówka: połączenie kilku innowacji
              </Subheading>
              <p className="max-w-default text-body text-text-muted">
                Żadna pojedyncza innowacja nie pasuje wystarczająco dobrze, więc proponujemy połączenie kilku.
              </p>
            </div>

            <div className="grid max-w-default gap-3">
              <p className="text-lead font-medium">{report.hybrid.name}</p>
              <p className="text-body">{report.hybrid.description}</p>
            </div>

            <dl className="grid gap-5 border-t border-border-subtle pt-5 @min-[40rem]:grid-cols-2 @min-[40rem]:gap-x-10">
              <div className="grid content-start gap-1">
                <dt className="text-label font-medium text-text-muted">Dlaczego razem</dt>
                <dd className="text-body">{report.hybrid.whyTogether}</dd>
              </div>
              <div className="grid content-start gap-1">
                <dt className="text-label font-medium text-text-muted">Łączy innowacje</dt>
                <dd>
                  <ul className="grid gap-1">
                    {report.hybrid.sources.map((source) => (
                      <li key={source.innovationId}>
                        {source.cardUrl ? (
                          <a href={source.cardUrl} target="_blank" rel="noreferrer" className={externalLinkClassName}>
                            {source.title}
                            <ExternalLink aria-hidden className="size-icon-sm shrink-0" strokeWidth={1.75} />
                            <span className="sr-only"> (karta ROPS, otwiera się w nowej karcie)</span>
                          </a>
                        ) : (
                          <span className="text-body">{source.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            {developable && <DevelopHybridButton problemReportId={report.id} trackingCode={report.trackingCode} />}
          </section>
        )}
      </div>
    </section>
  )
}

/**
 * Full count up front; first page comes with the report, further pages load on demand. Under every case the reporter
 * says whether it is theirs: "To moja sprawa" joins it.
 */
function SimilarReportsSection({
  reportId,
  trackingCode,
  similar,
  Subheading,
  decidable,
  onReportChange,
}: {
  reportId: string
  trackingCode: string
  similar: SimilarProblemReportsResponse
  Subheading: 'h3' | 'h4'
  decidable: boolean
  onReportChange?: (report: ProblemReportResponse) => void
}) {
  const total = Number(similar.reports)
  const cases = Number(similar.cases)
  const [items, setItems] = useState<SimilarProblemReportResponse[]>(() => similar.items ?? [])
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasMore = items.length < cases
  const decide = usePostApiProblemReportsProblemReportIdSimilarSimilarProblemReportIdVerdict()

  function onVerdict(similarProblemReportId: string, verdict: string, note: string | null) {
    decide.mutate(
      {
        problemReportId: reportId,
        similarProblemReportId,
        data: { verdict, note },
        headers: { 'X-Tracking-Code': trackingCode },
      },
      {
        onSuccess: (response) => {
          // The loaded pages stay; only the decided case changes. A new report remounts the section (its key).
          setItems((current) => current.map((item) => (item.id === similarProblemReportId ? { ...item, verdict } : item)))
          if (response.status === 200) {
            onReportChange?.(response.data)
          }
        },
      },
    )
  }

  async function loadMore() {
    if (loadingMore || !hasMore) {
      return
    }

    setLoadingMore(true)
    setLoadError(null)
    try {
      const page = await getApiProblemReportsProblemReportIdSimilar(
        reportId,
        { Skip: items.length, Take: similarPageSize },
        { 'X-Tracking-Code': trackingCode },
      )
      const nextItems = page.data.items ?? []
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id))
        return [...current, ...nextItems.filter((item) => !seen.has(item.id))]
      })
    } catch {
      setLoadError('Nie udało się doładować podobnych zgłoszeń. Spróbuj ponownie.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section
      aria-labelledby={`report-${reportId}-similar`}
      className="grid gap-4 border-t border-border-subtle pt-8 @min-[56rem]:col-start-1"
    >
      <div className="grid gap-2">
        <Subheading id={`report-${reportId}-similar`} className="text-section-title font-medium tracking-display">
          Podobne zgłoszenia
        </Subheading>
        <p className="max-w-default text-body text-text-muted">
          {total} {pluralPl(total, 'osoba', 'osoby', 'osób')} z tego samego obszaru{' '}
          {pluralPl(total, 'zgłosiła', 'zgłosiły', 'zgłosiło')} podobny problem. Poniżej przykłady (bez danych
          osobowych).
          {decidable && ' Jeśli to Twoja sprawa, dołącz do niej - zobaczysz jej status, a ROPS potraktuje ją jako ważniejszą.'}
        </p>
      </div>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <SimilarReportCard
              item={item}
              verdict={
                decidable && (
                  <VerdictChoice
                    current={item.verdict}
                    yesLabel="To moja sprawa"
                    subject={`podobne zgłoszenie z ${formatDateTime(item.createdAt)}`}
                    pending={decide.isPending && decide.variables?.similarProblemReportId === item.id}
                    error={
                      decide.isError && decide.variables?.similarProblemReportId === item.id
                        ? errorMessage(decide.error, { 409: 'To zgłoszenie dołączyło już do innej sprawy.' })
                        : null
                    }
                    onDecide={(verdict, note) => onVerdict(item.id, verdict, note)}
                  />
                )
              }
            />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="grid gap-2 justify-items-start">
          <SoftButton type="button" variant="secondary" loading={loadingMore} onClick={() => void loadMore()}>
            Pokaż więcej
          </SoftButton>
          {loadError && <p className="text-body-sm text-text-muted">{loadError}</p>}
        </div>
      )}
    </section>
  )
}

/** Anonymized excerpt of another report in the same challenge area — never shows a tracking code. */
function SimilarReportCard({ item, verdict }: { item: SimilarProblemReportResponse; verdict?: ReactNode }) {
  return (
    <CeramicCard padding="md" className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-body text-text-primary">{item.description}</p>
        <p className="text-body-sm text-text-muted">
          {item.municipality ? `${item.municipality} · ` : ''}
          {formatDateTime(item.createdAt)} · status: {statusLabel(item.status)}
        </p>
      </div>
      {verdict}
    </CeramicCard>
  )
}

/**
 * The case the report joined with "To moja sprawa": the reporter follows its status from here, without its thread,
 * and sees how many people joined it.
 */
function JoinedCaseSection({
  reportId,
  joinedCase,
  Subheading,
}: {
  reportId: string
  joinedCase: JoinedCaseResponse
  Subheading: 'h3' | 'h4'
}) {
  const joinedCount = Number(joinedCase.joinedCount)

  return (
    <section
      aria-labelledby={`report-${reportId}-joined`}
      className="grid gap-4 border-t border-border-subtle pt-8 @min-[56rem]:col-start-1"
    >
      <div className="grid gap-2">
        <Subheading id={`report-${reportId}-joined`} className="text-section-title font-medium tracking-display">
          Dołączono do sprawy
        </Subheading>
        <p className="max-w-default text-body text-text-muted">
          To Twoja sprawa, więc ROPS zajmuje się nią raz dla wszystkich. Tu widzisz jej status. Razem z Tobą{' '}
          {pluralPl(joinedCount, 'dołączyła', 'dołączyły', 'dołączyło')} {joinedCount}{' '}
          {pluralPl(joinedCount, 'osoba', 'osoby', 'osób')}.
        </p>
      </div>
      <CeramicCard padding="md" className="grid gap-2">
        <p className="text-body text-text-primary">{joinedCase.description}</p>
        <p className="text-body-sm text-text-muted">
          {joinedCase.municipality ? `${joinedCase.municipality} · ` : ''}
          {formatDateTime(joinedCase.createdAt)} · status: <strong>{statusLabel(joinedCase.status)}</strong>
        </p>
      </CeramicCard>
    </section>
  )
}

/** One ranked innovation: title and fit, why it fits, what to adapt, where to read more, and the reporter's verdict. */
function MatchItem({
  match,
  rank,
  Subheading,
  verdict,
}: {
  match: MatchResponse
  rank: number
  Subheading: 'h3' | 'h4'
  verdict?: ReactNode
}) {
  const score = Math.max(0, Math.min(100, Number(match.score)))

  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 border-b border-border-subtle py-8 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-6">
      {/* The list is ordered already; the large number is for the eye. */}
      <span aria-hidden className="text-section-title leading-none font-medium text-text-muted tabular">
        {rank}
      </span>

      <article aria-labelledby={`match-${match.innovationId}`} className="grid gap-5">
        <header className="grid gap-3">
          <Subheading id={`match-${match.innovationId}`} className="text-section-title leading-tight font-medium tracking-display">
            {match.title}
          </Subheading>
          <p className="flex items-center gap-3 text-label text-text-muted">
            <span>Dopasowanie</span>
            <span aria-hidden className="h-1.5 w-24 overflow-hidden rounded-button bg-border-subtle">
              <span className="block h-full rounded-button bg-accent" style={{ width: `${score}%` }} />
            </span>
            <span className="font-medium text-text-primary tabular">{score} na 100</span>
          </p>
          {match.shortDescription && <p className="max-w-default text-body text-text-muted">{match.shortDescription}</p>}
        </header>

        <dl className="grid gap-5 @min-[40rem]:grid-cols-2 @min-[40rem]:gap-x-10">
          <div className="grid content-start gap-1">
            <dt className="text-label font-medium text-text-muted">Dlaczego pasuje</dt>
            <dd className="text-body">{match.justification}</dd>
          </div>
          {match.adaptation && (
            <div className="grid content-start gap-1">
              <dt className="text-label font-medium text-text-muted">Co dostosować</dt>
              <dd className="text-body">{match.adaptation}</dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <SoftButton asChild variant="secondary">
            <Link to={`/innowacje/${match.innovationId}`}>
              Szczegóły i ocena dla gminy
              <span className="sr-only"> - innowacja „{match.title}”</span>
            </Link>
          </SoftButton>
          {match.cardUrl && (
            <a href={match.cardUrl} target="_blank" rel="noreferrer" className={externalLinkClassName}>
              Karta na stronie ROPS
              <ExternalLink aria-hidden className="size-icon-sm shrink-0" strokeWidth={1.75} />
              <span className="sr-only"> - „{match.title}”, otwiera się w nowej karcie</span>
            </a>
          )}
          {match.videoUrl && (
            <a href={match.videoUrl} target="_blank" rel="noreferrer" className={externalLinkClassName}>
              Film w YouTube
              <ExternalLink aria-hidden className="size-icon-sm shrink-0" strokeWidth={1.75} />
              <span className="sr-only"> - „{match.title}”, otwiera się w nowej karcie</span>
            </a>
          )}
        </div>

        {verdict}
      </article>
    </li>
  )
}
