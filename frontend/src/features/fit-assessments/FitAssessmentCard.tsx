import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, SlidersHorizontal } from 'lucide-react'
import type { FitAssessmentResponse, FitComparisonRowResponse } from '@/api/generated/castor'
import { Badge, CeramicCard } from '@/design-system'
import { GminaMap } from '@/features/atlas/GminaMap'

const fitLabels: Record<string, string> = {
  HIGH: 'wysokie',
  MEDIUM: 'średnie',
  LOW: 'niskie',
}

const fitTones = { HIGH: 'success', MEDIUM: 'warning', LOW: 'danger' } as const

const numberFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })

function formatNumber(value: number | string, unit: string | null): string {
  const formatted = numberFormat.format(Number(value))
  return unit ? `${formatted} ${unit}` : formatted
}

/** The card itself (SPEC 6.5): the assessment, "requirement vs the gmina" as a table, the service model and scale. */
export function FitAssessmentCard({ card }: { card: FitAssessmentResponse }) {
  const tone = fitTones[card.fit as keyof typeof fitTones] ?? 'neutral'
  const highlighted = new Map([[card.municipality.teryt, 1]])

  return (
    <article aria-labelledby={`fit-${card.id}`} className="grid gap-4">
      <CeramicCard padding="lg" className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-eyebrow font-medium text-text-muted uppercase">Karta dopasowania</p>
          <h3 id={`fit-${card.id}`} className="font-display text-section-title tracking-display">
            {card.innovationTitle} - {card.municipality.name}
          </h3>
        </div>
        <p>
          <Badge tone={tone} className="text-body-sm">
            Dopasowanie: {fitLabels[card.fit] ?? card.fit}
          </Badge>
        </p>
        <p className="max-w-default text-lead">{card.summary}</p>
        <p className="text-body-sm text-text-muted">
          Dane: Internetowy Obserwator Statystyk Społecznych, rok {card.dataYear}. Powiat {card.municipality.powiat}.
        </p>
      </CeramicCard>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        <CeramicCard padding="md" className="overflow-hidden">
          <GminaMap
            values={highlighted}
            highlightTeryt={card.municipality.teryt}
            label={`Gmina ${card.municipality.name} na mapie Małopolski.`}
          />
        </CeramicCard>
        <div className="grid content-start gap-4">
          <FitList
            title="Co zostaje bez zmian"
            items={card.unchanged}
            icon={<CircleCheck aria-hidden className="size-icon text-success" />}
          />
          <FitList
            title="Co trzeba dostosować"
            items={card.toAdapt}
            icon={<SlidersHorizontal aria-hidden className="size-icon text-warning" />}
          />
          <FitList
            title="Czego brakuje"
            items={card.missing}
            icon={<CircleAlert aria-hidden className="size-icon text-danger" />}
          />
        </div>
      </div>

      {card.comparison.length > 0 && <ComparisonTable rows={card.comparison} />}

      <div className="grid gap-4 md:grid-cols-2">
        <CeramicCard padding="lg" className="grid content-start gap-3">
          <h4 className="text-body font-medium">Model usługi</h4>
          <dl className="grid gap-2 text-body-sm">
            <div className="grid gap-0.5">
              <dt className="text-text-muted">Kto realizuje</dt>
              <dd>{card.serviceProvider ?? 'nie określono'}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-text-muted">Forma</dt>
              <dd>{card.serviceForm ?? 'nie określono'}</dd>
            </div>
          </dl>
        </CeramicCard>
        {card.scaleEstimate && (
          <CeramicCard padding="lg" className="grid content-start gap-3">
            <h4 className="text-body font-medium">Szacunek skali</h4>
            <p className="text-body-sm">{card.scaleEstimate}</p>
          </CeramicCard>
        )}
      </div>
    </article>
  )
}

function FitList({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
  if (items.length === 0) {
    return null
  }

  return (
    <CeramicCard padding="md" className="grid gap-2">
      <h4 className="flex items-center gap-2 text-body font-medium">
        {icon}
        {title}
      </h4>
      <ul className="grid gap-1.5 text-body-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </CeramicCard>
  )
}

/** Gmina (dark) against the region average (light), as shares of the larger one. */
function ComparisonBars({ value, average }: { value: number; average: number }) {
  return (
    <span aria-hidden className="mt-1.5 grid gap-1">
      <span className="h-1.5 rounded-full bg-surface-active" style={{ width: `${value * 100}%` }} />
      <span className="h-1.5 rounded-full bg-border-strong" style={{ width: `${average * 100}%` }} />
    </span>
  )
}

/**
 * Requirement against the gmina's indicator. The bars only repeat the numbers in the same row (gmina against the
 * region average), so they are hidden from screen readers.
 */
function ComparisonTable({ rows }: { rows: FitComparisonRowResponse[] }) {
  return (
    <CeramicCard padding="none" className="overflow-x-auto p-1">
      <table className="w-full min-w-[40rem] text-left text-body-sm">
        <caption className="px-3 pt-3 pb-1 text-left text-body font-medium">Wymagania innowacji a stan gminy</caption>
        <thead className="text-label text-text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Wymaganie innowacji</th>
            <th scope="col" className="px-3 py-2 font-medium">Wskaźnik</th>
            <th scope="col" className="px-3 py-2 font-medium">Gmina a średnia regionu</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Rok</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map((row) => {
            const value = Number(row.value)
            const average = Number(row.regionAverage)
            const scale = Math.max(Math.abs(value), Math.abs(average)) || 1
            return (
              <tr key={`${row.indicatorName}-${row.requirement}`} className="align-top">
                <td className="px-3 py-3">{row.requirement}</td>
                <td className="px-3 py-3">
                  {row.indicatorName}
                  {row.level === 'POWIAT' && <span className="text-text-muted"> (dane dla powiatu)</span>}
                </td>
                <td className="min-w-44 px-3 py-3 tabular">
                  <span className="font-medium whitespace-nowrap">{formatNumber(row.value, row.unit)}</span>{' '}
                  <span className="whitespace-nowrap text-text-muted">wobec {formatNumber(row.regionAverage, row.unit)}</span>
                  <ComparisonBars value={Math.abs(value) / scale} average={Math.abs(average) / scale} />
                </td>
                <td className="px-3 py-3 text-right tabular">{row.year}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </CeramicCard>
  )
}
