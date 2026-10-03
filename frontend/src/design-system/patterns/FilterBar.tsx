import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Pill } from '../primitives/Pill'
import { SoftButton } from '../primitives/SoftButton'

export type FilterOption = { value: string; label: string; count?: number }

export type FilterBarProps = {
  /** Names the group, e.g. "Obszar wyzwań". */
  label: string
  options: FilterOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  /** One choice at a time instead of many. */
  single?: boolean
  /** Shows "Wyczyść" while something is selected. */
  clearable?: boolean
  className?: string
}

/**
 * Row of filter pills. On phones it scrolls sideways edge to edge; from tablet up it wraps. Each pill is a
 * toggle (aria-pressed), so the current filters are announced without colour.
 */
export function FilterBar({
  label,
  options,
  value,
  onValueChange,
  single = false,
  clearable = true,
  className,
}: FilterBarProps) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onValueChange(value.filter((selected) => selected !== option))
    } else {
      onValueChange(single ? [option] : [...value, option])
    }
  }

  return (
    // min-w-0 undoes fieldset's min-content width, which would otherwise stop the row from scrolling.
    <fieldset
      className={cn(
        'scrollbar-none -mx-gutter flex min-w-0 items-center gap-2 overflow-x-auto px-gutter py-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0',
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <Pill
          key={option.value}
          selected={value.includes(option.value)}
          count={option.count}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </Pill>
      ))}
      {clearable && value.length > 0 && (
        <SoftButton variant="ghost" icon={<X aria-hidden />} onClick={() => onValueChange([])} className="shrink-0">
          Wyczyść
        </SoftButton>
      )}
    </fieldset>
  )
}
