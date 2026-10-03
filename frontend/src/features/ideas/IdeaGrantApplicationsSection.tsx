import { Link, useNavigate } from 'react-router'
import { useGetApiGrantCalls, usePostApiIdeasIdeaIdGrantApplications, type IdeaResponse } from '@/api/generated/castor'
import { errorMessage } from '@/lib/error-message'

/** "Generator wniosku": a draft application for an open grant call, written from the Canvas. */
export function IdeaGrantApplicationsSection({ idea }: { idea: IdeaResponse }) {
  const navigate = useNavigate()
  const grantCalls = useGetApiGrantCalls({ Open: true }, { query: { enabled: idea.canApply } })
  const create = usePostApiIdeasIdeaIdGrantApplications()
  const openCalls = grantCalls.data?.data ?? []

  if (!idea.canApply && idea.grantApplications.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="idea-grant-title">
      <h2 id="idea-grant-title">Wnioski o dofinansowanie</h2>
      {idea.grantApplications.length > 0 && (
        <ul>
          {idea.grantApplications.map((application) => (
            <li key={application.id}>
              <Link to={`/wnioski/${application.id}`}>Wniosek do naboru „{application.grantCallTitle}”</Link>
            </li>
          ))}
        </ul>
      )}
      {idea.canApply && grantCalls.isSuccess && openCalls.length === 0 && <p>Obecnie nie ma otwartych naborów.</p>}
      {idea.canApply && openCalls.length > 0 && (
        <ul>
          {openCalls
            .filter((grantCall) => !idea.grantApplications.some((application) => application.grantCallId === grantCall.id))
            .map((grantCall) => (
              <li key={grantCall.id}>
                Nabór „{grantCall.title}”{grantCall.closesOn && `, do ${grantCall.closesOn}`}.{' '}
                <button
                  type="button"
                  disabled={create.isPending}
                  onClick={() =>
                    create.mutate(
                      { ideaId: idea.id, data: { grantCallId: grantCall.id } },
                      { onSuccess: (response) => navigate(`/wnioski/${response.data.id}`) },
                    )
                  }
                >
                  Przygotuj wniosek do „{grantCall.title}”
                </button>
              </li>
            ))}
        </ul>
      )}
      <div aria-live="polite">
        {create.isPending && (
          <p>
            <output>Piszę szkic wniosku na podstawie Canvasu…</output>
          </p>
        )}
        {create.isError && <p role="alert">{errorMessage(create.error, { 409: 'Ten nabór jest już zamknięty albo pomysł został odrzucony.' })}</p>}
      </div>
    </section>
  )
}
