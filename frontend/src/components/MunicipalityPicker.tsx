import { useState } from 'react'
import type { MunicipalityResponse } from '@/api/generated/castor'
import { SoftButton, TextField } from '@/design-system'
import { useMunicipalitySearch } from '@/hooks/use-municipality-search'

interface MunicipalityPickerProps {
  selected: MunicipalityResponse | null
  onSelect: (municipality: MunicipalityResponse | null) => void
  /** Label of the search field. */
  label?: string
  /** Line under the field before the search starts. */
  hint?: string
}

/**
 * Optional gmina of a report: a search field and the matching gminy as radio buttons - plain controls a keyboard and
 * a screen reader handle without a custom combobox.
 */
export function MunicipalityPicker({
  selected,
  onSelect,
  label = 'Wpisz początek nazwy gminy',
  hint = 'Wpisz co najmniej 2 znaki.',
}: MunicipalityPickerProps) {
  const [search, setSearch] = useState('')
  const { enabled, suggestions, municipalities } = useMunicipalitySearch(search)

  if (selected) {
    return (
      <div className="grid gap-3">
        <p className="text-label font-medium text-text-primary">{label}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-input border border-border-strong bg-surface-glass-strong py-2 pr-2 pl-4">
          <p className="text-body">
            <span className="sr-only">Wybrana gmina: </span>
            <span className="font-medium">{selected.qualifiedName}</span>
            {selected.powiat && <span className="block text-body-sm text-text-muted">powiat {selected.powiat}</span>}
          </p>
          <SoftButton type="button" variant="ghost" onClick={() => onSelect(null)}>
            Zmień gminę
          </SoftButton>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <TextField
        label={label}
        type="search"
        autoComplete="off"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        hint={enabled ? undefined : hint}
      />
      {/* Always rendered: a live region that appears together with its text is often not announced. */}
      <div aria-live="polite" className="-mt-3 text-label text-text-muted has-[p]:mt-0">
        {enabled && suggestions.isPending && <p>Szukam gmin…</p>}
        {enabled && suggestions.isError && (
          <p role="alert" className="text-danger">
            Nie udało się pobrać listy gmin.
          </p>
        )}
        {enabled && suggestions.isSuccess && municipalities.length === 0 && <p>Nie znaleziono gminy o takiej nazwie.</p>}
        {enabled && municipalities.length > 0 && <p>Znalezione gminy: {municipalities.length}. Wybierz jedną.</p>}
      </div>
      {enabled && municipalities.length > 0 && (
        <ul className="grid max-h-72 overflow-y-auto rounded-input border border-border-subtle bg-surface-glass-strong p-1">
          {municipalities.map((municipality) => (
            <li key={municipality.teryt}>
              <label className="flex min-h-touch cursor-pointer items-start gap-3 rounded-control px-3 py-2.5 transition-control hover:bg-surface-solid">
                <input
                  type="radio"
                  name="municipality"
                  value={municipality.teryt}
                  className="mt-1 size-5 shrink-0 accent-surface-active"
                  onChange={() => onSelect(municipality)}
                />
                <span className="text-body">
                  {municipality.qualifiedName}
                  <span className="block text-body-sm text-text-muted">powiat {municipality.powiat}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
