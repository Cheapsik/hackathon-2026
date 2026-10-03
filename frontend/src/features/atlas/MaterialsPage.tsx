import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { CeramicCard, SoftButton } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'

const materials = [
  {
    title: 'Canvas innowacji społecznych',
    href: 'https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf',
    note: 'Pola fiszki w Kreatorze pomysłów pochodzą z tego Canvasu (PDF, otwiera się w nowej karcie).',
  },
  {
    title: 'Publikacje ze Świata Innowacji',
    href: 'https://rops.krakow.pl/innowacje-spoleczne/publikacje-ze-swiata-innowacji',
    note: 'Katalog publikacji ROPS (otwiera się w nowej karcie).',
  },
  {
    title: 'Mapa Wyzwań Społecznych',
    href: 'https://rops.krakow.pl/mpliki/IS/IWS_20/za._nr_2._Mapa_Wyzwa_Spoecznych.pdf',
    note: 'Źródło ośmiu obszarów i person Atlasu (PDF, otwiera się w nowej karcie).',
  },
  {
    title: 'Raporty z badań ROPS',
    href: 'https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan',
    note: 'Baza raportów na stronie ROPS (otwiera się w nowej karcie). Pytania do treści raportów dojdą razem z embeddingami.',
  },
]

/** Educational shelf: the Canvas and the ROPS publications, linked, never copied. */
export function MaterialsPage() {
  usePageTitle('Materiały edukacyjne')

  return (
    <div className="grid gap-6">
      <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />}>
        <Link to="/obszary">Atlas wyzwań</Link>
      </SoftButton>

      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Materiały edukacyjne</h1>
        <p className="text-body text-text-muted">Materiały zostają na stronie ROPS. Tutaj są tylko odnośniki.</p>
      </header>

      <ul className="grid gap-3">
        {materials.map((material) => (
          <li key={material.href} className="min-w-0">
            <CeramicCard padding="lg" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="grid gap-1">
                <p className="text-body font-medium text-text-primary">{material.title}</p>
                <p className="text-body-sm text-text-muted">{material.note}</p>
              </div>
              <SoftButton asChild variant="secondary" trailingIcon={<ExternalLink aria-hidden />}>
                <a href={material.href} target="_blank" rel="noreferrer">
                  Otwórz
                </a>
              </SoftButton>
            </CeramicCard>
          </li>
        ))}
      </ul>

      <p className="text-body-sm text-text-muted">
        Fiszka z Canvasu jest do wypełnienia w{' '}
        <Link to="/pomysly" className="font-medium text-text-primary underline-offset-4 hover:underline">
          Kreatorze pomysłów
        </Link>
        .
      </p>
    </div>
  )
}
