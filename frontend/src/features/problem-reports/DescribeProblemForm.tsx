import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, Info, LoaderCircle, MapPin, Mic } from 'lucide-react'
import type { MunicipalityResponse } from '@/api/generated/castor'
import { ReportSteps } from '@/features/problem-reports/ReportSteps'
import { useMunicipalitySearch } from '@/hooks/use-municipality-search'
import { useSpeechInput } from '@/hooks/use-speech-input'
import { pluralPl } from '@/lib/format'

export const descriptionMinLength = 20
export const descriptionMaxLength = 3000

export interface DescribeProblemFormRequest {
  description: string
  municipalityTeryt: string | null
  submittedOnBehalf: boolean
  dictated: boolean
  keepOriginalDescription: boolean
}

/** Why the description cannot be sent yet, or nothing when it can. */
function descriptionProblem(description: string): string | undefined {
  const length = description.trim().length
  if (length === 0) {
    return `Napisz kilka słów o problemie, co najmniej ${descriptionMinLength} znaków.`
  }

  if (length < descriptionMinLength) {
    return `Opis jest za krótki: ma ${length} ${pluralPl(length, 'znak', 'znaki', 'znaków')}, potrzeba co najmniej ${descriptionMinLength}.`
  }

  return undefined
}

/**
 * Step 1 on the glass panel: the description with dictation and a counter on the left; the steps, an optional gmina,
 * the two consents and the action on the right.
 */
export function DescribeProblemForm({
  pending,
  initialDescription,
  onSubmit,
  failure,
}: {
  pending: boolean
  initialDescription: string
  onSubmit: (request: DescribeProblemFormRequest) => void
  /** Why the API refused the report, in words for the user. */
  failure: ReactNode
}) {
  const noteId = useId()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [description, setDescription] = useState(initialDescription)
  const [problem, setProblem] = useState<string>()
  const [municipality, setMunicipality] = useState<MunicipalityResponse | null>(null)
  const [submittedOnBehalf, setSubmittedOnBehalf] = useState(false)
  const [keepOriginalDescription, setKeepOriginalDescription] = useState(false)
  const [dictated, setDictated] = useState(false)
  const speech = useSpeechInput({
    onTranscript: (phrase) => {
      setDictated(true)
      setProblem(undefined)
      setDescription((current) => (current ? `${current} ${phrase}` : phrase))
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const foundProblem = descriptionProblem(description)
    if (foundProblem) {
      setProblem(foundProblem)
      textAreaRef.current?.focus()
      return
    }

    onSubmit({
      description,
      municipalityTeryt: municipality?.teryt ?? null,
      submittedOnBehalf,
      dictated,
      keepOriginalDescription,
    })
  }

  return (
    <form noValidate onSubmit={submit} className="dp-panel">
      <div className="dp-column">
        <div className="dp-field">
          <label htmlFor="opis-problemu" className="dp-field-label">
            Opisz, co się dzieje
          </label>
          <textarea
            id="opis-problemu"
            ref={textAreaRef}
            value={description}
            maxLength={descriptionMaxLength}
            placeholder="Np. seniorzy z naszej wsi nie mają jak dojechać do lekarza."
            aria-invalid={problem ? true : undefined}
            aria-describedby={noteId}
            onChange={(event) => {
              setDescription(event.target.value)
              setProblem(undefined)
            }}
          />
          <div className="dp-field-foot">
            {speech.supported && (
              <button type="button" className="dp-chip" aria-pressed={speech.listening} onClick={speech.toggle}>
                <Mic aria-hidden strokeWidth={1.75} />
                {speech.listening ? 'Zatrzymaj dyktowanie' : 'Dyktuj'}
              </button>
            )}
            <p className="dp-counter">
              {description.length} / {descriptionMaxLength}
            </p>
          </div>
        </div>

        <p id={noteId} className="dp-note">
          <Info aria-hidden strokeWidth={1.5} />
          <span>
            Nie podawaj imion, nazwisk, adresów ani telefonów - i tak je usuniemy.{' '}
            <br />
            Opis: od {descriptionMinLength} do {descriptionMaxLength} znaków. Możesz też go podyktować.
          </span>
        </p>
        {problem && (
          <p role="alert" className="dp-alert dp-note">
            {problem}
          </p>
        )}
      </div>

      <div className="dp-aside">
        <ReportSteps current={0} />

        <MunicipalityField selected={municipality} onSelect={setMunicipality} />

        <div className="dp-checks">
          <ConsentCheckbox
            label="Zgłaszam w czyimś imieniu"
            hint="Na przykład pomagasz sąsiadce albo podopiecznemu."
            checked={submittedOnBehalf}
            onChange={setSubmittedOnBehalf}
          />
          <ConsentCheckbox
            label="Zgadzam się na zapisanie oryginalnego opisu"
            hint="Zobaczy go tylko autor i pracownik ROPS."
            checked={keepOriginalDescription}
            onChange={setKeepOriginalDescription}
          />
        </div>

        <div className="dp-actions">
          <button type="submit" className="dp-submit" disabled={pending}>
            <span>{pending ? 'Szukam rozwiązań…' : 'Znajdź rozwiązania'}</span>
            <span className="dp-submit-icon" aria-hidden="true">
              {pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight strokeWidth={2} />}
            </span>
          </button>
          <p aria-live="polite" className="dp-sr">
            {pending && 'Szukam rozwiązań. To może potrwać kilka sekund.'}
          </p>
          {failure && (
            <p role="alert" className="dp-alert">
              {failure}
            </p>
          )}
        </div>
      </div>
    </form>
  )
}

/** Optional gmina: type part of the name, pick one of the matches listed under the field. */
function MunicipalityField({
  selected,
  onSelect,
}: {
  selected: MunicipalityResponse | null
  onSelect: (municipality: MunicipalityResponse | null) => void
}) {
  const titleId = useId()
  const hintId = useId()
  const [search, setSearch] = useState('')
  const { enabled, suggestions, municipalities } = useMunicipalitySearch(search)

  return (
    <div className="dp-group">
      <p id={titleId} className="dp-group-title">
        Gmina
      </p>
      <p id={hintId} className="dp-group-hint">
        Nieobowiązkowe. Pomoże ocenić, czy rozwiązanie zadziała u Ciebie.
      </p>

      {selected ? (
        <div className="dp-selected">
          <span>
            <span className="dp-sr">Wybrana gmina: </span>
            {selected.qualifiedName}
            {selected.powiat && <small>powiat {selected.powiat}</small>}
          </span>
          <button
            type="button"
            className="dp-chip"
            onClick={() => {
              onSelect(null)
              setSearch('')
            }}
          >
            Zmień<span className="dp-sr"> gminę</span>
          </button>
        </div>
      ) : (
        <div className="dp-select">
          <MapPin aria-hidden strokeWidth={1.75} />
          <input
            type="search"
            autoComplete="off"
            placeholder="Wpisz nazwę gminy"
            aria-labelledby={titleId}
            aria-describedby={hintId}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ChevronDown aria-hidden strokeWidth={1.75} />

          {enabled && (
            <ul className="dp-options" aria-label="Znalezione gminy" aria-live="polite">
              {suggestions.isPending && <li className="dp-options-empty">Szukam gmin…</li>}
              {suggestions.isSuccess && municipalities.length === 0 && (
                <li className="dp-options-empty">Nie znaleziono gminy o takiej nazwie.</li>
              )}
              {municipalities.map((municipality) => (
                <li key={municipality.teryt}>
                  <button type="button" onClick={() => onSelect(municipality)}>
                    {municipality.qualifiedName}
                    <small>powiat {municipality.powiat}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function ConsentCheckbox({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const hintId = useId()

  return (
    <div className="dp-check">
      <label>
        <span className="dp-check-box">
          <input
            type="checkbox"
            checked={checked}
            aria-describedby={hintId}
            onChange={(event) => onChange(event.target.checked)}
          />
          <Check aria-hidden strokeWidth={3} />
        </span>
        <span className="dp-check-label">{label}</span>
      </label>
      <p id={hintId} className="dp-check-hint">
        {hint}
      </p>
    </div>
  )
}
