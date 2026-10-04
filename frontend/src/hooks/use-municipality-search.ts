import { useDeferredValue } from 'react'
import { useGetApiMunicipalities } from '@/api/generated/castor'

const minimumSearchLength = 2

/**
 * Gminy matching what the person typed. The query waits for at least two letters and for typing to settle, so
 * every picker of a gmina searches the same way.
 */
export function useMunicipalitySearch(search: string) {
  const deferredSearch = useDeferredValue(search.trim())
  const enabled = deferredSearch.length >= minimumSearchLength
  const suggestions = useGetApiMunicipalities({ Search: deferredSearch }, { query: { enabled } })

  return { enabled, suggestions, municipalities: suggestions.data?.data ?? [] }
}
