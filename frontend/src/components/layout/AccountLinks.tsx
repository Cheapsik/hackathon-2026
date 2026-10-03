import { Link } from 'react-router'
import { usePostApiAuthSignOut } from '@/api/generated/castor'
import { useRefreshSession, useSession } from '@/hooks/use-session'

/** Sign-in and registration for a visitor; the e-mail and "Wyloguj się" for a signed-in user. */
export function AccountLinks() {
  const session = useSession()
  const signOut = usePostApiAuthSignOut()
  const refreshSession = useRefreshSession()

  if (!session) {
    return null
  }

  if (!session.signedIn) {
    return (
      <p>
        <Link to="/logowanie">Zaloguj się</Link> · <Link to="/rejestracja">Załóż konto</Link>
      </p>
    )
  }

  return (
    <p>
      Zalogowano jako {session.email} ·{' '}
      <button type="button" onClick={() => signOut.mutate(undefined, { onSuccess: refreshSession })} disabled={signOut.isPending}>
        Wyloguj się
      </button>
    </p>
  )
}
