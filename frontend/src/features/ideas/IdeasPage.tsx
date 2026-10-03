import { Link } from 'react-router'
import { useGetApiIdeas, useGetApiIdeasForReview, useGetApiIdeasSubmitted, type IdeaSummaryResponse } from '@/api/generated/castor'
import { SoftButton } from '@/design-system'
import { ideaStatusLabel } from '@/features/ideas/labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** "Kreator pomysłów" (Szkółka): the user's own ideas, ideas submitted by others and, for experts, ideas to review. */
export function IdeasPage() {
  usePageTitle('Kreator pomysłów')
  const session = useSession()

  if (!session) {
    return (
      <p>
        <output>Sprawdzam sesję…</output>
      </p>
    )
  }

  if (!session.signedIn) {
    return (
      <>
        <h1>Kreator pomysłów</h1>
        <p>
          Kreator prowadzi od pomysłu do gotowej karty innowacji według Canvasu Szkółki innowacji. Aby z niego skorzystać,{' '}
          <Link to="/logowanie">zaloguj się</Link> albo <Link to="/rejestracja">załóż konto</Link>.
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Kreator pomysłów</h1>
      <p>Opisz pomysł na Canvasie innowacji, sprawdź, czy podobny już istnieje, i zgłoś go do oceny ekspertów i ROPS.</p>
      <p>
        <SoftButton asChild variant="primary">
          <Link to="/pomysly/nowy">Nowy pomysł</Link>
        </SoftButton>
      </p>
      <MyIdeas />
      {session.role === 'EXPERT' && <IdeasForReview />}
      <SubmittedIdeas />
    </>
  )
}

function MyIdeas() {
  const ideas = useGetApiIdeas()

  return (
    <IdeaList
      id="my-ideas"
      title="Moje pomysły"
      empty="Nie masz jeszcze pomysłów."
      pending={ideas.isPending}
      error={ideas.isError ? errorMessage(ideas.error) : null}
      ideas={ideas.data?.data ?? []}
    />
  )
}

function IdeasForReview() {
  const ideas = useGetApiIdeasForReview()

  return (
    <IdeaList
      id="ideas-for-review"
      title="Do oceny w moich obszarach"
      empty="Nie ma pomysłów czekających na ocenę."
      pending={ideas.isPending}
      error={ideas.isError ? errorMessage(ideas.error) : null}
      ideas={ideas.data?.data ?? []}
    />
  )
}

function SubmittedIdeas() {
  const ideas = useGetApiIdeasSubmitted()
  const othersIdeas = (ideas.data?.data ?? []).filter((idea) => !idea.mine)

  return (
    <IdeaList
      id="submitted-ideas"
      title="Pomysły innych - możesz dołączyć"
      empty="Nikt inny nie zgłosił jeszcze pomysłu."
      pending={ideas.isPending}
      error={ideas.isError ? errorMessage(ideas.error) : null}
      ideas={othersIdeas}
    />
  )
}

interface IdeaListProps {
  id: string
  title: string
  empty: string
  pending: boolean
  error: string | null
  ideas: IdeaSummaryResponse[]
}

function IdeaList({ id, title, empty, pending, error, ideas }: IdeaListProps) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <div aria-live="polite">
        {pending && (
          <p>
            <output>Wczytuję pomysły…</output>
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        {!pending && !error && ideas.length === 0 && <p>{empty}</p>}
      </div>
      {ideas.length > 0 && (
        <ul>
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Link to={`/pomysly/${idea.id}`}>{idea.title}</Link> - {ideaStatusLabel(idea.status)}, zmieniony {formatDateTime(idea.updatedAt)}
              {idea.reviewedByMe && ' (oceniony przez Ciebie)'}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
