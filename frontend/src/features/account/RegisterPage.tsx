import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { usePostApiAuthRegister } from '@/api/generated/castor'
import { BrandMark } from '@/components/layout/BrandMark'
import { AuthTemplate, SoftButton, TextField } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { signedInHomePath, useRefreshSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

const passwordMinLength = 8

export function RegisterPage() {
  usePageTitle('Załóż konto')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = usePostApiAuthRegister()
  const refreshSession = useRefreshSession()
  const navigate = useNavigate()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    register.mutate(
      { data: { email, password } },
      {
        onSuccess: async () => {
          const session = await refreshSession()
          navigate(signedInHomePath(session))
        },
      },
    )
  }

  return (
    <AuthTemplate
      brand={<BrandMark variant="mark" />}
      title="Załóż konto"
      lead="Konto zbiera Twoje zgłoszenia w jednym miejscu. Problem możesz zgłosić też bez konta."
      footer={
        <>
          Masz już konto?{' '}
          <Link to="/logowanie" className="font-medium text-text-primary underline underline-offset-4">
            Zaloguj się
          </Link>
          .
        </>
      }
    >
      <form noValidate className="grid gap-5" onSubmit={submit}>
        {register.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(register.error, {
              400: `Podaj poprawny adres e-mail i hasło o długości co najmniej ${passwordMinLength} znaków.`,
              409: 'Konto z tym adresem e-mail już istnieje. Zaloguj się.',
            })}
          </p>
        )}
        <TextField
          label="Adres e-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Hasło"
          type="password"
          autoComplete="new-password"
          required
          minLength={passwordMinLength}
          hint={`Co najmniej ${passwordMinLength} znaków.`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <SoftButton type="submit" variant="primary" size="lg" fullWidth loading={register.isPending}>
          Załóż konto
        </SoftButton>
        <div aria-live="polite" className="min-h-5 text-center text-label text-text-muted">
          {register.isPending ? <output>Zakładam konto…</output> : null}
        </div>
      </form>
    </AuthTemplate>
  )
}
