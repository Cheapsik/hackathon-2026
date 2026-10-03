import { useId, type ReactNode, type Ref } from 'react'
import { CircleAlert, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SoftButton } from '../primitives/SoftButton'
import { Tooltip } from '../primitives/Tooltip'

export type PromptCardVoice = {
  /** False where the browser has no speech recognition; the button stays, with an explanation. */
  supported: boolean
  listening: boolean
  onToggle: () => void
  /** Why dictation failed. Announced politely, under the field. */
  message?: string
}

export type PromptCardProps = {
  /** Names the field; stays visible inside it. */
  label: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  /** Text of the one main action; the button submits the surrounding <form>. */
  submitLabel: string
  /** Validation message; announced at once and tied to the field. */
  error?: string
  /** Quiet line under the field. */
  hint?: ReactNode
  voice?: PromptCardVoice
  textAreaRef?: Ref<HTMLTextAreaElement>
  className?: string
}

/**
 * The page's main input: one opaque surface with the label, a text area and two actions — dictation (secondary)
 * and the single dark-green action. The surface edge is drawn at 3:1, so the field is recognisable without
 * relying on the fill. Must be placed inside a <form>.
 */
export function PromptCard({
  label,
  value,
  onValueChange,
  placeholder,
  submitLabel,
  error,
  hint,
  voice,
  textAreaRef,
  className,
}: PromptCardProps) {
  const id = useId()
  const errorId = `${id}-error`
  const statusId = `${id}-status`
  const dictationHint = voice?.supported ? 'Dyktuj opis (działa w Chrome i Edge)' : 'Dyktowanie działa tylko w Chrome i Edge'

  return (
    <div className={cn('grid gap-3', className)}>
      <div
        className={cn(
          '@container rounded-panel p-5 surface-ceramic sm:p-6',
          error ? 'surface-invalid' : 'surface-field',
          // The ring wraps the whole field: the textarea itself has no outline of its own.
          'has-[textarea:focus]:outline-solid has-[textarea:focus]:outline-(length:--focus-ring-width) has-[textarea:focus]:outline-focus has-[textarea:focus]:outline-offset-3',
        )}
      >
        <label htmlFor={id} className="text-label font-medium text-text-muted">
          {label}
        </label>

        <textarea
          ref={textAreaRef}
          id={id}
          value={value}
          rows={3}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errorId : undefined, voice ? statusId : undefined].filter(Boolean).join(' ') || undefined}
          onChange={(event) => onValueChange(event.target.value)}
          className="mt-2 block max-h-72 min-h-24 w-full resize-none border-0 bg-transparent p-0 text-body text-text-primary shadow-none field-sizing-content outline-none placeholder:text-text-faint"
        />

        {/* Container query in rem: when the field is too narrow for both buttons (phone, large text), the main one takes its own row. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {voice ? (
            <Tooltip content={dictationHint}>
              <SoftButton
                variant="secondary"
                icon={<Mic aria-hidden />}
                aria-label={voice.listening ? 'Zatrzymaj dyktowanie' : voice.supported ? 'Dyktuj opis' : 'Dyktuj opis (tylko Chrome i Edge)'}
                aria-pressed={voice.listening}
                aria-disabled={voice.supported ? undefined : true}
                onClick={voice.supported ? voice.onToggle : undefined}
              >
                {voice.listening ? 'Zatrzymaj' : 'Dyktuj'}
              </SoftButton>
            </Tooltip>
          ) : (
            <span />
          )}
          <SoftButton type="submit" variant="primary" size="lg" className="@max-[20rem]:w-full">
            {submitLabel}
          </SoftButton>
        </div>
      </div>

      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-2 text-body-sm font-medium text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-icon shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {voice && (
        <p id={statusId} aria-live="polite" className="text-label text-text-muted empty:hidden">
          {voice.message ?? (voice.listening ? 'Słucham. Mów, a tekst pojawi się w polu.' : '')}
        </p>
      )}

      {hint && <p className="text-label text-text-muted">{hint}</p>}
    </div>
  )
}
