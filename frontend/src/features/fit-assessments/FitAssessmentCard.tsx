import type { FitAssessmentResponse } from '@/api/generated/castor'

const fitLabels: Record<string, string> = {
  HIGH: 'wysokie',
  MEDIUM: 'średnie',
  LOW: 'niskie',
}

const numberFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })

function formatNumber(value: number | string, unit: string | null): string {
  const formatted = numberFormat.format(Number(value))
  return unit ? `${formatted} ${unit}` : formatted
}

/** The card itself (SPEC 6.5): the assessment, "requirement vs the gmina" as a table, the service model and scale. */
export function FitAssessmentCard({ card }: { card: FitAssessmentResponse }) {
  return (
    <article aria-labelledby={`fit-${card.id}`}>
      <h3 id={`fit-${card.id}`}>
        Karta dopasowania: {card.innovationTitle} — {card.municipality.name}
      </h3>
      <p>
        Dopasowanie: <strong>{fitLabels[card.fit] ?? card.fit}</strong>
      </p>
      <p>{card.summary}</p>
      <p>
        Dane: Internetowy Obserwator Statystyk Społecznych, rok {card.dataYear}. Powiat {card.municipality.powiat}.
      </p>

      {card.comparison.length > 0 && (
        <table>
          <caption>Wymagania innowacji a stan gminy</caption>
          <thead>
            <tr>
              <th scope="col">Wymaganie innowacji</th>
              <th scope="col">Wskaźnik</th>
              <th scope="col">Wartość</th>
              <th scope="col">Średnia regionu</th>
              <th scope="col">Rok</th>
            </tr>
          </thead>
          <tbody>
            {card.comparison.map((row) => (
              <tr key={`${row.indicatorName}-${row.requirement}`}>
                <td>{row.requirement}</td>
                <td>
                  {row.indicatorName}
                  {row.level === 'POWIAT' && ' (dane dla powiatu)'}
                </td>
                <td>{formatNumber(row.value, row.unit)}</td>
                <td>{formatNumber(row.regionAverage, row.unit)}</td>
                <td>{row.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <FitList title="Co zostaje bez zmian" items={card.unchanged} />
      <FitList title="Co trzeba dostosować" items={card.toAdapt} />
      <FitList title="Czego brakuje" items={card.missing} />

      <h4>Model usługi</h4>
      <p>Kto realizuje: {card.serviceProvider ?? 'nie określono'}</p>
      <p>Forma: {card.serviceForm ?? 'nie określono'}</p>
      {card.scaleEstimate && (
        <>
          <h4>Szacunek skali</h4>
          <p>{card.scaleEstimate}</p>
        </>
      )}
    </article>
  )
}

function FitList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  )
}
