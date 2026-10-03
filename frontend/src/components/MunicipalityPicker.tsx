import { useDeferredValue, useId, useState } from 'react'
import { useGetApiMunicipalities, type MunicipalityResponse } from '@/api/generated/castor'

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
  const searchId = useId()
  const enabled = deferredSearch.length >= minimumSearchLength
  const suggestions = useGetApiMunicipalities({ Search: deferredSearch }, { query: { enabled } })
  const municipalities = suggestions.data?.data ?? []

  if (selected) {
    return (
      <fieldset>
        <legend>Gmina (opcjonalnie)</legend>
        <p>
          Wybrana gmina: <strong>{selected.qualifiedName}</strong>, powiat {selected.powiat}
        </p>
        <button type="button" onClick={() => onSelect(null)}>
          Zmień gminę
        </button>
      </fieldset>
    )
  }

  return (
    <fieldset>
      <legend>Gmina (opcjonalnie)</legend>
      <label htmlFor={searchId}>Wpisz początek nazwy gminy</label>
      <input id={searchId} type="search" value={search} onChange={(event) => setSearch(event.target.value)} autoComplete="off" />
      <div aria-live="polite">
        {enabled && suggestions.isPending && <p>Szukam gmin…</p>}
        {enabled && suggestions.isError && <p role="alert">Nie udało się pobrać listy gmin.</p>}
        {enabled && suggestions.isSuccess && municipalities.length === 0 && <p>Nie znaleziono gminy o takiej nazwie.</p>}
        {enabled && municipalities.length > 0 && <p>Znalezione gminy: {municipalities.length}. Wybierz jedną.</p>}
      </div>
      {enabled && municipalities.length > 0 && (
        <ul>
          {municipalities.map((municipality) => (
            <li key={municipality.teryt}>
              <label>
                <input type="radio" name="municipality" value={municipality.teryt} onChange={() => onSelect(municipality)} />{' '}
                {municipality.qualifiedName}, powiat {municipality.powiat}
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}
