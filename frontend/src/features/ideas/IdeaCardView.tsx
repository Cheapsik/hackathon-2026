import { useGetApiIdeasCanvas, type CanvasOptionResponse, type CanvasScaleLevelResponse, type IdeaResponse } from '@/api/generated/castor'
import { LoadingState } from '@/design-system'

/** The Canvas of a saved idea, read-only, with the labels the form showed. */
export function IdeaCardView({ idea }: { idea: IdeaResponse }) {
  const canvas = useGetApiIdeasCanvas()
  const options = canvas.data?.data

  if (!options) {
    return <LoadingState label="Wczytuję Canvas…" />
  }

  const recipients = [...labelsOf(options.recipients, idea.recipients), ...(idea.otherRecipients ? [idea.otherRecipients] : [])]

  const rows = [
    {
      label: 'Obszar wyzwań',
      value: idea.challengeAreas.length > 0 ? idea.challengeAreas.map((area) => area.name).join(', ') : 'nie wybrano',
    },
    { label: 'Natężenie problemu', value: levelLabel(options.intensity, idea.problemIntensity) },
    { label: 'Częstotliwość problemu', value: levelLabel(options.frequency, idea.problemFrequency) },
    { label: 'Skala problemu', value: levelLabel(options.scale, idea.problemScale) },
    { label: 'Odbiorcy', value: recipients.length > 0 ? recipients.join(', ') : 'nie wybrano' },
    { label: 'Rozwiązanie', value: idea.solution ?? 'jeszcze nie opisano' },
    { label: 'Etap rozwoju', value: labelsOf(options.stages, [idea.stage]).join('') || idea.stage },
    { label: 'Sojusznicy', value: idea.supporters ?? '-' },
    { label: 'Przeciwnicy', value: idea.opponents ?? '-' },
    {
      label: 'Wartości emocjonalne',
      value: labelsOf(options.emotionalValues, idea.emotionalValues).join(', ') || '-',
    },
    {
      label: 'Wartości funkcjonalne',
      value: labelsOf(options.functionalValues, idea.functionalValues).join(', ') || '-',
    },
    ...(idea.differenceNote
      ? [{ label: 'Czym różni się od podobnych', value: idea.differenceNote }]
      : []),
  ]

  return (
    <dl className="grid gap-3">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
          <dt className="text-label font-medium text-text-muted">{row.label}</dt>
          <dd className="text-body text-text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function labelsOf(options: CanvasOptionResponse[], codes: string[]): string[] {
  return codes.map((code) => options.find((option) => option.code === code)?.label ?? code)
}

function levelLabel(levels: CanvasScaleLevelResponse[], value: number | string | null): string {
  if (value === null) {
    return 'nie wybrano'
  }

  const level = levels.find((candidate) => Number(candidate.level) === Number(value))
  return level ? `${level.level}. ${level.label}` : String(value)
}
