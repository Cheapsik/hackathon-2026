import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  getGetApiIdeasIdeaIdQueryKey,
  usePutApiIdeasIdeaIdSeeksTesters,
  type IdeaResponse,
} from '@/api/generated/castor'
import { errorMessage } from '@/lib/error-message'

/** Authors turn "szukam testerów" on so the idea appears on Poletko. */
export function IdeaSeeksTestersSection({ idea, onUpdated }: { idea: IdeaResponse; onUpdated: (idea: IdeaResponse) => void }) {
  const toggle = usePutApiIdeasIdeaIdSeeksTesters()
  const queryClient = useQueryClient()

  if (!idea.canToggleSeeksTesters && !idea.seeksTesters) {
    return null
  }

  return (
    <section aria-labelledby="idea-testers-title">
      <h2 id="idea-testers-title">Poletko - szukam testerów</h2>
      <p>
        {idea.seeksTesters
          ? 'Pomysł jest na liście testów. Osoby z profilem testera mogą się zapisać.'
          : 'Włącz szukanie testerów, żeby pomysł pojawił się na stronie testów.'}
      </p>
      {idea.canToggleSeeksTesters && (
        <p>
          <button
            type="button"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate(
                { ideaId: idea.id, data: { seeksTesters: !idea.seeksTesters } },
                {
                  onSuccess: (response) => {
                    onUpdated(response.data)
                    queryClient.setQueryData(getGetApiIdeasIdeaIdQueryKey(idea.id), response)
                  },
                },
              )
            }
          >
            {idea.seeksTesters ? 'Wyłącz „szukam testerów”' : 'Włącz „szukam testerów”'}
          </button>
        </p>
      )}
      {idea.seeksTesters && (
        <p>
          <Link to="/testy">Zobacz listę testów</Link>
        </p>
      )}
      <div aria-live="polite">
        {toggle.isError && (
          <p role="alert">
            {errorMessage(toggle.error, {
              403: 'Tylko autor włącza szukanie testerów.',
              409: 'Testerów szuka się przy etapie pomysł albo prototyp, gdy pomysł jest zgłoszony albo przyjęty.',
            })}
          </p>
        )}
      </div>
    </section>
  )
}
