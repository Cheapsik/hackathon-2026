import { Link } from 'react-router'
import { usePostApiAdminIdeasIdeaIdDecision, usePostApiAdminIdeasIdeaIdInnovation, type IdeaResponse } from '@/api/generated/castor'
import { errorMessage } from '@/lib/error-message'

interface IdeaAdminActionsProps {
  idea: IdeaResponse
  onUpdated: (idea: IdeaResponse) => void
}

/** ROPS decides on a submitted idea and turns an accepted one into an innovation in the library. */
export function IdeaAdminActions({ idea, onUpdated }: IdeaAdminActionsProps) {
  const decide = usePostApiAdminIdeasIdeaIdDecision()
  const convert = usePostApiAdminIdeasIdeaIdInnovation()

  if (!idea.canDecide && !idea.canConvert && !idea.innovationId) {
    return null
  }

  function decideAs(decision: 'ACCEPTED' | 'REJECTED') {
    decide.mutate({ ideaId: idea.id, data: { decision } }, { onSuccess: (response) => onUpdated(response.data) })
  }

  return (
    <section aria-labelledby="idea-admin-title">
      <h2 id="idea-admin-title">Decyzja ROPS</h2>
      {idea.canDecide && (
        <p>
          <button type="button" onClick={() => decideAs('ACCEPTED')} disabled={decide.isPending}>
            Przyjmij pomysł
          </button>{' '}
          <button type="button" onClick={() => decideAs('REJECTED')} disabled={decide.isPending}>
            Odrzuć pomysł
          </button>
        </p>
      )}
      {idea.canConvert && (
        <p>
          <button type="button" onClick={() => convert.mutate({ ideaId: idea.id }, { onSuccess: (response) => onUpdated(response.data) })} disabled={convert.isPending}>
            Dodaj jako innowację do Biblioteki
          </button>
        </p>
      )}
      {idea.innovationId && (
        <p>
          Z pomysłu powstała <Link to={`/innowacje/${idea.innovationId}`}>innowacja w Bibliotece</Link>.
        </p>
      )}
      <div aria-live="polite">
        {decide.isError && <p role="alert">{errorMessage(decide.error, { 409: 'Ten pomysł ma już decyzję.' })}</p>}
        {convert.isError && <p role="alert">{errorMessage(convert.error, { 409: 'Z tego pomysłu powstała już innowacja.' })}</p>}
      </div>
    </section>
  )
}
