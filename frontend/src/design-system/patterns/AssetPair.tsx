import { ArrowUpDown } from 'lucide-react'
import { AssetField, type AssetFieldProps } from '../primitives/AssetField'
import { IconButton } from '../primitives/IconButton'

export type AssetPairProps = {
  from: AssetFieldProps
  to: AssetFieldProps
  /** Shows the switch-direction button on the seam between the two fields. */
  onSwap?: () => void
  swapLabel?: string
}

/** Two related AssetFields (input → output) with an optional direction switch resting on their seam. */
export function AssetPair({ from, to, onSwap, swapLabel = 'Zamień kierunek' }: AssetPairProps) {
  return (
    <div className="grid">
      <AssetField {...from} />
      <div className="relative z-10 h-2">
        {onSwap && (
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
            <IconButton label={swapLabel} icon={ArrowUpDown} size="sm" onClick={onSwap} />
          </div>
        )}
      </div>
      <AssetField {...to} />
    </div>
  )
}
