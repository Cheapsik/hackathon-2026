import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import {
  getGetApiIdeasIdeaIdQueryKey,
  useGetApiIdeasIdeaId,
  usePostApiIdeasIdeaIdJoin,
  usePostApiIdeasIdeaIdSubmit,
  usePutApiIdeasIdeaId,
  type IdeaResponse,
} from '@/api/generated/castor'
import { canvasRequestOf, canvasValuesOf } from '@/features/ideas/canvas-values'
import { IdeaAdminActions } from '@/features/ideas/IdeaAdminActions'
import { IdeaAssistantChat } from '@/features/ideas/IdeaAssistantChat'
import { IdeaCanvasForm } from '@/features/ideas/IdeaCanvasForm'
import { IdeaCardView } from '@/features/ideas/IdeaCardView'
import { IdeaGrantApplicationsSection } from '@/features/ideas/IdeaGrantApplicationsSection'
import { IdeaReviewsSection } from '@/features/ideas/IdeaReviewsSection'
import { IdeaSimilarSection } from '@/features/ideas/IdeaSimilarSection'
import { ideaStatusLabel, missingFieldLabels } from '@/features/ideas/labels'
import { IdeaSeeksTestersSection } from '@/features/tests/IdeaSeeksTestersSection'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** One idea of the Kreator: its Canvas, the duplicate check, the assistant, reviews, ROPS's decision and grant drafts. */
export function IdeaPage() {
  const { ideaId = '' } = useParams()
  const idea = useGetApiIdeasIdeaId(ideaId)
  const card = idea.data?.data
  usePageTitle(card?.title ?? 'Pomysł')

  if (idea.isPending) {
    return (
      <p>
        <output>Wczytuję pomysł…</output>
      </p>
    )
  }

  if (idea.isError || !card) {
    return (
      <>
        <h1>Pomysł</h1>
        <p role="alert">{errorMessage(idea.error, { 401: 'Zaloguj się, aby zobaczyć pomysł.', 404: 'Nie znaleźliśmy tego pomysłu.' })}</p>
        <p>
          <Link to="/pomysly">Wróć do Kreatora pomysłów</Link>
        </p>
      </>
    )
  }

  return <IdeaDetails idea={card} />
}

function IdeaDetails({ idea }: { idea: IdeaResponse }) {
  const [editing, setEditing] = useState(false)
  const queryClient = useQueryClient()
  const revise = usePutApiIdeasIdeaId()
  const submit = usePostApiIdeasIdeaIdSubmit()
  const join = usePostApiIdeasIdeaIdJoin()
  const seesWork = idea.isAuthor || idea.canDecide || idea.canConvert

  function updated(next: IdeaResponse) {
    queryClient.setQueryData(getGetApiIdeasIdeaIdQueryKey(idea.id), { data: next, status: 200, headers: new Headers() })
  }

  return (
    <>
      <p>
        <Link to="/pomysly">Kreator pomysłów</Link>
      </p>
      <h1>{idea.title}</h1>
      <p>
        Status: {ideaStatusLabel(idea.status)}
        {idea.submittedAt && `, zgłoszony ${formatDateTime(idea.submittedAt)}`}. Współautorów: {idea.coAuthorCount}.
      </p>
      {idea.fromHybridOf.length > 0 && <p>Pomysł powstał z krzyżówki innowacji: {idea.fromHybridOf.map((innovation) => innovation.title).join(', ')}.</p>}

      <div aria-live="polite">
        {join.isError && <p role="alert">{errorMessage(join.error, { 409: 'Już jesteś współautorem albo pomysł nie przyjmuje współautorów.' })}</p>}
        {join.isSuccess && <p>Dołączyłeś do autorów pomysłu.</p>}
      </div>
      {idea.canJoin && (
        <p>
          <button type="button" onClick={() => join.mutate({ ideaId: idea.id }, { onSuccess: (response) => updated(response.data) })} disabled={join.isPending}>
            Dołącz do autorów tego pomysłu
          </button>
        </p>
      )}

      <section aria-labelledby="idea-canvas-title">
        <h2 id="idea-canvas-title">Canvas innowacji</h2>
        <div aria-live="polite">
          {revise.isError && <p role="alert">{errorMessage(revise.error, { 400: 'Sprawdź pola Canvasu: zgłoszony pomysł musi mieć wszystkie wymagane pola.', 409: 'Tego pomysłu nie można już zmieniać.' })}</p>}
        </div>
        {editing ? (
          <IdeaCanvasForm
            key={idea.updatedAt}
            initial={canvasValuesOf(idea)}
            submitLabel="Zapisz zmiany"
            pending={revise.isPending}
            onCancel={() => setEditing(false)}
            onSubmit={(values) =>
              revise.mutate(
                { ideaId: idea.id, data: canvasRequestOf(values) },
                {
                  onSuccess: (response) => {
                    updated(response.data)
                    setEditing(false)
                  },
                },
              )
            }
          />
        ) : (
          <>
            <IdeaCardView idea={idea} />
            {idea.canEdit && (
              <button type="button" onClick={() => setEditing(true)}>
                Edytuj Canvas
              </button>
            )}
          </>
        )}
      </section>

      {idea.canSubmit && (
        <section aria-labelledby="idea-submit-title">
          <h2 id="idea-submit-title">Zgłoszenie pomysłu</h2>
          {idea.missingForSubmission.length > 0 ? (
            <>
              <p>Zanim zgłosisz pomysł, uzupełnij:</p>
              <ul>
                {idea.missingForSubmission.map((field) => (
                  <li key={field}>{missingFieldLabels[field] ?? field}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>Canvas jest kompletny. Po zgłoszeniu pomysł zobaczą inni zalogowani użytkownicy, eksperci jego obszarów i ROPS.</p>
          )}
          <button
            type="button"
            onClick={() => submit.mutate({ ideaId: idea.id }, { onSuccess: (response) => updated(response.data) })}
            disabled={submit.isPending || idea.missingForSubmission.length > 0}
          >
            Zgłoś pomysł
          </button>
          <div aria-live="polite">
            {submit.isPending && (
              <p>
                <output>Sprawdzam podobne pomysły i zgłaszam…</output>
              </p>
            )}
            {submit.isError && <p role="alert">{errorMessage(submit.error, { 400: 'Uzupełnij brakujące pola Canvasu.', 409: 'Ten pomysł jest już zgłoszony.' })}</p>}
          </div>
        </section>
      )}

      {seesWork && <IdeaSimilarSection idea={idea} onUpdated={updated} />}
      {idea.isAuthor && <IdeaAssistantChat ideaId={idea.id} />}
      <IdeaReviewsSection idea={idea} onUpdated={updated} />
      <IdeaAdminActions idea={idea} onUpdated={updated} />
      <IdeaSeeksTestersSection idea={idea} onUpdated={updated} />
      <IdeaGrantApplicationsSection idea={idea} />
    </>
  )
}
