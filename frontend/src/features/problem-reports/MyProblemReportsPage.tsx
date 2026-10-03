import { useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  getGetApiProblemReportsMineQueryKey,
  useGetApiProblemReportsMine,
  usePostApiProblemReportsClaim,
} from '@/api/generated/castor'
import { statusLabel } from '@/features/problem-reports/status-labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** The signed-in user's reports, and claiming an anonymous one with its tracking code (once per report). */
export function MyProblemReportsPage() {
  usePageTitle('Moje zgłoszenia')
  const session = useSession()

  if (session && !session.signedIn) {
    return (
      <>
        <h1>Moje zgłoszenia</h1>
        <p>
          <Link to="/logowanie">Zaloguj się</Link>, żeby zobaczyć swoje zgłoszenia. Zgłoszenie bez konta sprawdzisz kodem
          na stronie <Link to="/sledz">Śledź zgłoszenie</Link>.
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Moje zgłoszenia</h1>
      <MyProblemReportsList />
      <ClaimProblemReportForm />
    </>
  )
}

function MyProblemReportsList() {
  const reports = useGetApiProblemReportsMine()
  const items = reports.data?.data ?? []

  return (
    <section aria-labelledby="my-reports-title">
      <h2 id="my-reports-title">Lista zgłoszeń</h2>
      <div aria-live="polite">
        {reports.isPending && <p><output>Wczytuję zgłoszenia…</output></p>}
        {reports.isError && <p role="alert">{errorMessage(reports.error)}</p>}
        {reports.isSuccess && items.length === 0 && (
          <p>
            Nie masz jeszcze zgłoszeń. <Link to="/opisz-problem">Opisz problem</Link>.
          </p>
        )}
      </div>
      {items.length > 0 && (
        <table>
          <caption>Twoje zgłoszenia, od najnowszego</caption>
          <thead>
            <tr>
              <th scope="col">Kod śledzenia</th>
              <th scope="col">Data</th>
              <th scope="col">Status</th>
              <th scope="col">Opis</th>
            </tr>
          </thead>
          <tbody>
            {items.map((report) => (
              <tr key={report.id}>
                <td>
                  <Link to={`/zgloszenie/${report.trackingCode}`}>{report.trackingCode}</Link>
                </td>
                <td>{new Date(report.createdAt).toLocaleDateString('pl-PL')}</td>
                <td>{statusLabel(report.status)}</td>
                <td>{report.description.length > 120 ? `${report.description.slice(0, 120)}…` : report.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function ClaimProblemReportForm() {
  const [code, setCode] = useState('')
  const queryClient = useQueryClient()
  const claim = usePostApiProblemReportsClaim()
  const codeId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    claim.mutate(
      { data: { trackingCode: code } },
      {
        onSuccess: () => {
          setCode('')
          void queryClient.invalidateQueries({ queryKey: getGetApiProblemReportsMineQueryKey() })
        },
      },
    )
  }

  return (
    <section aria-labelledby="claim-title">
      <h2 id="claim-title">Przypnij zgłoszenie wysłane bez konta</h2>
      <p>Podaj kod śledzenia zgłoszenia, które wysłałeś przed zalogowaniem. Każde zgłoszenie można przypiąć tylko raz.</p>
      <form onSubmit={submit}>
        <label htmlFor={codeId}>Kod śledzenia</label>{' '}
        <input id={codeId} value={code} onChange={(event) => setCode(event.target.value)} required autoComplete="off" />{' '}
        <button type="submit" disabled={claim.isPending}>
          Przypnij zgłoszenie
        </button>
      </form>
      <div aria-live="polite">
        {claim.isSuccess && <p><output>Zgłoszenie {claim.data.data.trackingCode} jest teraz na Twoim koncie.</output></p>}
        {claim.isError && (
          <p role="alert">
            {errorMessage(claim.error, {
              400: 'Kod śledzenia ma osiem znaków, np. K7QM-2XDF.',
              404: 'Nie znaleźliśmy zgłoszenia z tym kodem.',
              409: 'To zgłoszenie jest już przypisane do konta.',
            })}
          </p>
        )}
      </div>
    </section>
  )
}
