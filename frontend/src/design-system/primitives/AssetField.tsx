import { useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AssetFieldProps = {
  /** Top-left label, e.g. "Innowacja" or "Gmina". Names the whole group. */
  label: string
  /** Top-right context, e.g. "Rok danych: 2024". */
  meta?: ReactNode
  asset: {
    name: string
    /** Short code or icon in the coloured circle. */
    symbol?: ReactNode
    tone?: 'neutral' | 'accent' | 'success' | 'warning'
  }
  /** Makes the asset a button that opens a picker (e.g. a BottomSheet with a list). */
  onAssetSelect?: () => void
  /** Large value on the right. Editable when `onValueChange` is given (decimal keyboard on phones). */
  value?: {
    value: string
    /** Accessible name of the value, e.g. "Liczba odbiorców". */
    label: string
    onValueChange?: (value: string) => void
    placeholder?: string
    unit?: string
  }
  /** Small line under the value, e.g. "≈ 1 240 osób w gminie". */
  secondary?: ReactNode
  error?: ReactNode
  disabled?: boolean
  className?: string
}

const toneClass = {
  neutral: 'bg-surface-active text-text-inverse',
  accent: 'bg-accent text-text-inverse',
  success: 'bg-success text-text-inverse',
  warning: 'bg-warning-soft text-warning',
} as const

/**
 * Two-storey block for one side of a paired operation: label and context on top, the chosen item and its value
 * below. Used in pairs by AssetPair / TransactionTemplate.
 */
export function AssetField({
  label,
  meta,
  asset,
  onAssetSelect,
  value,
  secondary,
  error,
  disabled = false,
  className,
}: AssetFieldProps) {
  const id = useId()
  const labelId = `${id}-label`
  const errorId = error ? `${id}-error` : undefined

  const assetContent = (
    <>
      <span
        aria-hidden
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full text-label font-semibold shadow-control [&_svg]:size-icon-sm',
          toneClass[asset.tone ?? 'neutral'],
        )}
      >
        {asset.symbol ?? asset.name.slice(0, 1)}
      </span>
      <span className="min-w-0 truncate text-body font-medium">{asset.name}</span>
    </>
  )

  return (
    <div
      // A fieldset's <legend> cannot be laid out inside the two-row grid, so the group is named by its label.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-labelledby={labelId}
      aria-describedby={errorId}
      className={cn(
        'grid min-h-28 content-between gap-3 rounded-input p-4 surface-glass-strong',
        error && 'surface-invalid',
        disabled && 'opacity-60',
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3 text-label text-text-muted">
        <span id={labelId} className="font-medium">
          {label}
        </span>
        {meta && <span className="tabular truncate">{meta}</span>}
      </div>

      <div className="flex items-center justify-between gap-3">
        {onAssetSelect ? (
          <button
            type="button"
            onClick={onAssetSelect}
            disabled={disabled}
            aria-label={`${label}: ${asset.name}. Zmień`}
            className="-ml-2 inline-flex min-h-touch min-w-0 items-center gap-2 rounded-button px-2 transition-control press hover:bg-surface-glass"
          >
            {assetContent}
            <ChevronDown aria-hidden className="size-icon-sm shrink-0 text-text-muted" />
          </button>
        ) : (
          <div className="inline-flex min-w-0 items-center gap-2">{assetContent}</div>
        )}

        {value && (
          <div className="grid min-w-0 justify-items-end gap-1 text-right">
            {value.onValueChange ? (
              <input
                aria-label={value.label}
                aria-invalid={error ? true : undefined}
                inputMode="decimal"
                autoComplete="off"
                disabled={disabled}
                value={value.value}
                placeholder={value.placeholder}
                onChange={(event) => value.onValueChange?.(event.target.value)}
                className="w-full max-w-40 rounded-control bg-transparent text-right font-display text-value tracking-display tabular placeholder:text-text-faint"
              />
            ) : (
              <span className="font-display text-value tracking-display tabular">
                <span className="sr-only">{value.label}: </span>
                {value.value}
                {value.unit && <span className="ml-1 font-sans text-body-sm text-text-muted">{value.unit}</span>}
              </span>
            )}
            {secondary && <span className="tabular text-label text-text-muted">{secondary}</span>}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-label font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
