import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { usePostApiAuthSignIn } from '@/api/generated/castor'
import { BrandMark } from '@/components/layout/BrandMark'
import { AuthTemplate, SoftButton, TextField } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { signedInHomePath, useRefreshSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

export function SignInPage() {
  usePageTitle('Logowanie')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const signIn = usePostApiAuthSignIn()
  const refreshSession = useRefreshSession()
  const navigate = useNavigate()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    signIn.mutate(
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
      title="Logowanie"
      lead="Zobaczysz swoje zgłoszenia, pomysły i karty dopasowania."
      footer={
        <>
          Nie masz konta?{' '}
          <Link to="/rejestracja" className="font-medium text-text-primary underline underline-offset-4">
            Załóż konto
          </Link>
          .
        </>
      }
    >
      <form noValidate className="grid gap-5" onSubmit={submit}>
        {signIn.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(signIn.error, { 401: 'Nieprawidłowy adres e-mail lub hasło.' })}
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <SoftButton type="submit" variant="primary" size="lg" fullWidth loading={signIn.isPending}>
          Zaloguj się
        </SoftButton>
        <div aria-live="polite" className="min-h-5 text-center text-label text-text-muted">
          {signIn.isPending ? <output>Loguję…</output> : null}
        </div>
      </form>
    </AuthTemplate>
  )
}
