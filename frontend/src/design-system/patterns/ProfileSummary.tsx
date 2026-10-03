import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Avatar } from '../primitives/Avatar'

export type ProfileSummaryProps = {
  name: string
  avatarSrc?: string
  /** Role or one-line description, e.g. "Pracownik JST · Gmina Wieliczka". */
  description?: ReactNode
  /** Badges (role, status). */
  meta?: ReactNode
  /** At most two actions. */
  actions?: ReactNode
  titleAs?: 'h1' | 'h2'
  className?: string
}

/** Person or organisation header: avatar, name in the display face, role and up to two actions. */
export function ProfileSummary({
  name,
  avatarSrc,
  description,
  meta,
  actions,
  titleAs: Title = 'h2',
  className,
}: ProfileSummaryProps) {
  return (
    <div
      className={cn(
        'grid justify-items-center gap-4 text-center md:grid-cols-[auto_1fr_auto] md:items-center md:justify-items-start md:text-left',
        className,
      )}
    >
      <Avatar name={name} src={avatarSrc} size="lg" />
      <div className="grid gap-2">
        <Title className="font-display text-page-title tracking-display">{name}</Title>
        {description && <p className="text-body-sm text-text-muted">{description}</p>}
        {meta && <div className="flex flex-wrap justify-center gap-2 md:justify-start">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
