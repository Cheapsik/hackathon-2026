import type { ReactNode } from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  /** One next step, usually a SoftButton. */
  action?: ReactNode
  /** Heading level; `h1` when the empty state is the whole page (e.g. 404). */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4'
  className?: string
}

/** Nothing to show yet — says why and offers one way forward. */
export function EmptyState({ title, description, icon: Icon = Inbox, action, titleAs: Title = 'h2', className }: EmptyStateProps) {
  return (
    <div className={cn('mx-auto grid max-w-narrow justify-items-center gap-4 px-gutter py-10 text-center', className)}>
      <span className="grid size-16 place-items-center rounded-full text-text-muted surface-glass-strong">
        <Icon aria-hidden className="size-icon-lg" strokeWidth={1.5} />
      </span>
      <div className="grid gap-2">
        <Title
          className={cn(
            'font-display tracking-display',
            Title === 'h1' ? 'text-page-title' : 'text-section-title',
          )}
        >
          {title}
        </Title>
        {description && <p className="text-body-sm text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
