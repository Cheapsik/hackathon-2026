import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import {
  getGetApiInnovationsInnovationIdQueryKey,
  useGetApiChallengeAreas,
  useGetApiInnovationsInnovationId,
  type InnovationResponse,
} from '@/api/generated/castor'
import { Badge, CeramicCard, SoftButton } from '@/design-system'
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
  const areas = useGetApiChallengeAreas()
  const video = card.videoUrl ? youtubeId(card.videoUrl) : null
  const areaNames = card.challengeAreaCodes.map(
    (code) => areas.data?.data.find((area) => area.code === code)?.name ?? code,
  )

  function updated(next: InnovationResponse) {
    queryClient.setQueryData(getGetApiInnovationsInnovationIdQueryKey(next.id), { data: next, status: 200, headers: new Headers() })
  }

  const notes = [
    card.source === 'USER' && 'Innowacja wyrosła z pomysłu zgłoszonego w Kreatorze pomysłów.',
    card.seeksTesters && 'Zespół szuka testerów - zapisz się na liście testów albo oceń innowację poniżej.',
    card.featured && 'Innowacja wybrana do upowszechniania.',
    card.inServiceModel && 'Innowacja jest częścią Małopolskich Modeli Usług Społecznych.',
  ].filter((note): note is string => Boolean(note))
  const hasMaterials = Boolean(video || card.cardUrl || card.videoUrl || card.materialsZipUrl || card.termsUrl)

  return (
    <div className="grid gap-10">
      <header className="grid gap-4">
        <div>
          <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />} className="no-print -ml-3">
            <Link to="/biblioteka">Biblioteka innowacji</Link>
          </SoftButton>
        </div>
        <div className="grid max-w-default gap-3">
          <h1 className="font-display text-page-title tracking-display">{card.title}</h1>
          {card.shortDescription && <p className="text-lead text-text-muted">{card.shortDescription}</p>}
        </div>
        {(areaNames.length > 0 || card.categories.length > 0) && (
          <ul aria-label="Obszary i kategorie" className="flex flex-wrap gap-2">
            {areaNames.map((name) => (
              <li key={name}>
                <Badge tone="strong">{name}</Badge>
              </li>
            ))}
            {card.categories.map((category) => (
              <li key={category}>
                <Badge>Biblioteka ROPS: {category}</Badge>
              </li>
            ))}
          </ul>
        )}
        {notes.map((note) => (
          <p key={note} className="max-w-default text-body-sm text-text-muted">
            {note}
          </p>
        ))}
      </header>

      <div className="no-print grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <CeramicCard padding="lg" className="grid gap-6">
          {card.plainText && (
            <div>
              <SoftButton aria-pressed={plain} onClick={() => setPlain((current) => !current)}>
                {plain ? 'Pokaż pełny opis' : 'Prościej'}
              </SoftButton>
            </div>
          )}
          {plain && card.plainText ? (
            <DescriptionBlock title="Prościej" text={card.plainText} />
          ) : (
            sections.map((section) => {
              const text = card[section.key]
              return typeof text === 'string' && text ? <DescriptionBlock key={section.key} title={section.title} text={text} /> : null
            })
          )}
          {!plain && card.organization && <DescriptionBlock title="Autorzy" text={card.organization} />}
        </CeramicCard>

        {hasMaterials && (
        <section aria-labelledby="materials-title" className="grid gap-4">
          <h2 id="materials-title" className="text-section-title font-medium">
            Materiały
          </h2>
          {video && (
            <div className="overflow-hidden rounded-card bg-media">
              <iframe
                className="aspect-video w-full"
                src={`https://www.youtube-nocookie.com/embed/${video}`}
                title={`Film o innowacji „${card.title}”`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          <CeramicCard asChild padding="none" className="p-1">
            <ul className="grid divide-y divide-border-subtle text-body-sm">
              {card.cardUrl && (
                <MaterialLink href={card.cardUrl} external>
                  Karta innowacji na stronie ROPS (otwiera się w nowej karcie)
                </MaterialLink>
              )}
              {card.videoUrl && (
                <MaterialLink href={card.videoUrl} external>
                  Film o innowacji w serwisie YouTube (otwiera się w nowej karcie)
                </MaterialLink>
              )}
              {card.materialsZipUrl && (
                <MaterialLink href={card.materialsZipUrl}>Pobierz materiały (plik ZIP ze strony ROPS)</MaterialLink>
              )}
              {card.termsUrl && (
                <MaterialLink href={card.termsUrl} external>
                  Zasady wykorzystania (otwiera się w nowej karcie)
                </MaterialLink>
              )}
            </ul>
          </CeramicCard>
        </section>
        )}
      </div>

      <FitAssessmentSection innovationId={card.id} />
      <InnovationTestingSection innovation={card} onUpdated={updated} />
      <PartnershipSection innovationId={card.id} innovationTitle={card.title} />
    </div>
  )
}

function DescriptionBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-body font-semibold">{title}</h2>
      <p className="max-w-default text-body text-text-muted">{text}</p>
    </section>
  )
}

function MaterialLink({ href, external = false, children }: { href: string; external?: boolean; children: ReactNode }) {
  return (
    <li>
      <a
        href={href}
        className="block rounded-control px-3 py-3 font-medium text-text-primary underline-offset-4 transition-control hover:bg-surface-solid hover:underline"
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {children}
      </a>
    </li>
  )
}
