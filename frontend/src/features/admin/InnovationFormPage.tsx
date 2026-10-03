import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import {
  getGetApiInnovationsInnovationIdQueryKey,
  getGetApiInnovationsQueryKey,
  useGetApiInnovationsInnovationId,
  usePostApiAdminInnovations,
  usePutApiAdminInnovationsInnovationId,
  type CreateInnovationRequest,
  type InnovationResponse,
} from '@/api/generated/castor'
import { stageLabels } from '@/features/admin/labels'
import { InnovationPlainLanguage } from '@/features/admin/PlainLanguageSection'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { linesOf } from '@/lib/format'

type CardText = Record<'title' | 'shortDescription' | 'categories' | 'solution' | 'problems' | 'targetGroup' | 'beneficiaries' | 'evidence' | 'organization' | 'cardUrl' | 'videoUrl' | 'materialsZipUrl' | 'cardPdfUrl' | 'termsUrl' | 'stage', string>

const textFields: { key: keyof CardText; label: string; long?: boolean }[] = [
  { key: 'title', label: 'Tytuł' },
  { key: 'shortDescription', label: 'Krótki opis', long: true },
  { key: 'categories', label: 'Kategorie Biblioteki (jedna w wierszu)', long: true },
  { key: 'solution', label: '1. Na czym polega rozwiązanie?', long: true },
  { key: 'problems', label: '2. Jakich problemów dotyczy innowacja?', long: true },
  { key: 'targetGroup', label: '3. Grupa docelowa', long: true },
  { key: 'beneficiaries', label: '4. Kto może skorzystać z innowacji?', long: true },
  { key: 'evidence', label: '5. Czy to działa?', long: true },
  { key: 'organization', label: '6. Autorzy (tylko nazwy instytucji, bez imion i nazwisk)' },
  { key: 'cardUrl', label: 'Adres karty na stronie ROPS' },
  { key: 'videoUrl', label: 'Film (YouTube)' },
  { key: 'materialsZipUrl', label: 'Materiały (ZIP)' },
  { key: 'cardPdfUrl', label: 'Karta PDF' },
  { key: 'termsUrl', label: 'Zasady wykorzystania' },
]

/** Entering a new innovation card or editing one (module VI). A new card gets its genome in the background. */
export function InnovationFormPage() {
  const { innovationId } = useParams()
  const existing = useGetApiInnovationsInnovationId(innovationId ?? '', { query: { enabled: Boolean(innovationId) } })
  usePageTitle(innovationId ? 'Edycja innowacji' : 'Nowa innowacja')

  if (innovationId && !existing.data) {
    return existing.isError ? <p role="alert">{errorMessage(existing.error, { 404: 'Nie ma takiej innowacji.' })}</p> : <p><output>Wczytuję…</output></p>
  }

  // Fresh data from the server starts the form again from it.
  return <InnovationForm key={existing.dataUpdatedAt} innovation={existing.data?.data} />
}

function InnovationForm({ innovation }: { innovation?: InnovationResponse }) {
  const [card, setCard] = useState<CardText>(() => textsOf(innovation))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const create = usePostApiAdminInnovations()
  const revise = usePutApiAdminInnovationsInnovationId()
  const mutation = innovation ? revise : create

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const request: CreateInnovationRequest = {
      title: card.title,
      shortDescription: card.shortDescription || null,
      categories: linesOf(card.categories),
      solution: card.solution,
      problems: card.problems || null,
      targetGroup: card.targetGroup || null,
      beneficiaries: card.beneficiaries || null,
      evidence: card.evidence || null,
      organization: card.organization || null,
      cardUrl: card.cardUrl || null,
      videoUrl: card.videoUrl || null,
      materialsZipUrl: card.materialsZipUrl || null,
      cardPdfUrl: card.cardPdfUrl || null,
      termsUrl: card.termsUrl || null,
      stage: card.stage,
    }
    const done = (response: { data: InnovationResponse }) => {
      queryClient.setQueryData(getGetApiInnovationsInnovationIdQueryKey(response.data.id), response)
      void queryClient.invalidateQueries({ queryKey: getGetApiInnovationsQueryKey() })
      navigate(`/innowacje/${response.data.id}`)
    }

    if (innovation) {
      revise.mutate({ innovationId: innovation.id, data: request }, { onSuccess: done })
    } else {
      create.mutate({ data: request }, { onSuccess: done })
    }
  }

  return (
    <>
      <p>
        <Link to="/admin/wiedza">Wróć do wiedzy</Link>
      </p>
      <h1>{innovation ? `Edycja: ${innovation.title}` : 'Nowa innowacja'}</h1>
      {innovation && <p>Zmiana karty nie zmienia genomu — przelicz go po zapisie, jeśli treść zmieniła się istotnie.</p>}
      <form onSubmit={submit}>
        {textFields.map((field) => (
          <p key={field.key}>
            <label>
              {field.label}
              <br />
              {field.long ? (
                <textarea rows={4} cols={70} value={card[field.key]} onChange={(event) => setCard({ ...card, [field.key]: event.target.value })} required={field.key === 'solution'} />
              ) : (
                <input size={70} value={card[field.key]} onChange={(event) => setCard({ ...card, [field.key]: event.target.value })} required={field.key === 'title'} />
              )}
            </label>
          </p>
        ))}
        <p>
          <label>
            Etap{' '}
            <select value={card.stage} onChange={(event) => setCard({ ...card, stage: event.target.value })}>
              {Object.entries(stageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </p>
        <button type="submit" disabled={mutation.isPending}>
          {innovation ? 'Zapisz kartę' : 'Dodaj innowację'}
        </button>
      </form>
      <div aria-live="polite">
        {mutation.isError && <p role="alert">{errorMessage(mutation.error, { 400: 'Innowacja potrzebuje tytułu i sekcji 1.' })}</p>}
      </div>
      {innovation && <InnovationPlainLanguage innovationId={innovation.id} />}
    </>
  )
}

function textsOf(innovation?: InnovationResponse): CardText {
  return {
    title: innovation?.title ?? '',
    shortDescription: innovation?.shortDescription ?? '',
    categories: (innovation?.categories ?? []).join('\n'),
    solution: innovation?.solution ?? '',
    problems: innovation?.problems ?? '',
    targetGroup: innovation?.targetGroup ?? '',
    beneficiaries: innovation?.beneficiaries ?? '',
    evidence: innovation?.evidence ?? '',
    organization: innovation?.organization ?? '',
    cardUrl: innovation?.cardUrl ?? '',
    videoUrl: innovation?.videoUrl ?? '',
    materialsZipUrl: innovation?.materialsZipUrl ?? '',
    cardPdfUrl: innovation?.cardPdfUrl ?? '',
    termsUrl: innovation?.termsUrl ?? '',
    stage: innovation?.stage ?? 'TESTED',
  }
}
