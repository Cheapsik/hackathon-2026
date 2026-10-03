import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import {
  getGetApiIdeasIdeaIdQueryKey,
  useGetApiIdeasIdeaId,
  usePostApiIdeasIdeaIdJoin,
  usePostApiIdeasIdeaIdSubmit,
  usePutApiIdeasIdeaId,
  type IdeaResponse,
} from '@/api/generated/castor'
import {
  CeramicCard,
  ErrorState,
  LoadingState,
  SoftButton,
} from '@/design-system'
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
    return <LoadingState label="Wczytuję pomysł…" />
  }

  if (idea.isError || !card) {
    return (
      <div className="grid gap-6">
        <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />}>
          <Link to="/pomysly">Kreator pomysłów</Link>
        </SoftButton>
        <header className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Pomysł</h1>
        </header>
        <ErrorState
          description={errorMessage(idea.error, {
            401: 'Zaloguj się, aby zobaczyć pomysł.',
            404: 'Nie znaleźliśmy tego pomysłu.',
          })}
          onRetry={() => {
            void idea.refetch()
          }}
        />
      </div>
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
    <div className="grid gap-8">
      <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />}>
        <Link to="/pomysly">Kreator pomysłów</Link>
      </SoftButton>

      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">{idea.title}</h1>
        <p className="text-body text-text-muted">
          Status: {ideaStatusLabel(idea.status)}
          {idea.submittedAt && `, zgłoszony ${formatDateTime(idea.submittedAt)}`}. Współautorów: {idea.coAuthorCount}.
        </p>
        {idea.fromHybridOf.length > 0 && (
          <p className="text-body-sm text-text-muted">
            Pomysł powstał z krzyżówki innowacji: {idea.fromHybridOf.map((innovation) => innovation.title).join(', ')}.
          </p>
        )}
      </header>

      <div aria-live="polite" className="grid gap-3 empty:hidden">
        {join.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(join.error, { 409: 'Już jesteś współautorem albo pomysł nie przyjmuje współautorów.' })}
          </p>
        )}
        {join.isSuccess && <p className="text-body-sm text-text-muted">Dołączyłeś do autorów pomysłu.</p>}
      </div>
      {idea.canJoin && (
        <div>
          <SoftButton
            type="button"
            variant="secondary"
            loading={join.isPending}
            onClick={() => join.mutate({ ideaId: idea.id }, { onSuccess: (response) => updated(response.data) })}
          >
            Dołącz do autorów tego pomysłu
          </SoftButton>
        </div>
      )}

      <CeramicCard asChild padding="lg">
        <section aria-labelledby="idea-canvas-title" className="grid gap-4">
          <h2 id="idea-canvas-title" className="font-display text-section-title tracking-display">
            Canvas innowacji
          </h2>
          <div aria-live="polite" className="grid gap-3 empty:hidden">
            {revise.isError && (
              <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
                {errorMessage(revise.error, {
                  400: 'Sprawdź pola Canvasu: zgłoszony pomysł musi mieć wszystkie wymagane pola.',
                  409: 'Tego pomysłu nie można już zmieniać.',
                })}
              </p>
            )}
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
            <div className="grid gap-4">
              <IdeaCardView idea={idea} />
              {idea.canEdit && (
                <div>
                  <SoftButton type="button" variant="secondary" onClick={() => setEditing(true)}>
                    Edytuj Canvas
                  </SoftButton>
                </div>
              )}
            </div>
          )}
        </section>
      </CeramicCard>

      {idea.canSubmit && (
        <CeramicCard asChild padding="lg">
          <section aria-labelledby="idea-submit-title" className="grid gap-4">
            <div className="grid gap-1">
              <h2 id="idea-submit-title" className="font-display text-section-title tracking-display">
                Zgłoszenie pomysłu
              </h2>
              {idea.missingForSubmission.length > 0 ? (
                <div className="grid gap-2">
                  <p className="text-body-sm text-text-muted">Zanim zgłosisz pomysł, uzupełnij:</p>
                  <ul className="grid gap-1 text-body-sm">
                    {idea.missingForSubmission.map((field) => (
                      <li key={field} className="text-text-primary">
                        {missingFieldLabels[field] ?? field}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-body-sm text-text-muted">
                  Canvas jest kompletny. Po zgłoszeniu pomysł zobaczą inni zalogowani użytkownicy, eksperci jego obszarów
                  i ROPS.
                </p>
              )}
            </div>
            <div>
              <SoftButton
                type="button"
                variant="primary"
                loading={submit.isPending}
                disabled={idea.missingForSubmission.length > 0}
                onClick={() =>
                  submit.mutate({ ideaId: idea.id }, { onSuccess: (response) => updated(response.data) })
                }
              >
                Zgłoś pomysł
              </SoftButton>
            </div>
            <div aria-live="polite" className="grid gap-3 empty:hidden">
              {submit.isPending && (
                <p className="text-body-sm text-text-muted">
                  <output>Sprawdzam podobne pomysły i zgłaszam…</output>
                </p>
              )}
              {submit.isError && (
                <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
                  {errorMessage(submit.error, {
                    400: 'Uzupełnij brakujące pola Canvasu.',
                    409: 'Ten pomysł jest już zgłoszony.',
                  })}
                </p>
              )}
            </div>
          </section>
        </CeramicCard>
      )}

      {seesWork && <IdeaSimilarSection idea={idea} onUpdated={updated} />}
      {idea.isAuthor && <IdeaAssistantChat ideaId={idea.id} />}
      <IdeaReviewsSection idea={idea} onUpdated={updated} />
      <IdeaAdminActions idea={idea} onUpdated={updated} />
      <IdeaSeeksTestersSection idea={idea} onUpdated={updated} />
      <IdeaGrantApplicationsSection idea={idea} />
    </div>
  )
}
