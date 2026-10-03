import { Avatar as RadixAvatar } from 'radix-ui'
import { cn } from '@/lib/utils'

export type AvatarProps = {
  /** Person or organisation name: the image alt text and the source of the initials fallback. */
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'size-8 text-label',
  md: 'size-touch text-body-sm',
  lg: 'size-16 text-section-title',
} as const

/** Round portrait with initials while the image loads or when it fails. */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <RadixAvatar.Root
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-border-highlight bg-surface-solid shadow-control',
        sizes[size],
        className,
      )}
    >
      {src && <RadixAvatar.Image src={src} alt={name} className="size-full object-cover" />}
      <RadixAvatar.Fallback delayMs={src ? 300 : 0} className="font-medium text-text-muted">
        <span aria-hidden>{initialsOf(name)}</span>
        <span className="sr-only">{name}</span>
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('pl'))
    .join('')
}
