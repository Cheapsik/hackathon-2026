import { useParams } from 'react-router'
import { useGetApiInnovationsInnovationId, type InnovationResponse } from '@/api/generated/castor'
import { PartnershipSection } from '@/features/conversations/PartnershipSection'
import { FitAssessmentSection } from '@/features/fit-assessments/FitAssessmentSection'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

const sections: { key: keyof InnovationResponse; title: string }[] = [
  { key: 'solution', title: 'Na czym polega rozwiązanie?' },
  { key: 'problems', title: 'Jakich problemów dotyczy innowacja?' },
  { key: 'targetGroup', title: 'Grupa docelowa' },
  { key: 'beneficiaries', title: 'Kto może skorzystać z innowacji?' },
  { key: 'evidence', title: 'Czy to działa?' },
]

/**
 * An innovation card with "Sprawdź dla mojej gminy" (module VII) and "Napisz do zespołu innowacji" (module V). The
 * full library view comes with module II.
 */
export function InnovationPage() {
  const { innovationId = '' } = useParams()
  const innovation = useGetApiInnovationsInnovationId(innovationId)
  const card = innovation.data?.data
  usePageTitle(card?.title ?? 'Innowacja')

  if (innovation.isPending) {
    return (
      <p>
        <output>Wczytuję innowację…</output>
      </p>
    )
  }

  if (innovation.isError || !card) {
    return (
      <>
        <h1>Innowacja</h1>
        <p role="alert">{errorMessage(innovation.error, { 404: 'Nie znaleźliśmy tej innowacji.' })}</p>
      </>
    )
  }

  return (
    <>
      <h1>{card.title}</h1>
      {card.shortDescription && <p>{card.shortDescription}</p>}
      {card.categories.length > 0 && <p>Kategoria Biblioteki ROPS: {card.categories.join(', ')}</p>}
      {card.source === 'USER' && <p>Innowacja wyrosła z pomysłu zgłoszonego w Kreatorze pomysłów.</p>}
      {card.seeksTesters && <p>Zespół szuka miejsc do przetestowania innowacji — napisz do niego poniżej.</p>}
      {card.featured && <p>Innowacja wybrana do upowszechniania.</p>}
      {card.inServiceModel && <p>Innowacja jest częścią Małopolskich Modeli Usług Społecznych.</p>}

      <div className="no-print">
        {sections.map((section) => {
          const text = card[section.key]
          return typeof text === 'string' && text ? (
            <section key={section.key}>
              <h2>{section.title}</h2>
              <p>{text}</p>
            </section>
          ) : null
        })}
        {card.organization && (
          <section>
            <h2>Autorzy</h2>
            <p>{card.organization}</p>
          </section>
        )}

        <section>
          <h2>Materiały</h2>
          <ul>
            {card.cardUrl && (
              <li>
                <a href={card.cardUrl} target="_blank" rel="noreferrer">
                  Karta innowacji na stronie ROPS (otwiera się w nowej karcie)
                </a>
              </li>
            )}
            {card.videoUrl && (
              <li>
                <a href={card.videoUrl} target="_blank" rel="noreferrer">
                  Film o innowacji w serwisie YouTube (otwiera się w nowej karcie)
                </a>
              </li>
            )}
            {card.materialsZipUrl && (
              <li>
                <a href={card.materialsZipUrl}>Pobierz materiały (plik ZIP ze strony ROPS)</a>
              </li>
            )}
            {card.termsUrl && (
              <li>
                <a href={card.termsUrl} target="_blank" rel="noreferrer">
                  Zasady wykorzystania (otwiera się w nowej karcie)
                </a>
              </li>
            )}
          </ul>
        </section>
      </div>

      <FitAssessmentSection innovationId={card.id} />
      <PartnershipSection innovationId={card.id} innovationTitle={card.title} />
    </>
  )
}
