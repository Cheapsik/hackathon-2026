import { Link } from 'react-router'
import { usePostApiAuthSignOut } from '@/api/generated/castor'
import { useRefreshSession, useSession } from '@/hooks/use-session'

const linkClassName = 'font-medium text-text-primary underline underline-offset-4 hover:no-underline'

/** Sign-in and registration for a visitor; the e-mail and "Wyloguj się" for a signed-in user. Phone menu. */
export function AccountLinks() {
  const session = useSession()
  const signOut = usePostApiAuthSignOut()
  const refreshSession = useRefreshSession()

  if (!session) {
    return null
  }

  if (!session.signedIn) {
    return (
      <p className="flex flex-wrap gap-x-6 gap-y-2">
        <Link to="/logowanie" className={linkClassName}>
          Zaloguj się
        </Link>
        <Link to="/rejestracja" className={linkClassName}>
          Załóż konto
        </Link>
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      <p>
        Zalogowano jako <span className="font-medium text-text-primary">{session.email}</span>
      </p>
      <p>
        <button
          type="button"
          className={linkClassName}
          onClick={() => signOut.mutate(undefined, { onSuccess: refreshSession })}
          disabled={signOut.isPending}
        >
          Wyloguj się
        </button>
      </p>
    </div>
  )
}
