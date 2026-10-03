import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { usePostApiAuthRegister } from '@/api/generated/castor'
import { usePageTitle } from '@/hooks/use-page-title'
import { useRefreshSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

const passwordMinLength = 8

export function RegisterPage() {
  usePageTitle('Załóż konto')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = usePostApiAuthRegister()
  const refreshSession = useRefreshSession()
  const navigate = useNavigate()
  const emailId = useId()
  const passwordId = useId()
  const passwordHintId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    register.mutate(
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
      <h1>Załóż konto</h1>
      <p>Konto pozwala zebrać swoje zgłoszenia w jednym miejscu. Zgłosić problem możesz też bez konta.</p>
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
            autoComplete="new-password"
            required
            minLength={passwordMinLength}
            aria-describedby={passwordHintId}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <br />
          <span id={passwordHintId}>Co najmniej {passwordMinLength} znaków.</span>
        </p>
        <button type="submit" disabled={register.isPending}>
          Załóż konto
        </button>
      </form>
      <div aria-live="polite">
        {register.isPending && <p><output>Zakładam konto…</output></p>}
        {register.isError && (
          <p role="alert">
            {errorMessage(register.error, {
              400: `Podaj poprawny adres e-mail i hasło o długości co najmniej ${passwordMinLength} znaków.`,
              409: 'Konto z tym adresem e-mail już istnieje. Zaloguj się.',
            })}
          </p>
        )}
      </div>
      <p>
        Masz już konto? <Link to="/logowanie">Zaloguj się</Link>.
      </p>
    </>
  )
}
