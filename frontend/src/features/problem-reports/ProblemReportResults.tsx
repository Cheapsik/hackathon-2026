import { Link } from 'react-router'
import type { ProblemReportResponse } from '@/api/generated/castor'
import { DevelopHybridButton } from '@/features/ideas/DevelopHybridButton'
import { statusLabel } from '@/features/problem-reports/status-labels'

interface ProblemReportResultsProps {
  report: ProblemReportResponse
  /** The heading level of this block, so it fits the page it is on. */
  headingLevel: 2 | 3
  /** Whether the reader may turn the hybrid into their own idea - the reporter, not ROPS reviewing it. */
  developable?: boolean
}

/** The tracking code, status and matches of a report: 3-5 innovations, the similar-reports counter and a hybrid. */
export function ProblemReportResults({ report, headingLevel, developable = true }: ProblemReportResultsProps) {
  const Heading = `h${headingLevel}` as const
  const Subheading = `h${headingLevel + 1}` as 'h3' | 'h4'
  const matchCount = report.matches.length

  return (
    <section aria-labelledby={`report-${report.id}-results`}>
      <Heading id={`report-${report.id}-results`}>Wyniki dla Twojego zgłoszenia</Heading>

      <p>
        Kod śledzenia: <strong>{report.trackingCode}</strong>. Zapisz go - dzięki niemu sprawdzisz status zgłoszenia bez
        logowania.
      </p>
      <p>Status: {statusLabel(report.status)}</p>
      {report.municipality && <p>Gmina: {report.municipality.name}</p>}
      {report.challengeAreas.length > 0 && (
        <p>Obszar wyzwań: {report.challengeAreas.map((area) => area.name).join(', ')}</p>
      )}

      {Number(report.similarReports.reports) > 0 && (
        <p>
          Podobny problem zgłosiło {report.similarReports.reports} osób z {report.similarReports.municipalities} gmin.
        </p>
      )}

      <div aria-live="polite">
        {report.isMatched && matchCount === 0 && !report.hybrid && (
          <p>Nie znaleźliśmy pasującej innowacji w Bibliotece ROPS. Zgłoszenie trafiło do zespołu ROPS.</p>
        )}
        {matchCount > 0 && <p>Znaleźliśmy {matchCount} innowacji, które mogą pomóc.</p>}
      </div>

      {matchCount > 0 && (
        <ol>
          {report.matches.map((match) => (
            <li key={match.innovationId}>
              <article aria-labelledby={`match-${match.innovationId}`}>
                <Subheading id={`match-${match.innovationId}`}>{match.title}</Subheading>
                <p>Dopasowanie: {match.score} na 100</p>
                <p>Dlaczego pasuje: {match.justification}</p>
                {match.adaptation && <p>Co dostosować: {match.adaptation}</p>}
                <ul>
                  <li>
                    <Link to={`/innowacje/${match.innovationId}`}>
                      Szczegóły innowacji „{match.title}” i sprawdzenie dla Twojej gminy
                    </Link>
                  </li>
                  {match.cardUrl && (
                    <li>
                      <a href={match.cardUrl} target="_blank" rel="noreferrer">
                        Karta innowacji „{match.title}” na stronie ROPS (otwiera się w nowej karcie)
                      </a>
                    </li>
                  )}
                  {match.videoUrl && (
                    <li>
                      <a href={match.videoUrl} target="_blank" rel="noreferrer">
                        Film o innowacji „{match.title}” w serwisie YouTube (otwiera się w nowej karcie)
                      </a>
                    </li>
                  )}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      )}

      {report.hybrid && (
        <section aria-labelledby={`report-${report.id}-hybrid`}>
          <Subheading id={`report-${report.id}-hybrid`}>Krzyżówka: połączenie kilku innowacji</Subheading>
          <p>Żadna pojedyncza innowacja nie pasuje wystarczająco dobrze, więc proponujemy połączenie kilku.</p>
          <p>
            <strong>{report.hybrid.name}</strong>
          </p>
          <p>{report.hybrid.description}</p>
          <p>Dlaczego razem: {report.hybrid.whyTogether}</p>
          <p>Łączy innowacje:</p>
          <ul>
            {report.hybrid.sources.map((source) => (
              <li key={source.innovationId}>
                {source.cardUrl ? (
                  <a href={source.cardUrl} target="_blank" rel="noreferrer">
                    {source.title} (karta ROPS, otwiera się w nowej karcie)
                  </a>
                ) : (
                  source.title
                )}
              </li>
            ))}
          </ul>
          {developable && <DevelopHybridButton problemReportId={report.id} trackingCode={report.trackingCode} />}
        </section>
      )}
    </section>
  )
}
