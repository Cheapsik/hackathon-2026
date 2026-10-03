import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { usePostApiAuthSignIn } from '@/api/generated/castor'
import { usePageTitle } from '@/hooks/use-page-title'
import { useRefreshSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

export function SignInPage() {
  usePageTitle('Logowanie')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const signIn = usePostApiAuthSignIn()
  const refreshSession = useRefreshSession()
  const navigate = useNavigate()
  const emailId = useId()
  const passwordId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    signIn.mutate(
      { data: { email, password } },
      {
        onSuccess: async () => {
          await refreshSession()
          navigate('/moje-zgloszenia')
        },
      },
    )
  }

  return (
    <>
      <h1>Logowanie</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor={emailId}>Adres e-mail</label>
          <br />
          <input id={emailId} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </p>
        <p>
          <label htmlFor={passwordId}>Hasło</label>
          <br />
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </p>
        <button type="submit" disabled={signIn.isPending}>
          Zaloguj się
        </button>
      </form>
      <div aria-live="polite">
        {signIn.isPending && <p><output>Loguję…</output></p>}
        {signIn.isError && (
          <p role="alert">{errorMessage(signIn.error, { 401: 'Nieprawidłowy adres e-mail lub hasło.' })}</p>
        )}
      </div>
      <p>
        Nie masz konta? <Link to="/rejestracja">Załóż konto</Link>.
      </p>
    </>
  )
}
