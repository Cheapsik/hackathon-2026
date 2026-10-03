import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Badge, PageContainer, Section, SoftButton } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { PatternSpecimens } from './PatternSpecimens'
import { PrimitiveSpecimens } from './PrimitiveSpecimens'
import { TemplateViewer } from './TemplateViewer'
import { TokenSpecimens } from './TokenSpecimens'

const contents = [
  { id: 'tokeny', label: 'Tokeny' },
  { id: 'primitives', label: 'Primitives' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'szablony', label: 'Szablony' },
]

/**
 * Development-only reference of the design system (route registered only when import.meta.env.DEV): tokens,
 * every primitive and pattern with its states, and all page templates at real viewport widths.
 * Update it whenever the system gains a variant - it is the visual regression baseline.
 */
export function DesignSystemPage() {
  usePageTitle('Design system')

  return (
    <div className="min-h-dvh ambient-light">
      <PageContainer width="wide" className="grid gap-10 py-8">
        <header className="grid gap-4">
          <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />} className="w-fit">
            <Link to="/">Aplikacja</Link>
          </SoftButton>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-page-title tracking-display">Design system Castor</h1>
            <Badge tone="warning">Tylko w trybie deweloperskim</Badge>
          </div>
          <p className="max-w-default text-body text-text-muted">
            Wzorzec dla każdego nowego ekranu. Zasady: <code className="font-mono text-body-sm">frontend/design/DESIGN.md</code>.
            Przełączniki rozmiaru tekstu i wysokiego kontrastu działają też tutaj i w podglądzie szablonów.
          </p>
          <nav aria-label="Spis treści">
            <ul className="flex flex-wrap gap-2">
              {contents.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="inline-flex min-h-touch items-center rounded-button px-4 text-body-sm font-medium surface-glass-strong transition-control hover:-translate-y-px"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="grid gap-12">
          <Section id="tokeny" title="Tokeny">
            <div className="grid gap-8">
              <TokenSpecimens />
            </div>
          </Section>
          <Section
            id="primitives"
            title="Primitives"
            description="Każdy z kompletem stanów: hover, focus, aktywny, wybrany, wyłączony, ładowanie, błąd."
          >
            <PrimitiveSpecimens />
          </Section>
          <Section
            id="patterns"
            title="Patterns"
            description="Złożone z primitives. Dostają dane i callbacki, nie znają tras ani API."
          >
            <PatternSpecimens />
          </Section>
          <Section
            id="szablony"
            title="Szablony stron"
            description="Prawdziwe media queries: każdy szablon w iframe o wybranej szerokości."
          >
            <TemplateViewer />
          </Section>
        </main>
      </PageContainer>
    </div>
  )
}
