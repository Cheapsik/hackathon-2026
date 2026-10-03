import { useQueryClient } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { Link } from 'react-router'
import {
  getGetApiTestsQueryKey,
  useGetApiMeTesterProfile,
  useGetApiTests,
  usePostApiTestsTargetIdSignups,
} from '@/api/generated/castor'
import { ApiError } from '@/api/castor-fetch'
import {
  Badge,
  CeramicCard,
  EmptyState,
  ErrorState,
  LoadingState,
  SoftButton,
} from '@/design-system'
import { stageLabels } from '@/features/admin/labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** Poletko: innovations and ideas looking for testers, with "Chcę testować". */
export function TestsPage() {
  usePageTitle('Poletko - testy')
  const session = useSession()
  const tests = useGetApiTests()
  const profile = useGetApiMeTesterProfile({ query: { enabled: Boolean(session?.signedIn), retry: false } })
  const signup = usePostApiTestsTargetIdSignups()
  const queryClient = useQueryClient()
  const rows = tests.data?.data ?? []
  const hasProfile = profile.isSuccess
  const profileMissing = profile.isError && profile.error instanceof ApiError && profile.error.status === 404
  const pageStatus =
    tests.isPending && !tests.data ? 'loading' : tests.isError ? 'error' : rows.length === 0 ? 'empty' : 'ready'

  function join(targetId: string, kind: string) {
    signup.mutate(
      { targetId, data: { kind } },
      { onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetApiTestsQueryKey() }) },
    )
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Poletko - testy innowacji</h1>
          <p className="text-body text-text-muted">
            Tu zgłaszasz chęć przetestowania innowacji albo pomysłu z Kreatora.
          </p>
        </div>
        {session?.signedIn ? (
          <SoftButton asChild variant={hasProfile ? 'secondary' : 'primary'}>
            <Link to="/profil-testera">{hasProfile ? 'Twój profil testera' : 'Uzupełnij profil testera'}</Link>
          </SoftButton>
        ) : (
          <SoftButton asChild variant="primary">
            <Link to="/logowanie">Zaloguj się</Link>
          </SoftButton>
        )}
      </header>

      {profileMissing && (
        <p className="text-label text-text-muted">Profil testera jest potrzebny przed pierwszym zapisem.</p>
      )}
      {signup.isError && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {errorMessage(signup.error, {
            400: 'Uzupełnij najpierw profil testera.',
            409: 'Już jesteś zapisany albo ten test nie przyjmuje zapisów.',
          })}
        </p>
      )}

      {pageStatus === 'loading' && <LoadingState label="Wczytuję testy…" />}
      {pageStatus === 'error' && (
        <ErrorState
          description={errorMessage(tests.error)}
          onRetry={() => {
            void tests.refetch()
          }}
        />
      )}
      {pageStatus === 'empty' && (
        <EmptyState title="Brak otwartych testów" description="Nikt obecnie nie szuka testerów." icon={FlaskConical} />
      )}

      {pageStatus === 'ready' && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {rows.map((row) => {
              const href = row.kind === 'IDEA' ? `/pomysly/${row.id}` : `/innowacje/${row.id}`
              return (
                <li key={`${row.kind}-${row.id}`}>
                  <div className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="grid min-w-0 gap-1">
                      <Link to={href} className="font-medium text-text-primary underline-offset-4 hover:underline">
                        {row.title}
                      </Link>
                      <p className="text-body-sm text-text-muted">
                        {row.kind === 'IDEA' ? 'Pomysł z Kreatora' : 'Innowacja'} · {stageLabels[row.stage] ?? row.stage}
                      </p>
                      {row.shortDescription && (
                        <p className="line-clamp-2 text-body-sm text-text-muted">{row.shortDescription}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      {row.signedUp ? (
                        <Badge tone="success">zapisany</Badge>
                      ) : session?.signedIn ? (
                        <SoftButton
                          type="button"
                          variant="primary"
                          loading={signup.isPending}
                          onClick={() => join(row.id, row.kind)}
                        >
                          Chcę testować
                        </SoftButton>
                      ) : null}
                      <SoftButton asChild variant="secondary">
                        <Link to={href}>Otwórz</Link>
                      </SoftButton>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </CeramicCard>
      )}
    </div>
  )
}
