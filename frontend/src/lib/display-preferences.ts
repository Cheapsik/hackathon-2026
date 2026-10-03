export type TextSize = 'normal' | 'large' | 'larger'

/** Explicit choice, or follow the operating system. */
export type ColorScheme = 'light' | 'dark' | 'system'

export interface DisplayPreferences {
  textSize: TextSize
  colorScheme: ColorScheme
  highContrast: boolean
  /** On top of the system setting: motion is reduced when either asks for it. */
  reduceMotion: boolean
}

const storageKey = 'castor.display-preferences'

const defaults: DisplayPreferences = {
  textSize: 'normal',
  colorScheme: 'system',
  highContrast: false,
  reduceMotion: false,
}

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
      colorScheme: isColorScheme(parsed.colorScheme) ? parsed.colorScheme : defaults.colorScheme,
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

/** Resolves `system` against the OS preference at call time. */
export function resolvedColorScheme(scheme: ColorScheme): 'light' | 'dark' {
  if (scheme !== 'system') {
    return scheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * The stylesheet reads these attributes on <html>: data-text-size, data-theme, data-contrast and data-motion.
 * High contrast replaces the palette entirely (black on white), so it wins over light/dark.
 */
export function applyDisplayPreferences(preferences: DisplayPreferences) {
  const root = document.documentElement
  const theme = resolvedColorScheme(preferences.colorScheme)
  root.dataset.textSize = preferences.textSize
  root.dataset.theme = theme
  root.dataset.contrast = preferences.highContrast ? 'high' : 'normal'
  root.dataset.motion = preferences.reduceMotion ? 'reduce' : 'normal'
  root.style.colorScheme = preferences.highContrast ? 'light' : theme
}

function isTextSize(value: unknown): value is TextSize {
  return value === 'normal' || value === 'large' || value === 'larger'
}

function isColorScheme(value: unknown): value is ColorScheme {
  return value === 'light' || value === 'dark' || value === 'system'
}
