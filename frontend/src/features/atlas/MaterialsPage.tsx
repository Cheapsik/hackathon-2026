import { Link } from 'react-router'
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
    <>
      <p>
        <Link to="/obszary">Atlas wyzwań</Link>
      </p>
      <h1>Materiały edukacyjne</h1>
      <p>Materiały zostają na stronie ROPS. Tutaj są tylko odnośniki.</p>
      <ul>
        {materials.map((material) => (
          <li key={material.href}>
            <a href={material.href} target="_blank" rel="noreferrer">
              {material.title}
            </a>
            <p>{material.note}</p>
          </li>
        ))}
      </ul>
      <p>
        Fiszka z Canvasu jest do wypełnienia w <Link to="/pomysly">Kreatorze pomysłów</Link>.
      </p>
    </>
  )
}
