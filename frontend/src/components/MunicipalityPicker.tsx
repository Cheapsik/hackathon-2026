import { useDeferredValue, useState } from 'react'
import { useGetApiMunicipalities, type MunicipalityResponse } from '@/api/generated/castor'
import { SoftButton, TextField } from '@/design-system'

interface MunicipalityPickerProps {
  selected: MunicipalityResponse | null
  onSelect: (municipality: MunicipalityResponse | null) => void
}

const minimumSearchLength = 2

/**
 * Optional gmina of a report: a search field and the matching gminy as radio buttons - plain controls a keyboard and
 * a screen reader handle without a custom combobox.
 */
export function MunicipalityPicker({ selected, onSelect }: MunicipalityPickerProps) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const enabled = deferredSearch.length >= minimumSearchLength
  const suggestions = useGetApiMunicipalities({ Search: deferredSearch }, { query: { enabled } })
  const municipalities = suggestions.data?.data ?? []

  if (selected) {
    return (
      <div className="grid gap-3">
        <p className="text-body-sm text-text-muted">
          Wybrana gmina: <span className="font-medium text-text-primary">{selected.qualifiedName}</span>
          {selected.powiat ? `, powiat ${selected.powiat}` : null}
        </p>
        <SoftButton type="button" variant="secondary" onClick={() => onSelect(null)}>
          Zmień gminę
        </SoftButton>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <TextField
        label="Wpisz początek nazwy gminy"
        type="search"
        autoComplete="off"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        hint={enabled ? undefined : 'Wpisz co najmniej 2 znaki.'}
      />
      <div aria-live="polite" className="min-h-5 text-label text-text-muted">
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
        <ul className="grid gap-1">
          {municipalities.map((municipality) => (
            <li key={municipality.teryt}>
              <label className="flex min-h-touch cursor-pointer items-start gap-3 rounded-control px-2 py-2 hover:bg-surface-glass-strong">
                <input
                  type="radio"
                  name="municipality"
                  value={municipality.teryt}
                  className="mt-1 size-5 accent-surface-active"
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
