import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  getGetApiTestsQueryKey,
  useGetApiMeTesterProfile,
  useGetApiTests,
  usePostApiTestsTargetIdSignups,
} from '@/api/generated/castor'
import { ApiError } from '@/api/castor-fetch'
import { stageLabels } from '@/features/admin/labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** Poletko: innovations and ideas looking for testers, with "Chcę testować". */
export function TestsPage() {
  usePageTitle('Poletko — testy')
  const session = useSession()
  const tests = useGetApiTests()
  const profile = useGetApiMeTesterProfile({ query: { enabled: Boolean(session?.signedIn), retry: false } })
  const signup = usePostApiTestsTargetIdSignups()
  const queryClient = useQueryClient()
  const rows = tests.data?.data ?? []
  const hasProfile = profile.isSuccess
  const profileMissing = profile.isError && profile.error instanceof ApiError && profile.error.status === 404

  function join(targetId: string, kind: string) {
    signup.mutate(
      { targetId, data: { kind } },
      { onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetApiTestsQueryKey() }) },
    )
  }

  return (
    <>
      <h1>Poletko — testy innowacji</h1>
      <p>Tu zgłaszasz chęć przetestowania innowacji albo pomysłu z Kreatora. Zespół szuka osób do pierwszej próby.</p>
      {session?.signedIn ? (
        <p>
          <Link to="/profil-testera">{hasProfile ? 'Twój profil testera' : 'Uzupełnij profil testera'}</Link>
          {profileMissing && ' — potrzebny przed pierwszym zapisem.'}
        </p>
      ) : (
        <p>
          Aby się zapisać, <Link to="/logowanie">zaloguj się</Link>. Listę możesz oglądać bez konta.
        </p>
      )}

      <div aria-live="polite">
        {tests.isPending && (
          <p>
            <output>Wczytuję testy…</output>
          </p>
        )}
        {tests.isError && <p role="alert">{errorMessage(tests.error)}</p>}
        {tests.isSuccess && rows.length === 0 && <p>Nikt obecnie nie szuka testerów.</p>}
        {signup.isError && (
          <p role="alert">
            {errorMessage(signup.error, {
              400: 'Uzupełnij najpierw profil testera.',
              409: 'Już jesteś zapisany albo ten test nie przyjmuje zapisów.',
            })}
          </p>
        )}
        {signup.isSuccess && <p>Zapisano na test.</p>}
      </div>

      <ul>
        {rows.map((row) => {
          const href = row.kind === 'IDEA' ? `/pomysly/${row.id}` : `/innowacje/${row.id}`
          return (
            <li key={`${row.kind}-${row.id}`}>
              <article>
                <h2>
                  <Link to={href}>{row.title}</Link>
                </h2>
                <p>
                  {row.kind === 'IDEA' ? 'Pomysł z Kreatora' : 'Innowacja'} · {stageLabels[row.stage] ?? row.stage}
                </p>
                {row.shortDescription && <p>{row.shortDescription}</p>}
                {session?.signedIn &&
                  (row.signedUp ? (
                    <p>Jesteś zapisany na ten test.</p>
                  ) : (
                    <button type="button" disabled={signup.isPending} onClick={() => join(row.id, row.kind)}>
                      Chcę testować „{row.title}”
                    </button>
                  ))}
              </article>
            </li>
          )
        })}
      </ul>
    </>
  )
}
