import { Link } from 'react-router'
import { usePostApiAuthSignOut } from '@/api/generated/castor'
import { useRefreshSession, useSession } from '@/hooks/use-session'

const linkClassName = 'font-medium text-text-primary underline-offset-4 hover:underline'

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
        <Link to="/logowanie" className={linkClassName}>
          Zaloguj się
        </Link>
        {' · '}
        <Link to="/rejestracja" className={linkClassName}>
          Załóż konto
        </Link>
      </p>
    )
  }

  return (
    <p>
      Zalogowano jako {session.email} ·{' '}
      <button
        type="button"
        className={linkClassName}
        onClick={() => signOut.mutate(undefined, { onSuccess: refreshSession })}
        disabled={signOut.isPending}
      >
        Wyloguj się
      </button>
    </p>
  )
}
