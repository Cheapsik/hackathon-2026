import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { EmptyState } from '../primitives/EmptyState'
import { ErrorState } from '../primitives/ErrorState'
import { LoadingState } from '../primitives/LoadingState'
import { PageContainer } from '../primitives/PageContainer'
import { Skeleton } from '../primitives/Skeleton'

export type CollectionStatus = 'loading' | 'error' | 'empty' | 'ready'

export type CollectionTemplateProps<T> = {
  title: ReactNode
  lead?: ReactNode
  /** One header action, e.g. "Dodaj innowację". */
  actions?: ReactNode
  /** SearchAndFilters. */
  search?: ReactNode
  /** Featured card or CardCarousel above the results. */
  featured?: ReactNode
  /** Names the results list for screen readers, e.g. "Innowacje". */
  resultsLabel: string
  status: CollectionStatus
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  /** Cards in a responsive grid, or rows in a single column. */
  layout?: 'grid' | 'list'
  loadingLabel?: string
  /** Replaces the default empty state (e.g. with a "Wyczyść filtry" action). */
  empty?: ReactNode
  /** Message for the default error state; usually ApiError.message. */
  errorMessage?: ReactNode
  onRetry?: () => void
  /** "Pokaż więcej" button or a pager under the results. */
  pagination?: ReactNode
}

/**
 * Library, catalogue, history: title, search and filters, an optional featured block, then results with
 * loading, empty and error states built in.
 */
export function CollectionTemplate<T>({
  title,
  lead,
  actions,
  search,
  featured,
  resultsLabel,
  status,
  items,
  getKey,
  renderItem,
  layout = 'grid',
  loadingLabel = 'Wczytuję wyniki…',
  empty,
  errorMessage,
  onRetry,
  pagination,
}: CollectionTemplateProps<T>) {
  const resultsId = useId()
  const listClass = cn('grid', layout === 'grid' ? 'gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'gap-2')

  return (
    <PageContainer width="wide" className="grid gap-6 pt-6 pb-10 md:pt-8">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">{title}</h1>
          {lead && <p className="text-body text-text-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>

      {search}
      {featured}

      <section aria-labelledby={resultsId} aria-busy={status === 'loading'} className="grid gap-4">
        <h2 id={resultsId} className="sr-only">
          {resultsLabel}
        </h2>

        {status === 'loading' && (
          <LoadingState label={loadingLabel}>
            <div className={listClass}>
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} shape="block" className={layout === 'grid' ? 'h-40' : 'h-16'} />
              ))}
            </div>
          </LoadingState>
        )}

        {status === 'error' && <ErrorState description={errorMessage} onRetry={onRetry} />}

        {status === 'empty' &&
          (empty ?? <EmptyState title="Nic tu jeszcze nie ma" description="Zmień wyszukiwanie albo filtry." />)}

        {status === 'ready' && (
          <ul className={listClass}>
            {items.map((item) => (
              <li key={getKey(item)} className="min-w-0">
                {renderItem(item)}
              </li>
            ))}
          </ul>
        )}

        {status === 'ready' && pagination && <div className="flex justify-center pt-2">{pagination}</div>}
      </section>
    </PageContainer>
  )
}
