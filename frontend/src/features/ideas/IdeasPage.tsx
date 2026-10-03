import { Link } from 'react-router'
import { Lightbulb } from 'lucide-react'
import { useGetApiIdeas, useGetApiIdeasForReview, useGetApiIdeasSubmitted, type IdeaSummaryResponse } from '@/api/generated/castor'
import {
  Badge,
  CeramicCard,
  EmptyState,
  ErrorState,
  LoadingState,
  Section,
  SoftButton,
  type BadgeProps,
} from '@/design-system'
import { ideaStatusLabel } from '@/features/ideas/labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'
import { timeSince } from '@/lib/format'

function statusTone(status: string): BadgeProps['tone'] {
  if (status === 'ACCEPTED') {
    return 'success'
  }
  if (status === 'REJECTED') {
    return 'danger'
  }
  if (status === 'SUBMITTED') {
    return 'warning'
  }
  return 'neutral'
}

/** "Kreator pomysłów" (Szkółka): the user's own ideas, ideas submitted by others and, for experts, ideas to review. */
export function IdeasPage() {
  usePageTitle('Kreator pomysłów')
  const session = useSession()

  if (!session) {
    return <LoadingState label="Sprawdzam sesję…" />
  }

  if (!session.signedIn) {
    return (
      <div className="grid gap-8">
        <header className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Kreator pomysłów</h1>
          <p className="text-body text-text-muted">
            Kreator prowadzi od pomysłu do gotowej karty innowacji według Canvasu Szkółki innowacji.
          </p>
        </header>
        <EmptyState
          title="Zaloguj się, żeby korzystać z Kreatora"
          description="Załóż konto albo zaloguj się, żeby zapisać pomysł i zgłosić go do oceny."
          icon={Lightbulb}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <SoftButton asChild variant="primary">
                <Link to="/logowanie">Zaloguj się</Link>
              </SoftButton>
              <SoftButton asChild>
                <Link to="/rejestracja">Załóż konto</Link>
              </SoftButton>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid gap-8">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Kreator pomysłów</h1>
          <p className="text-body text-text-muted">
            Opisz pomysł na Canvasie, sprawdź podobne rozwiązania i zgłoś go do oceny ekspertów oraz ROPS.
          </p>
        </div>
        <SoftButton asChild variant="primary" icon={<Lightbulb aria-hidden />}>
          <Link to="/pomysly/nowy">Nowy pomysł</Link>
        </SoftButton>
      </header>
      <MyIdeas />
      {session.role === 'EXPERT' && <IdeasForReview />}
      <SubmittedIdeas />
    </div>
  )
}

function MyIdeas() {
  const ideas = useGetApiIdeas()

  return (
    <IdeaList
      title="Moje pomysły"
      empty="Nie masz jeszcze pomysłów."
      pending={ideas.isPending}
      error={ideas.isError ? errorMessage(ideas.error) : null}
      ideas={ideas.data?.data ?? []}
      onRetry={() => {
        void ideas.refetch()
      }}
    />
  )
}

function IdeasForReview() {
  const ideas = useGetApiIdeasForReview()

  return (
    <IdeaList
      title="Do oceny w moich obszarach"
      empty="Nie ma pomysłów czekających na ocenę."
      pending={ideas.isPending}
      error={ideas.isError ? errorMessage(ideas.error) : null}
      ideas={ideas.data?.data ?? []}
      onRetry={() => {
        void ideas.refetch()
      }}
    />
  )
}

function SubmittedIdeas() {
  const ideas = useGetApiIdeasSubmitted()
  const othersIdeas = (ideas.data?.data ?? []).filter((idea) => !idea.mine)

  return (
    <IdeaList
      title="Pomysły innych - możesz dołączyć"
      empty="Nikt inny nie zgłosił jeszcze pomysłu."
      pending={ideas.isPending}
      error={ideas.isError ? errorMessage(ideas.error) : null}
      ideas={othersIdeas}
      onRetry={() => {
        void ideas.refetch()
      }}
    />
  )
}

function IdeaList({
  title,
  empty,
  pending,
  error,
  ideas,
  onRetry,
}: {
  title: string
  empty: string
  pending: boolean
  error: string | null
  ideas: IdeaSummaryResponse[]
  onRetry: () => void
}) {
  return (
    <Section title={title}>
      {pending && <LoadingState label="Wczytuję pomysły…" />}
      {error && <ErrorState description={error} onRetry={onRetry} />}
      {!pending && !error && ideas.length === 0 && <EmptyState title={empty} icon={Lightbulb} />}
      {!pending && !error && ideas.length > 0 && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <div className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="grid min-w-0 gap-1">
                    <Link
                      to={`/pomysly/${idea.id}`}
                      className="font-medium text-text-primary underline-offset-4 hover:underline"
                    >
                      {idea.title}
                    </Link>
                    <p className="text-body-sm text-text-muted">
                      zmieniony {timeSince(idea.updatedAt)}
                      {idea.reviewedByMe ? ' · oceniony przez Ciebie' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Badge tone={statusTone(idea.status)}>{ideaStatusLabel(idea.status)}</Badge>
                    <SoftButton asChild variant="secondary">
                      <Link to={`/pomysly/${idea.id}`}>Otwórz</Link>
                    </SoftButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CeramicCard>
      )}
    </Section>
  )
}
