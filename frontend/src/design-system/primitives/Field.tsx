import { forwardRef, useId, type ComponentProps, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlClassName } from './control-styles'

/** Props a Field hands to its control so label, hint and error are wired for assistive technology. */
export type FieldControlProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  required?: boolean
}

export type FieldProps = {
  label: ReactNode
  /** Visually hide the label (it stays for screen readers) — only when the context names the field already. */
  hideLabel?: boolean
  hint?: ReactNode
  /** Inline validation message. Important errors always live here, never only in a toast. */
  error?: ReactNode
  required?: boolean
  /** Extra content on the label row, e.g. a balance or a "Max" action. */
  labelAside?: ReactNode
  /** `lead`: the label is the content itself, e.g. a question the person answers. */
  labelSize?: 'default' | 'lead'
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

/** Label + control + hint + error with ids wired up. Every form control in the app goes through it. */
export function Field({
  label,
  hideLabel,
  hint,
  error,
  required,
  labelAside,
  labelSize = 'default',
  className,
  children,
}: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('grid gap-2', className)}>
      <div className={cn('flex items-baseline justify-between gap-3', hideLabel && !labelAside && 'sr-only')}>
        <label
          htmlFor={id}
          className={cn(
            'font-medium text-text-primary',
            labelSize === 'lead' ? 'text-lead text-balance' : 'text-label',
            hideLabel && 'sr-only',
          )}
        >
          {label}
          {required && (
            <span className="text-text-muted">
              <span aria-hidden> *</span>
              <span className="sr-only"> (wymagane)</span>
            </span>
          )}
        </label>
        {labelAside && <div className="text-label text-text-muted">{labelAside}</div>}
      </div>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {hint && (
        <p id={hintId} className="text-label text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1 text-label font-medium text-danger">
          <CircleAlert aria-hidden className="mt-px size-icon-sm shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

type TextFieldProps = Omit<ComponentProps<'input'>, 'id' | 'children'> &
  Pick<FieldProps, 'label' | 'hideLabel' | 'hint' | 'error' | 'labelAside'> & { fieldClassName?: string }

/** Single-line text input with its label. Use `inputMode="decimal"` for amounts. */
export function TextField({
  label,
  hideLabel,
  hint,
  error,
  labelAside,
  required,
  fieldClassName,
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      required={required}
      labelAside={labelAside}
      className={fieldClassName}
    >
      {(control) => <input {...control} className={cn(controlClassName, className)} {...props} />}
    </Field>
  )
}

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'id' | 'children'> &
  Pick<FieldProps, 'label' | 'hideLabel' | 'hint' | 'error' | 'labelAside' | 'labelSize'> & {
    fieldClassName?: string
  }

/** Multi-line text input with its label. */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, hideLabel, hint, error, labelAside, labelSize, required, fieldClassName, className, rows = 5, ...props },
  ref,
) {
  return (
    <Field
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      required={required}
      labelAside={labelAside}
      labelSize={labelSize}
      className={fieldClassName}
    >
      {(control) => (
        <textarea
          {...control}
          ref={ref}
          rows={rows}
          className={cn(controlClassName, 'resize-y py-3', className)}
          {...props}
        />
      )}
    </Field>
  )
})
