import { Link } from 'react-router'
import { usePostApiIdeasIdeaIdSimilar, usePutApiIdeasIdeaId, type IdeaResponse } from '@/api/generated/castor'
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
    <section aria-labelledby="idea-similar-title">
      <h2 id="idea-similar-title">Podobne innowacje i pomysły</h2>
      {idea.startingInnovation && (
        <p>
          Punkt wyjścia: <Link to={`/innowacje/${idea.startingInnovation.id}`}>{idea.startingInnovation.title}</Link>
        </p>
      )}
      {idea.similarCheckedAt ? (
        <p>
          Sprawdzono {formatDateTime(idea.similarCheckedAt)}.
          {!idea.similarIsCurrent && ' Od tego czasu karta się zmieniła - sprawdź ponownie.'}
        </p>
      ) : (
        <p>Jeszcze nie sprawdzaliśmy. Sprawdzimy też automatycznie przy zgłaszaniu pomysłu.</p>
      )}
      {idea.canEdit && (
        <p>
          <button type="button" onClick={() => check.mutate({ ideaId: idea.id }, { onSuccess: (response) => onUpdated(response.data) })} disabled={check.isPending}>
            Sprawdź, czy podobne już istnieją
          </button>
        </p>
      )}

      <div aria-live="polite">
        {check.isPending && (
          <p>
            <output>Porównuję z Biblioteką ROPS i innymi pomysłami…</output>
          </p>
        )}
        {check.isError && <p role="alert">{errorMessage(check.error)}</p>}
        {revise.isError && <p role="alert">{errorMessage(revise.error, { 409: 'Tego pomysłu nie można już zmieniać.' })}</p>}
        {idea.similarCheckedAt && idea.similar.length === 0 && <p>Nie znaleźliśmy niczego podobnego.</p>}
      </div>

      {idea.similar.length > 0 && (
        <ul>
          {idea.similar.map((similar) => (
            <li key={`${similar.kind}-${similar.targetId}`}>
              {similar.kind === 'INNOVATION' ? 'Innowacja' : 'Pomysł'}{' '}
              <Link to={similar.kind === 'INNOVATION' ? `/innowacje/${similar.targetId}` : `/pomysly/${similar.targetId}`}>„{similar.title}”</Link>
              {' - '}podobieństwo {similar.score} na 100. {similar.justification}
              {similar.kind === 'IDEA' && ' Możesz otworzyć ten pomysł i dołączyć do jego autorów.'}
              {similar.kind === 'INNOVATION' && idea.canEdit && idea.startingInnovation?.id !== similar.targetId && (
                <>
                  {' '}
                  <button type="button" onClick={() => startFrom(similar.targetId)} disabled={revise.isPending}>
                    Użyj „{similar.title}” jako punktu wyjścia
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {idea.similar.length > 0 && idea.canEdit && !idea.differenceNote && (
        <p>Twój pomysł jest inny? Opisz różnicę w polu „Czym Twój pomysł różni się od podobnych?” w Canvasie.</p>
      )}
    </section>
  )
}
