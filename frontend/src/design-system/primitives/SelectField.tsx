import type { ComponentProps } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlClassName } from './control-styles'
import { Field, type FieldProps } from './Field'

export type SelectOption = { value: string; label: string; disabled?: boolean }

export type SelectFieldProps = Omit<ComponentProps<'select'>, 'id' | 'children'> &
  Pick<FieldProps, 'label' | 'hideLabel' | 'hint' | 'error' | 'labelAside'> & {
    options: SelectOption[]
    /** First, empty option, e.g. "Wybierz gminę". */
    placeholder?: string
    /** Options are still loading: the select is disabled and says so. */
    loading?: boolean
    fieldClassName?: string
  }

/**
 * Native select in the system's look. Native on purpose: it brings the platform picker on phones and full
 * screen-reader support for free.
 */
export function SelectField({
  label,
  hideLabel,
  hint,
  error,
  labelAside,
  required,
  options,
  placeholder,
  loading = false,
  disabled,
  fieldClassName,
  className,
  ...props
}: SelectFieldProps) {
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
      {(control) => (
        <div className="relative">
          <select
            {...control}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cn(controlClassName, 'appearance-none pr-12', className)}
            {...props}
          >
            {loading ? (
              <option value="">Wczytuję listę…</option>
            ) : (
              placeholder !== undefined && <option value="">{placeholder}</option>
            )}
            {!loading &&
              options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-4 size-icon -translate-y-1/2 text-text-muted"
          />
        </div>
      )}
    </Field>
  )
}
