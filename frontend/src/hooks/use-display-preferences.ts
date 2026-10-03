import { useEffect, useState } from 'react'
import {
  applyDisplayPreferences,
  readDisplayPreferences,
  saveDisplayPreferences,
  type DisplayPreferences,
} from '@/lib/display-preferences'

/**
 * Text size, colour scheme, contrast and motion for the whole app. One owner (AppLayout), which hands the
 * state to the "Dostępność" menu in the header.
 */
export function useDisplayPreferences() {
  const [preferences, setPreferences] = useState<DisplayPreferences>(readDisplayPreferences)

  useEffect(() => {
    applyDisplayPreferences(preferences)
    saveDisplayPreferences(preferences)

    if (preferences.colorScheme !== 'system') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applyDisplayPreferences(preferences)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [preferences])

  return [preferences, setPreferences] as const
}
