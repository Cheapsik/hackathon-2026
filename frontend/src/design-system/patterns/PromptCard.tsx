import { useId, useState, type ReactNode, type Ref } from 'react'
import { CircleAlert, Mic, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SoftButton } from '../primitives/SoftButton'

export type PromptCardVoice = {
  /** False where the browser has no speech recognition; the button stays and says what to do instead. */
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
  /**
   * Text of the main action inside the field; the button submits the surrounding <form>. Leave it out when the
   * form has its action after further fields.
   */
  submitLabel?: string
  /** Caps the text and shows "n / max" in the field's footer. */
  maxLength?: number
  /** `lg`: the main input of a page - taller, with the larger text of the home page field. */
  size?: 'md' | 'lg'
  /** Validation message; announced at once and tied to the field. */
  error?: string
  /** Quiet line under the field, tied to it. */
  hint?: ReactNode
  voice?: PromptCardVoice
  textAreaRef?: Ref<HTMLTextAreaElement>
  className?: string
}

const unsupportedVoiceNote = 'Dyktowanie działa w Chrome i Edge. W tej przeglądarce wpisz opis w polu.'

/**
 * The page's main input, the home page field on a light page: one white surface with the label, a large text area,
 * dictation and an optional main action. The surface edge is drawn at 3:1, so the field is recognisable without
 * relying on the fill, and the focus ring wraps the whole surface. Must be placed inside a <form>.
 */
export function PromptCard({
  label,
  value,
  onValueChange,
  placeholder,
  submitLabel,
  maxLength,
  size = 'md',
  error,
  hint,
  voice,
  textAreaRef,
  className,
}: PromptCardProps) {
  const id = useId()
  const errorId = `${id}-error`
  const statusId = `${id}-status`
  const hintId = `${id}-hint`
  const [unsupportedPressed, setUnsupportedPressed] = useState(false)
  const nearLimit = maxLength !== undefined && value.length >= maxLength * 0.9
  const voiceStatus =
    voice &&
    (voice.message ??
      (voice.listening ? 'Słucham. Mów po polsku, tekst pojawi się w polu.' : undefined) ??
      (unsupportedPressed ? unsupportedVoiceNote : undefined))

  return (
    <div className={cn('grid gap-3', className)}>
      <div
        className={cn(
          '@container grid rounded-panel surface-ceramic',
          size === 'lg' ? 'gap-3 p-5 sm:px-7 sm:pt-6 sm:pb-5' : 'gap-2 p-5 sm:p-6',
          error ? 'surface-invalid' : 'surface-field',
          // The ring wraps the whole field: the textarea itself has no outline of its own.
          'has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-(length:--focus-ring-width) has-[textarea:focus-visible]:outline-focus has-[textarea:focus-visible]:outline-offset-3',
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
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errorId : undefined, hint ? hintId : undefined, voice ? statusId : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
          onChange={(event) => onValueChange(event.target.value)}
          className={cn(
            'block w-full resize-none border-0 bg-transparent p-0 text-text-primary shadow-none field-sizing-content outline-none placeholder:text-text-faint',
            size === 'lg' ? 'max-h-96 min-h-40 text-lead' : 'max-h-72 min-h-24 text-body',
          )}
        />

        {(voice || maxLength !== undefined || submitLabel) && (
          // Container query in rem: when the field is too narrow for everything (phone, large text), the main action takes its own row.
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {voice && (
              <SoftButton
                variant={voice.listening ? 'primary' : 'secondary'}
                icon={voice.listening ? <Square aria-hidden className="fill-current" /> : <Mic aria-hidden />}
                aria-pressed={voice.supported ? voice.listening : undefined}
                className={cn(voice.listening && 'bg-brick not-disabled:hover:bg-brick')}
                onClick={voice.supported ? voice.onToggle : () => setUnsupportedPressed(true)}
              >
                {voice.listening ? 'Zatrzymaj dyktowanie' : 'Dyktuj'}
              </SoftButton>
            )}

            {maxLength !== undefined && (
              <p className={cn('ml-auto text-label tabular', nearLimit ? 'font-medium text-warning' : 'text-text-muted')}>
                <span className="sr-only">Wpisano znaków: </span>
                {value.length} / {maxLength}
              </p>
            )}

            {submitLabel && (
              <SoftButton
                type="submit"
                variant="primary"
                size="lg"
                forward
                className={cn(maxLength === undefined && 'ml-auto', '@max-[24rem]:w-full')}
              >
                {submitLabel}
              </SoftButton>
            )}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-2 text-body-sm font-medium text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-icon shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {voice && (
        <p id={statusId} aria-live="polite" className="text-label text-text-muted empty:hidden">
          {voiceStatus}
        </p>
      )}

      {hint && (
        <p id={hintId} className="text-label text-text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
