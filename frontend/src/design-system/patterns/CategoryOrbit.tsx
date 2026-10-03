import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ToggleGroup } from 'radix-ui'
import { cn } from '@/lib/utils'

export type OrbitCategory = {
  id: string
  label: string
  icon: LucideIcon
}

export type CategoryOrbitProps = {
  /** Names the group, e.g. "Sekcje karty innowacji". */
  label: string
  categories: OrbitCategory[]
  value: string
  onValueChange: (id: string) => void
  className?: string
}

/** Up to five categories fit on a 375 px phone; more scroll sideways on a flat row. */
const maxOnArc = 5

/**
 * Row of round category controls laid along the sheet's arc (middle lowest). The active one is larger and milky
 * white with a graphite icon; the rest are translucent glass over the photo. Arrow keys move between them.
 */
export function CategoryOrbit({ label, categories, value, onValueChange, className }: CategoryOrbitProps) {
  const onArc = categories.length <= maxOnArc
  const middle = (categories.length - 1) / 2

  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        if (next) {
          onValueChange(next)
        }
      }}
      className={cn(
        'grid grid-flow-col items-end gap-2',
        onArc ? 'auto-cols-fr' : 'scrollbar-none auto-cols-[4.5rem] overflow-x-auto pt-2',
        className,
      )}
    >
      {categories.map((category, index) => {
        const distance = middle === 0 ? 0 : Math.abs(index - middle) / middle
        const style = { '--orbit-lift': onArc ? distance * distance : 0 } as CSSProperties
        const Icon = category.icon

        return (
          <ToggleGroup.Item
            key={category.id}
            value={category.id}
            style={style}
            className="group orbit-item grid min-w-0 justify-items-center gap-2 rounded-card px-1 py-1 transition-control press"
          >
            <span className="w-full truncate text-center text-label font-medium text-on-media">{category.label}</span>
            <span
              aria-hidden
              className={cn(
                'grid size-13 place-items-center rounded-full transition-control surface-on-media',
                'group-data-[state=on]:size-15 group-data-[state=on]:border-border-highlight group-data-[state=on]:bg-surface-ceramic',
                'group-data-[state=on]:text-text-primary group-data-[state=on]:shadow-floating',
              )}
            >
              <Icon className="size-icon-lg" strokeWidth={1.65} />
            </span>
          </ToggleGroup.Item>
        )
      })}
    </ToggleGroup.Root>
  )
}
