import { useState, type FormEvent } from 'react'
import { SoftButton, TextAreaField } from '@/design-system'

export type Verdict = 'NO' | 'YES' | 'ALMOST'

/** The largest note the API takes (ProblemReport.VerdictNoteMaxLength). */
const noteMaxLength = 500

interface VerdictChoiceProps {
  /** What the reporter already said; null until they decide. */
  current: string | null
  /** The label of "yes": "To moja sprawa" under a similar report, "To mi pomogło" under an innovation. */
  yesLabel: string
  /** What the choice is about, for screen readers - e.g. the innovation's title. */
  subject: string
  pending: boolean
  error: string | null
  onDecide: (verdict: Verdict, note: string | null) => void
}

/**
 * "Czy to spełnia Twoją potrzebę?" - one decision under every result (docs/features.md §1): no, yes, or almost, which
 * asks what is missing before it is sent.
 */
export function VerdictChoice({ current, yesLabel, subject, pending, error, onDecide }: VerdictChoiceProps) {
  const [writingNote, setWritingNote] = useState(false)
  const [note, setNote] = useState('')

  function sendAlmost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = note.trim()
    if (trimmed) {
      onDecide('ALMOST', trimmed)
    }
  }

  return (
    <div className="grid gap-3">
      <fieldset>
        <legend className="mb-3 text-label font-medium text-text-muted">
          Czy to spełnia Twoją potrzebę?<span className="sr-only"> - {subject}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          <SoftButton
            type="button"
            aria-pressed={current === 'NO'}
            disabled={pending}
            onClick={() => {
              setWritingNote(false)
              onDecide('NO', null)
            }}
          >
            To nie to
          </SoftButton>
          <SoftButton
            type="button"
            aria-pressed={current === 'YES'}
            disabled={pending}
            onClick={() => {
              setWritingNote(false)
              onDecide('YES', null)
            }}
          >
            {yesLabel}
          </SoftButton>
          <SoftButton
            type="button"
            aria-pressed={current === 'ALMOST' || writingNote}
            aria-expanded={writingNote}
            disabled={pending}
            onClick={() => setWritingNote(true)}
          >
            Prawie - brakuje mi…
          </SoftButton>
        </div>
      </fieldset>

      {writingNote && (
        <form className="grid max-w-default justify-items-start gap-3" onSubmit={sendAlmost}>
          <TextAreaField
            label="Czego brakuje albo czym Twoja sprawa się różni?"
            rows={3}
            maxLength={noteMaxLength}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            required
            fieldClassName="w-full"
          />
          <SoftButton type="submit" variant="primary" loading={pending}>
            Zapisz
          </SoftButton>
        </form>
      )}

      <div aria-live="polite">
        {error && (
          <p role="alert" className="text-body-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
