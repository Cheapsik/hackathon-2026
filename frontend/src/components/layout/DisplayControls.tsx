import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  applyDisplayPreferences,
  readDisplayPreferences,
  saveDisplayPreferences,
  type DisplayPreferences,
  type TextSize,
} from '@/lib/display-preferences'

const textSizes: { value: TextSize; label: string; name: string }[] = [
  { value: 'normal', label: 'A', name: 'Tekst normalny' },
  { value: 'large', label: 'A+', name: 'Tekst większy' },
  { value: 'larger', label: 'A++', name: 'Tekst największy' },
]

/** Text size and high contrast switches, remembered in this browser. */
export function DisplayControls() {
  const [preferences, setPreferences] = useState<DisplayPreferences>(readDisplayPreferences)

  useEffect(() => {
    applyDisplayPreferences(preferences)
    saveDisplayPreferences(preferences)
  }, [preferences])

  return (
    <div className="flex flex-wrap items-center gap-4">
      <fieldset className="flex gap-1">
        <legend className="sr-only">Rozmiar tekstu</legend>
        {textSizes.map((size) => (
          <Button
            key={size.value}
            type="button"
            size="sm"
            variant={preferences.textSize === size.value ? 'default' : 'outline'}
            aria-pressed={preferences.textSize === size.value}
            aria-label={size.name}
            onClick={() => setPreferences((current) => ({ ...current, textSize: size.value }))}
          >
            {size.label}
          </Button>
        ))}
      </fieldset>
      <Button
        type="button"
        size="sm"
        variant={preferences.highContrast ? 'default' : 'outline'}
        aria-pressed={preferences.highContrast}
        onClick={() => setPreferences((current) => ({ ...current, highContrast: !current.highContrast }))}
      >
        Wysoki kontrast
      </Button>
    </div>
  )
}
