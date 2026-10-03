import { useRef, type ComponentProps } from 'react'
import { LoaderCircle, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlClassName } from './control-styles'
import { Field, type FieldProps } from './Field'
import { IconButton } from './IconButton'

export type SearchFieldProps = Omit<ComponentProps<'input'>, 'id' | 'type' | 'value' | 'onChange' | 'children'> &
  Pick<FieldProps, 'label' | 'hideLabel' | 'hint' | 'error'> & {
    value: string
    onValueChange: (value: string) => void
    /** Shows a spinner while results for the current text are on their way. */
    loading?: boolean
    fieldClassName?: string
  }

/** Search input with a magnifier, a clear button and a loading indicator. Controlled. */
export function SearchField({
  label,
  hideLabel,
  hint,
  error,
  value,
  onValueChange,
  loading = false,
  fieldClassName,
  className,
  ...props
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Field label={label} hideLabel={hideLabel} hint={hint} error={error} className={fieldClassName}>
      {(control) => (
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-icon -translate-y-1/2 text-text-muted"
          />
          <input
            {...control}
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            className={cn(
              controlClassName,
              'rounded-button pr-14 pl-11 [&::-webkit-search-cancel-button]:appearance-none',
              className,
            )}
            {...props}
          />
          <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
            {loading ? (
              <span className="grid size-touch place-items-center text-text-muted">
                <LoaderCircle aria-hidden className="size-icon animate-spin" />
              </span>
            ) : (
              value && (
                <IconButton
                  label="Wyczyść wyszukiwanie"
                  icon={X}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onValueChange('')
                    inputRef.current?.focus()
                  }}
                />
              )
            )}
          </div>
        </div>
      )}
    </Field>
  )
}
