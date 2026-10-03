import { Link } from 'react-router'
import { usePostApiIdeasIdeaIdSimilar, usePutApiIdeasIdeaId, type IdeaResponse } from '@/api/generated/castor'
import { CeramicCard, SoftButton } from '@/design-system'
import { canvasRequestOf, canvasValuesOf } from '@/features/ideas/canvas-values'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

interface IdeaSimilarSectionProps {
  idea: IdeaResponse
  onUpdated: (idea: IdeaResponse) => void
}

/**
 * "Czy to już istnieje?": innovations from the library and other submitted ideas that look alike. The author may
 * join a similar idea, start from an innovation, or say in the card how theirs differs.
 */
export function IdeaSimilarSection({ idea, onUpdated }: IdeaSimilarSectionProps) {
  const check = usePostApiIdeasIdeaIdSimilar()
  const revise = usePutApiIdeasIdeaId()

  function startFrom(innovationId: string) {
    const data = canvasRequestOf({ ...canvasValuesOf(idea), startingInnovationId: innovationId })
    revise.mutate({ ideaId: idea.id, data }, { onSuccess: (response) => onUpdated(response.data) })
  }

  return (
    <CeramicCard asChild padding="lg">
      <section aria-labelledby="idea-similar-title" className="grid gap-4">
        <div className="grid gap-1">
          <h2 id="idea-similar-title" className="font-display text-section-title tracking-display">
            Podobne innowacje i pomysły
          </h2>
          {idea.startingInnovation && (
            <p className="text-body-sm text-text-muted">
              Punkt wyjścia:{' '}
              <Link
                to={`/innowacje/${idea.startingInnovation.id}`}
                className="font-medium text-text-primary underline-offset-4 hover:underline"
              >
                {idea.startingInnovation.title}
              </Link>
            </p>
          )}
          {idea.similarCheckedAt ? (
            <p className="text-body-sm text-text-muted">
              Sprawdzono {formatDateTime(idea.similarCheckedAt)}.
              {!idea.similarIsCurrent && ' Od tego czasu karta się zmieniła - sprawdź ponownie.'}
            </p>
          ) : (
            <p className="text-body-sm text-text-muted">
              Jeszcze nie sprawdzaliśmy. Sprawdzimy też automatycznie przy zgłaszaniu pomysłu.
            </p>
          )}
        </div>

        {idea.canEdit && (
          <div>
            <SoftButton
              type="button"
              variant="secondary"
              loading={check.isPending}
              onClick={() => check.mutate({ ideaId: idea.id }, { onSuccess: (response) => onUpdated(response.data) })}
            >
              Sprawdź, czy podobne już istnieją
            </SoftButton>
          </div>
        )}

        <div aria-live="polite" className="grid gap-3 empty:hidden">
          {check.isPending && (
            <p className="text-body-sm text-text-muted">
              <output>Porównuję z Biblioteką ROPS i innymi pomysłami…</output>
            </p>
          )}
          {check.isError && (
            <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
              {errorMessage(check.error)}
            </p>
          )}
          {revise.isError && (
            <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
              {errorMessage(revise.error, { 409: 'Tego pomysłu nie można już zmieniać.' })}
            </p>
          )}
          {idea.similarCheckedAt && idea.similar.length === 0 && (
            <p className="text-body-sm text-text-muted">Nie znaleźliśmy niczego podobnego.</p>
          )}
        </div>

        {idea.similar.length > 0 && (
          <ul className="grid gap-3">
            {idea.similar.map((similar) => (
              <li
                key={`${similar.kind}-${similar.targetId}`}
                className="grid gap-2 rounded-control border border-border-subtle bg-surface-solid px-4 py-3 text-body-sm"
              >
                <p>
                  <span className="font-medium">{similar.kind === 'INNOVATION' ? 'Innowacja' : 'Pomysł'}</span>{' '}
                  <Link
                    to={
                      similar.kind === 'INNOVATION'
                        ? `/innowacje/${similar.targetId}`
                        : `/pomysly/${similar.targetId}`
                    }
                    className="font-medium text-text-primary underline-offset-4 hover:underline"
                  >
                    „{similar.title}”
                  </Link>
                  {' - '}podobieństwo {similar.score} na 100.
                </p>
                <p className="text-text-muted">{similar.justification}</p>
                {similar.kind === 'IDEA' && (
                  <p className="text-text-muted">Możesz otworzyć ten pomysł i dołączyć do jego autorów.</p>
                )}
                {similar.kind === 'INNOVATION' &&
                  idea.canEdit &&
                  idea.startingInnovation?.id !== similar.targetId && (
                    <div>
                      <SoftButton
                        type="button"
                        variant="ghost"
                        loading={revise.isPending}
                        onClick={() => startFrom(similar.targetId)}
                      >
                        Użyj „{similar.title}” jako punktu wyjścia
                      </SoftButton>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        )}
        {idea.similar.length > 0 && idea.canEdit && !idea.differenceNote && (
          <p className="text-body-sm text-text-muted">
            Twój pomysł jest inny? Opisz różnicę w polu „Czym Twój pomysł różni się od podobnych?” w Canvasie.
          </p>
        )}
      </section>
    </CeramicCard>
  )
}
