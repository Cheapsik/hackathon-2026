export type TextSize = 'normal' | 'large' | 'larger'

export interface DisplayPreferences {
  textSize: TextSize
  highContrast: boolean
}

const storageKey = 'castor.display-preferences'

const defaults: DisplayPreferences = { textSize: 'normal', highContrast: false }

/** Storage can be missing or blocked (private window, cleared site data); the defaults apply then. */
export function readDisplayPreferences(): DisplayPreferences {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      return defaults
    }

    const parsed: Partial<DisplayPreferences> = JSON.parse(stored)
    return {
      textSize: isTextSize(parsed.textSize) ? parsed.textSize : defaults.textSize,
      highContrast: parsed.highContrast === true,
    }
  } catch {
    return defaults
  }
}

export function saveDisplayPreferences(preferences: DisplayPreferences) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    // The choice still applies to this visit; it is just not remembered.
  }
}

/** The stylesheet reads these attributes on <html>: data-text-size and data-contrast. */
export function applyDisplayPreferences(preferences: DisplayPreferences) {
  const root = document.documentElement
  root.dataset.textSize = preferences.textSize
  root.dataset.contrast = preferences.highContrast ? 'high' : 'normal'
}

function isTextSize(value: unknown): value is TextSize {
  return value === 'normal' || value === 'large' || value === 'larger'
}
