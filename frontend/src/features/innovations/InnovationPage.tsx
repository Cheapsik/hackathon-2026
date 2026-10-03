import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import {
  getGetApiInnovationsInnovationIdQueryKey,
  useGetApiInnovationsInnovationId,
  type InnovationResponse,
} from '@/api/generated/castor'
import { youtubeId } from '@/features/atlas/youtube'
import { PartnershipSection } from '@/features/conversations/PartnershipSection'
import { FitAssessmentSection } from '@/features/fit-assessments/FitAssessmentSection'
import { InnovationTestingSection } from '@/features/tests/InnovationTestingSection'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

const sections: { key: keyof InnovationResponse; title: string }[] = [
  { key: 'solution', title: 'Na czym polega rozwiązanie?' },
  { key: 'problems', title: 'Jakich problemów dotyczy innowacja?' },
  { key: 'targetGroup', title: 'Grupa docelowa' },
  { key: 'beneficiaries', title: 'Kto może skorzystać z innowacji?' },
  { key: 'evidence', title: 'Czy to działa?' },
]

/** An innovation card: the six sections, "Prościej", the film, the fit card and the partnership thread. */
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

  return <InnovationCard card={card} />
}

function InnovationCard({ card }: { card: InnovationResponse }) {
  const [plain, setPlain] = useState(false)
  const queryClient = useQueryClient()
  const video = card.videoUrl ? youtubeId(card.videoUrl) : null

  function updated(next: InnovationResponse) {
    queryClient.setQueryData(getGetApiInnovationsInnovationIdQueryKey(next.id), { data: next, status: 200, headers: new Headers() })
  }

  return (
    <>
      <p>
        <Link to="/biblioteka">Biblioteka innowacji</Link>
      </p>
      <h1>{card.title}</h1>
      {card.shortDescription && <p>{card.shortDescription}</p>}
      {card.categories.length > 0 && <p>Kategoria Biblioteki ROPS: {card.categories.join(', ')}</p>}
      {card.source === 'USER' && <p>Innowacja wyrosła z pomysłu zgłoszonego w Kreatorze pomysłów.</p>}
      {card.seeksTesters && <p>Zespół szuka testerów — zapisz się na liście testów albo oceń innowację poniżej.</p>}
      {card.featured && <p>Innowacja wybrana do upowszechniania.</p>}
      {card.inServiceModel && <p>Innowacja jest częścią Małopolskich Modeli Usług Społecznych.</p>}
      {card.plainText && (
        <p className="no-print">
          <button type="button" onClick={() => setPlain((current) => !current)}>
            {plain ? 'Pokaż pełny opis' : 'Prościej'}
          </button>
        </p>
      )}

      <div className="no-print">
        {plain && card.plainText ? (
          <section>
            <h2>Prościej</h2>
            <p>{card.plainText}</p>
          </section>
        ) : (
          sections.map((section) => {
          const text = card[section.key]
          return typeof text === 'string' && text ? (
            <section key={section.key}>
              <h2>{section.title}</h2>
              <p>{text}</p>
            </section>
          ) : null
        })
        )}
        {!plain && card.organization && (
          <section>
            <h2>Autorzy</h2>
            <p>{card.organization}</p>
          </section>
        )}

        <section>
          <h2>Materiały</h2>
          <ul>
            {video && (
              <li>
                <iframe
                  width="560"
                  height="315"
                  src={`https://www.youtube-nocookie.com/embed/${video}`}
                  title={`Film o innowacji „${card.title}”`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </li>
            )}
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
      <InnovationTestingSection innovation={card} onUpdated={updated} />
      <PartnershipSection innovationId={card.id} innovationTitle={card.title} />
    </>
  )
}
