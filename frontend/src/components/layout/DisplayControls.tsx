import { SegmentedControl, SwitchField, type SegmentedOption } from '@/design-system'
import type { DisplayPreferences, TextSize } from '@/lib/display-preferences'

/** Each size is shown at its own scale, so the choice previews itself. */
const textSizes: SegmentedOption<TextSize>[] = [
  { value: 'normal', label: <span className="text-body-sm">A</span>, ariaLabel: 'Tekst normalny' },
  { value: 'large', label: <span className="text-body">A+</span>, ariaLabel: 'Tekst większy' },
  { value: 'larger', label: <span className="text-section-title">A++</span>, ariaLabel: 'Tekst największy' },
]

type DisplayControlsProps = {
  preferences: DisplayPreferences
  onChange: (preferences: DisplayPreferences) => void
}

/** Text size, high contrast and reduced motion, remembered in this browser. Lives in the "Dostępność" panel. */
export function DisplayControls({ preferences, onChange }: DisplayControlsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-label font-medium text-text-muted">Rozmiar tekstu</p>
        <SegmentedControl
          label="Rozmiar tekstu"
          options={textSizes}
          value={preferences.textSize}
          onValueChange={(textSize) => onChange({ ...preferences, textSize })}
          fullWidth
        />
      </div>
      <SwitchField
        label="Wysoki kontrast"
        description="Czarny tekst na białym tle, wyraźne krawędzie."
        checked={preferences.highContrast}
        onCheckedChange={(highContrast) => onChange({ ...preferences, highContrast })}
      />
      <SwitchField
        label="Ogranicz animacje"
        description="Bez przesunięć i przejść. Ustawienie systemu też jest brane pod uwagę."
        checked={preferences.reduceMotion}
        onCheckedChange={(reduceMotion) => onChange({ ...preferences, reduceMotion })}
      />
      <p className="text-label text-text-muted">Zapamiętamy Twój wybór na tym urządzeniu.</p>
    </div>
  )
}
