import { useGetApiIdeasCanvas, type CanvasOptionResponse, type CanvasScaleLevelResponse, type IdeaResponse } from '@/api/generated/castor'

/** The Canvas of a saved idea, read-only, with the labels the form showed. */
export function IdeaCardView({ idea }: { idea: IdeaResponse }) {
  const canvas = useGetApiIdeasCanvas()
  const options = canvas.data?.data

  if (!options) {
    return (
      <p>
        <output>Wczytuję Canvas…</output>
      </p>
    )
  }

  const recipients = [...labelsOf(options.recipients, idea.recipients), ...(idea.otherRecipients ? [idea.otherRecipients] : [])]

  return (
    <dl>
      <dt>Obszar wyzwań</dt>
      <dd>{idea.challengeAreas.length > 0 ? idea.challengeAreas.map((area) => area.name).join(', ') : 'nie wybrano'}</dd>
      <dt>Natężenie problemu</dt>
      <dd>{levelLabel(options.intensity, idea.problemIntensity)}</dd>
      <dt>Częstotliwość problemu</dt>
      <dd>{levelLabel(options.frequency, idea.problemFrequency)}</dd>
      <dt>Skala problemu</dt>
      <dd>{levelLabel(options.scale, idea.problemScale)}</dd>
      <dt>Odbiorcy</dt>
      <dd>{recipients.length > 0 ? recipients.join(', ') : 'nie wybrano'}</dd>
      <dt>Rozwiązanie</dt>
      <dd>{idea.solution ?? 'jeszcze nie opisano'}</dd>
      <dt>Etap rozwoju</dt>
      <dd>{labelsOf(options.stages, [idea.stage]).join('') || idea.stage}</dd>
      <dt>Sojusznicy</dt>
      <dd>{idea.supporters ?? '—'}</dd>
      <dt>Przeciwnicy</dt>
      <dd>{idea.opponents ?? '—'}</dd>
      <dt>Wartości emocjonalne</dt>
      <dd>{labelsOf(options.emotionalValues, idea.emotionalValues).join(', ') || '—'}</dd>
      <dt>Wartości funkcjonalne</dt>
      <dd>{labelsOf(options.functionalValues, idea.functionalValues).join(', ') || '—'}</dd>
      {idea.differenceNote && (
        <>
          <dt>Czym różni się od podobnych</dt>
          <dd>{idea.differenceNote}</dd>
        </>
      )}
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
