export type TextSize = 'normal' | 'large' | 'larger'

export interface DisplayPreferences {
  textSize: TextSize
  highContrast: boolean
  /** On top of the system setting: motion is reduced when either asks for it. */
  reduceMotion: boolean
}

const storageKey = 'castor.display-preferences'

const defaults: DisplayPreferences = { textSize: 'normal', highContrast: false, reduceMotion: false }

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
      reduceMotion: parsed.reduceMotion === true,
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

/** The stylesheet reads these attributes on <html>: data-text-size, data-contrast and data-motion. */
export function applyDisplayPreferences(preferences: DisplayPreferences) {
  const root = document.documentElement
  root.dataset.textSize = preferences.textSize
  root.dataset.contrast = preferences.highContrast ? 'high' : 'normal'
  root.dataset.motion = preferences.reduceMotion ? 'reduce' : 'normal'
}

function isTextSize(value: unknown): value is TextSize {
  return value === 'normal' || value === 'large' || value === 'larger'
}
