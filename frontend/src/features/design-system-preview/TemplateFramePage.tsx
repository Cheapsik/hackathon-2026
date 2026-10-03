import { useParams, useSearchParams } from 'react-router'
import { EmptyState } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { templatePreviews } from './template-registry'

/**
 * One page template alone, without the app chrome. The design-system page loads it in an iframe at a chosen
 * width, so the template's own media queries respond exactly as on a device of that size. `?stan=` picks a state.
 */
export function TemplateFramePage() {
  const { templateId } = useParams()
  const [searchParams] = useSearchParams()
  const preview = templatePreviews.find((candidate) => candidate.id === templateId)

  usePageTitle(preview ? `Szablon ${preview.label}` : 'Nie ma takiego szablonu')

  return (
    <div className="min-h-dvh ambient-light">
      <main>
        {preview ? (
          <preview.Component state={searchParams.get('stan') ?? undefined} />
        ) : (
          <EmptyState titleAs="h1" title="Nie ma takiego szablonu" description={`Nieznany identyfikator: ${templateId}`} />
        )}
      </main>
    </div>
  )
}
