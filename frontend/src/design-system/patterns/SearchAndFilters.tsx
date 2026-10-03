import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SearchField } from '../primitives/SearchField'

export type SearchAndFiltersProps = {
  query: string
  onQueryChange: (query: string) => void
  searchLabel: string
  placeholder?: string
  /** Searching is in progress for the current query. */
  searching?: boolean
  /** One or more FilterBar / SelectField elements. */
  filters?: ReactNode
  /** Announced politely after each change, e.g. "Znaleziono 12 innowacji". */
  resultSummary?: ReactNode
  className?: string
}

/** Search landmark (<search>): one search field, the filters under it and a live result count. Filters apply live. */
export function SearchAndFilters({
  query,
  onQueryChange,
  searchLabel,
  placeholder,
  searching = false,
  filters,
  resultSummary,
  className,
}: SearchAndFiltersProps) {
  return (
    <search className={cn('grid gap-3', className)}>
      <SearchField
        label={searchLabel}
        hideLabel
        placeholder={placeholder}
        value={query}
        onValueChange={onQueryChange}
        loading={searching}
      />
      {filters}
      <p aria-live="polite" className="min-h-5 text-label text-text-muted">
        {resultSummary}
      </p>
    </search>
  )
}
