import { useId, useState, type FormEvent } from 'react'
import {
  useGetApiChallengeAreas,
  useGetApiIdeasCanvas,
  type CanvasOptionResponse,
  type CanvasScaleLevelResponse,
} from '@/api/generated/castor'
import type { IdeaCanvasValues } from '@/features/ideas/canvas-values'

interface IdeaCanvasFormProps {
  initial: IdeaCanvasValues
  submitLabel: string
  pending: boolean
  onSubmit: (values: IdeaCanvasValues) => void
  onCancel?: () => void
}

/**
 * The Canvas of innovation (Szkółka innowacji, v1.0) as a form. Only the title is needed to save a draft; the rest
 * is checked when the idea is submitted, so the author can fill it in over several visits.
 */
export function IdeaCanvasForm({ initial, submitLabel, pending, onSubmit, onCancel }: IdeaCanvasFormProps) {
  const [values, setValues] = useState(initial)
  const canvas = useGetApiIdeasCanvas()
  const areas = useGetApiChallengeAreas()
  const titleId = useId()
  const options = canvas.data?.data

  function set<K extends keyof IdeaCanvasValues>(key: K, value: IdeaCanvasValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(values)
  }

  if (canvas.isPending || areas.isPending) {
    return (
      <p>
        <output>Wczytuję Canvas…</output>
      </p>
    )
  }

  if (!options) {
    return <p role="alert">Nie udało się wczytać Canvasu. Odśwież stronę.</p>
  }

  const maxValues = Number(options.maxValues)
  const maxAreas = Number(options.maxChallengeAreas)

  return (
    <form onSubmit={submit}>
      <p>
        <label htmlFor={titleId}>Nazwa pomysłu (wymagana)</label>
        <br />
        <input id={titleId} size={70} maxLength={200} required value={values.title} onChange={(event) => set('title', event.target.value)} />
      </p>

      <ChoiceGroup
        legend={`Obszar wyzwań (wybierz od 1 do ${maxAreas})`}
        options={(areas.data?.data ?? []).map((area) => ({ code: area.code, label: area.name, hint: null }))}
        selected={values.challengeAreaCodes}
        limit={maxAreas}
        onChange={(selected) => set('challengeAreaCodes', selected)}
      />

      <fieldset>
        <legend>1. Problem</legend>
        <ScaleGroup legend="Natężenie problemu" levels={options.intensity} value={values.problemIntensity} onChange={(level) => set('problemIntensity', level)} />
        <ScaleGroup legend="Częstotliwość problemu" levels={options.frequency} value={values.problemFrequency} onChange={(level) => set('problemFrequency', level)} />
        <ScaleGroup legend="Skala problemu" levels={options.scale} value={values.problemScale} onChange={(level) => set('problemScale', level)} />
      </fieldset>

      <ChoiceGroup legend="2. Odbiorcy" options={options.recipients} selected={values.recipients} onChange={(selected) => set('recipients', selected)} />
      <p>
        <label>
          Inni odbiorcy (jeśli nie ma ich na liście)
          <br />
          <input size={70} maxLength={300} value={values.otherRecipients} onChange={(event) => set('otherRecipients', event.target.value)} />
        </label>
      </p>

      <p>
        <label>
          3. Rozwiązanie: na czym polega Twój pomysł?
          <br />
          <textarea rows={6} cols={70} maxLength={4000} value={values.solution} onChange={(event) => set('solution', event.target.value)} />
        </label>
      </p>

      <fieldset>
        <legend>4. Etap rozwoju</legend>
        {options.stages.map((stage) => (
          <label key={stage.code}>
            <input type="radio" name="stage" value={stage.code} checked={values.stage === stage.code} onChange={() => set('stage', stage.code)} />{' '}
            {stage.label}
            {stage.hint && ` - ${stage.hint}`}
            <br />
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>5. Aktorzy</legend>
        <p>
          <label>
            Kto pomoże (sojusznicy)?
            <br />
            <textarea rows={3} cols={70} maxLength={2000} value={values.supporters} onChange={(event) => set('supporters', event.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Kto może przeszkadzać (przeciwnicy)?
            <br />
            <textarea rows={3} cols={70} maxLength={2000} value={values.opponents} onChange={(event) => set('opponents', event.target.value)} />
          </label>
        </p>
      </fieldset>

      <ChoiceGroup
        legend={`6. Wartości emocjonalne (najwyżej ${maxValues})`}
        options={options.emotionalValues}
        selected={values.emotionalValues}
        limit={maxValues}
        onChange={(selected) => set('emotionalValues', selected)}
      />
      <ChoiceGroup
        legend={`7. Wartości funkcjonalne (najwyżej ${maxValues})`}
        options={options.functionalValues}
        selected={values.functionalValues}
        limit={maxValues}
        onChange={(selected) => set('functionalValues', selected)}
      />

      <p>
        <label>
          Czym Twój pomysł różni się od podobnych? (opcjonalnie)
          <br />
          <textarea rows={3} cols={70} maxLength={2000} value={values.differenceNote} onChange={(event) => set('differenceNote', event.target.value)} />
        </label>
      </p>

      <button type="submit" disabled={pending}>
        {submitLabel}
      </button>
      {onCancel && (
        <>
          {' '}
          <button type="button" onClick={onCancel}>
            Anuluj
          </button>
        </>
      )}
    </form>
  )
}

function ScaleGroup({
  legend,
  levels,
  value,
  onChange,
}: {
  legend: string
  levels: CanvasScaleLevelResponse[]
  value: number | null
  onChange: (level: number) => void
}) {
  const name = useId()

  return (
    <fieldset>
      <legend>{legend}</legend>
      {levels.map((level) => (
        <label key={level.level}>
          <input type="radio" name={name} checked={value === Number(level.level)} onChange={() => onChange(Number(level.level))} />{' '}
          {level.level}. {level.label} - {level.hint}
          <br />
        </label>
      ))}
    </fieldset>
  )
}

function ChoiceGroup({
  legend,
  options,
  selected,
  limit,
  onChange,
}: {
  legend: string
  options: CanvasOptionResponse[]
  selected: string[]
  limit?: number
  onChange: (selected: string[]) => void
}) {
  const full = limit !== undefined && selected.length >= limit

  return (
    <fieldset>
      <legend>{legend}</legend>
      {options.map((option) => {
        const checked = selected.includes(option.code)
        return (
          <label key={option.code}>
            <input
              type="checkbox"
              checked={checked}
              disabled={!checked && full}
              onChange={(event) => onChange(event.target.checked ? [...selected, option.code] : selected.filter((code) => code !== option.code))}
            />{' '}
            {option.label}
            {option.hint && ` - ${option.hint}`}
            <br />
          </label>
        )
      })}
      {full && <p>Wybrano najwięcej, ile można. Odznacz coś, aby wybrać inną pozycję.</p>}
    </fieldset>
  )
}
