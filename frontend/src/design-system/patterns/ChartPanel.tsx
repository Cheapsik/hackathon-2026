import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { cn } from '@/lib/utils'
import { EmptyState } from '../primitives/EmptyState'
import { GlassPanel } from '../primitives/GlassPanel'

export type ChartPoint = { label: string; value: number }

export type ChartPanelProps = {
  title: ReactNode
  description?: ReactNode
  /** Name of the measured value — the table header and the tooltip, e.g. "Liczba zgłoszeń". */
  seriesLabel: string
  /** Header of the first table column, e.g. "Miesiąc". */
  categoryLabel: string
  data: ChartPoint[]
  formatValue?: (value: number) => string
  /** Heading level of the title, following the page's outline. */
  titleAs?: 'h2' | 'h3'
  className?: string
}

const numberFormat = new Intl.NumberFormat('pl-PL')
const chartHeight = 200
const padding = { top: 16, right: 56, bottom: 32, left: 48 }

/**
 * One series over time: a thin graphite line, hairline grid, the last value labelled at the line's end.
 * Pointer and keyboard (arrow keys) move a crosshair with a tooltip. The same numbers are always in the table
 * below — the chart never gates data (SPEC §8).
 */
export function ChartPanel({
  title,
  description,
  seriesLabel,
  categoryLabel,
  data,
  formatValue = (value) => numberFormat.format(value),
  titleAs: Title = 'h2',
  className,
}: ChartPanelProps) {
  const titleId = useId()
  const frameRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(frameRef)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const values = data.map((point) => point.value)
  const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values))
  const yMin = ticks[0] ?? 0
  const yMax = ticks[ticks.length - 1] ?? 1
  const plotWidth = Math.max(width - padding.left - padding.right, 1)
  const plotHeight = chartHeight - padding.top - padding.bottom
  const x = (index: number) =>
    padding.left + (data.length > 1 ? (index * plotWidth) / (data.length - 1) : plotWidth / 2)
  const y = (value: number) => padding.top + plotHeight - ((value - yMin) / (yMax - yMin || 1)) * plotHeight

  const path = data.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(point.value)}`).join(' ')
  const last = data.length - 1
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotWidth / 72))))
  const active = activeIndex === null ? null : data[activeIndex]

  function indexAt(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const step = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth
    return clamp(Math.round((event.clientX - box.left - padding.left) / step), 0, last)
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
    if (event.key in moves) {
      event.preventDefault()
      setActiveIndex((current) => clamp((current ?? last) + moves[event.key], 0, last))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : last)
    }
  }

  return (
    <GlassPanel aria-labelledby={titleId} className={cn('grid gap-4', className)}>
      <div className="grid gap-1">
        <Title id={titleId} className="text-section-title font-medium">
          {title}
        </Title>
        {description && <p className="text-body-sm text-text-muted">{description}</p>}
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Brak danych do wykresu"
          description="Gdy pojawią się dane, zobaczysz je tutaj."
          titleAs={Title === 'h2' ? 'h3' : 'h4'}
        />
      ) : (
        <>
          <div ref={frameRef} className="relative">
            {width > 0 && (
              // A keyboard-explorable chart behaves like a slider over the data points: arrows move the
              // crosshair and the reader hears "label: value". All values are also in the table below.
              <svg
                width={width}
                height={chartHeight}
                // The SVG is the visual; a range input could not draw it. ARIA slider semantics are complete below.
                // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="slider"
                aria-label={`Wykres: ${seriesLabel}`}
                aria-orientation="horizontal"
                aria-valuemin={0}
                aria-valuemax={last}
                aria-valuenow={activeIndex ?? last}
                aria-valuetext={`${data[activeIndex ?? last].label}: ${formatValue(data[activeIndex ?? last].value)}`}
                tabIndex={0}
                className="block touch-pan-y rounded-control"
                onPointerMove={(event) => setActiveIndex(indexAt(event))}
                onPointerLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex((current) => current ?? last)}
                onBlur={() => setActiveIndex(null)}
                onKeyDown={handleKeyDown}
              >
                {ticks.map((tick) => (
                  <g key={tick}>
                    <line
                      x1={padding.left}
                      x2={width - padding.right}
                      y1={y(tick)}
                      y2={y(tick)}
                      className="stroke-border-subtle"
                      strokeWidth={1}
                    />
                    <text
                      x={padding.left - 8}
                      y={y(tick)}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-text-muted text-label tabular"
                    >
                      {formatValue(tick)}
                    </text>
                  </g>
                ))}

                {data.map((point, index) =>
                  index % labelEvery === 0 || index === last ? (
                    <text
                      key={point.label}
                      x={x(index)}
                      y={chartHeight - 8}
                      textAnchor={index === 0 ? 'start' : index === last ? 'end' : 'middle'}
                      className="fill-text-muted text-label"
                    >
                      {point.label}
                    </text>
                  ) : null,
                )}

                {active && activeIndex !== null && (
                  <line
                    x1={x(activeIndex)}
                    x2={x(activeIndex)}
                    y1={padding.top}
                    y2={padding.top + plotHeight}
                    className="stroke-text-faint"
                    strokeWidth={1}
                  />
                )}

                <path
                  d={path}
                  fill="none"
                  className="stroke-surface-active"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                <circle
                  cx={x(activeIndex ?? last)}
                  cy={y(data[activeIndex ?? last].value)}
                  r={4}
                  className="fill-surface-active stroke-surface-solid"
                  strokeWidth={2}
                />

                <text
                  x={x(last) + 10}
                  y={y(data[last].value)}
                  dominantBaseline="middle"
                  className="fill-text-primary text-label font-medium tabular"
                >
                  {formatValue(data[last].value)}
                </text>
              </svg>
            )}

            {active && activeIndex !== null && (
              <div
                aria-hidden
                style={{ left: clamp(x(activeIndex), 72, width - 72), top: 0 }}
                className="pointer-events-none absolute grid -translate-x-1/2 gap-1 rounded-control px-3 py-2 text-center surface-floating"
              >
                <span className="font-medium tabular text-body-sm">{formatValue(active.value)}</span>
                <span className="text-label text-text-muted">{active.label}</span>
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-auto rounded-card surface-ceramic">
            <table className="w-full text-left text-body-sm">
              <caption className="sr-only">{`${seriesLabel} - dane z wykresu`}</caption>
              <thead className="sticky top-0 bg-surface-ceramic text-label text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    {categoryLabel}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    {seriesLabel}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.map((point, index) => (
                  <tr key={point.label} className={cn(index === activeIndex && 'bg-surface-glass-strong')}>
                    <th scope="row" className="px-4 py-2 font-normal">
                      {point.label}
                    </th>
                    <td className="px-4 py-2 text-right tabular">{formatValue(point.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </GlassPanel>
  )
}

function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return width
}

/** 3–5 round tick values (1, 2, 2.5, 5 × 10ⁿ) covering [min, max]. */
function niceTicks(min: number, max: number): number[] {
  const range = max - min || Math.abs(max) || 1
  const rough = range / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= rough) ?? 10) * magnitude
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Number(value.toFixed(10)))
  }
  return ticks
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
