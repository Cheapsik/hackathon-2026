import type { ReactNode } from 'react'
import { GlassPanel } from '../primitives/GlassPanel'
import { AssetPair, type AssetPairProps } from './AssetPair'
import { DataList, type DataListItem } from './DataList'

export type TransactionPanelProps = AssetPairProps & {
  /** Names the panel, e.g. "Innowacja i gmina". */
  label: string
  /** Rate / fee / data-year lines under the pair. */
  summary?: DataListItem[]
  children?: ReactNode
}

/** Glass panel holding an AssetPair and its summary — the body of TransactionTemplate. */
export function TransactionPanel({ label, summary, children, ...pair }: TransactionPanelProps) {
  return (
    <GlassPanel aria-label={label} padding="md" className="grid gap-4">
      <AssetPair {...pair} />
      {summary && summary.length > 0 && <DataList items={summary} align="center" layout="rows" className="px-2" />}
      {children}
    </GlassPanel>
  )
}
