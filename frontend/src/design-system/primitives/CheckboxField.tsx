import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type CheckboxFieldProps = Omit<ComponentProps<'input'>, 'type' | 'id' | 'children'> & {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  fieldClassName?: string
}

/**
 * Native checkbox with its label, hint and error — consent, "Zgłaszam w czyimś imieniu". The whole row is the
 * click target (at least 44 px high).
 */
export function CheckboxField({ label, hint, error, fieldClassName, className, ...props }: CheckboxFieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cn('grid gap-1', fieldClassName)}>
      <label
        htmlFor={id}
        className="flex min-h-touch cursor-pointer items-start gap-3 rounded-control py-2 has-disabled:cursor-not-allowed has-disabled:opacity-50"
      >
        <input
          id={id}
          type="checkbox"
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          className={cn('mt-0.5 size-5 shrink-0 cursor-[inherit] accent-surface-active', className)}
          {...props}
        />
        <span className="grid gap-1">
          <span className="text-body">{label}</span>
          {hint && (
            <span id={hintId} className="text-label text-text-muted">
              {hint}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p id={errorId} className="pl-8 text-label font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
