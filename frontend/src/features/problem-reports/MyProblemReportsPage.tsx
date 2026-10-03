import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { FilePlus2, MessageSquareText } from 'lucide-react'
import {
  getGetApiProblemReportsMineQueryKey,
  useGetApiProblemReportsMine,
  usePostApiProblemReportsClaim,
  type ProblemReportSummaryResponse,
} from '@/api/generated/castor'
import {
  Badge,
  CeramicCard,
  EmptyState,
  ErrorState,
  LoadingState,
  Section,
  SoftButton,
  TextField,
  ListRow,
  type BadgeProps,
} from '@/design-system'
import { statusLabel } from '@/features/problem-reports/status-labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

function statusTone(status: string): BadgeProps['tone'] {
  switch (status) {
    case 'ANSWERED':
      return 'success'
    case 'IN_ANALYSIS':
    case 'WITH_EXPERT':
      return 'warning'
    case 'CLOSED':
      return 'neutral'
    default:
      return 'strong'
  }
}

/** The signed-in user's reports, and claiming an anonymous one with its tracking code (once per report). */
export function MyProblemReportsPage() {
  usePageTitle('Moje zgłoszenia')
  const session = useSession()

  if (!session) {
    return <LoadingState label="Sprawdzam sesję…" />
  }

  if (!session.signedIn) {
    return (
      <div className="grid gap-8">
        <header className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Moje zgłoszenia</h1>
          <p className="text-body text-text-muted">
            Po zalogowaniu zobaczysz listę swoich zgłoszeń. Bez konta sprawdzisz status kodem na stronie Śledź
            zgłoszenie.
          </p>
        </header>
        <EmptyState
          title="Zaloguj się, żeby zobaczyć zgłoszenia"
          description="Zgłoszenie wysłane bez konta nadal możesz sprawdzić kodem śledzenia."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <SoftButton asChild variant="primary">
                <Link to="/logowanie">Zaloguj się</Link>
              </SoftButton>
              <SoftButton asChild>
                <Link to="/sledz">Śledź zgłoszenie</Link>
              </SoftButton>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid gap-8">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Moje zgłoszenia</h1>
          <p className="text-body text-text-muted">
            Statusy, dopasowania i wątki Twoich zgłoszeń. Tu też przypniesz zgłoszenie wysłane wcześniej bez konta.
          </p>
        </div>
        <SoftButton asChild variant="primary" icon={<MessageSquareText aria-hidden />}>
          <Link to="/opisz-problem">Opisz problem</Link>
        </SoftButton>
      </header>

      <MyProblemReportsList />
      <ClaimProblemReportForm />
    </div>
  )
}

function MyProblemReportsList() {
  const reports = useGetApiProblemReportsMine()
  const items = reports.data?.data ?? []

  return (
    <Section title="Lista zgłoszeń" description="Od najnowszego. Kliknij wiersz, żeby otworzyć szczegóły.">
      {reports.isPending && <LoadingState label="Wczytuję zgłoszenia…" />}
      {reports.isError && (
        <ErrorState title="Nie udało się wczytać zgłoszeń" description={errorMessage(reports.error)} />
      )}
      {reports.isSuccess && items.length === 0 && (
        <EmptyState
          title="Nie masz jeszcze zgłoszeń"
          description="Opisz problem własnymi słowami. Podpowiemy innowacje z Biblioteki ROPS."
          icon={FilePlus2}
          action={
            <SoftButton asChild variant="primary">
              <Link to="/opisz-problem">Opisz problem</Link>
            </SoftButton>
          }
          className="py-6"
        />
      )}
      {items.length > 0 && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {items.map((report) => (
              <li key={report.id}>
                <ReportRow report={report} />
              </li>
            ))}
          </ul>
        </CeramicCard>
      )}
    </Section>
  )
}

function ReportRow({ report }: { report: ProblemReportSummaryResponse }) {
  const date = new Date(report.createdAt).toLocaleDateString('pl-PL')
  const excerpt =
    report.description.length > 120 ? `${report.description.slice(0, 120)}…` : report.description

  return (
    <ListRow
      to={`/zgloszenie/${report.trackingCode}`}
      title={report.trackingCode}
      description={`${date} · ${excerpt}`}
      trailing={<Badge tone={statusTone(report.status)}>{statusLabel(report.status)}</Badge>}
    />
  )
}

function ClaimProblemReportForm() {
  const [code, setCode] = useState('')
  const queryClient = useQueryClient()
  const claim = usePostApiProblemReportsClaim()

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
    <Section
      title="Przypnij zgłoszenie wysłane bez konta"
      description="Podaj kod śledzenia zgłoszenia z czasu przed założeniem konta. Każde zgłoszenie można przypiąć tylko raz."
    >
      <CeramicCard padding="lg" className="grid gap-4">
        <form
          noValidate
          onSubmit={submit}
          className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        >
          <TextField
            label="Kod śledzenia"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            autoComplete="off"
            placeholder="Np. K7QM-2XDF"
            hint="Osiem znaków z potwierdzenia zgłoszenia."
          />
          <SoftButton type="submit" variant="primary" loading={claim.isPending} className="sm:mb-0.5">
            Przypnij zgłoszenie
          </SoftButton>
        </form>

        <div aria-live="polite" className="grid gap-2">
          {claim.isSuccess && (
            <p className="rounded-control bg-success-soft p-3 text-body-sm text-success">
              <output>Zgłoszenie {claim.data.data.trackingCode} jest teraz na Twoim koncie.</output>
            </p>
          )}
          {claim.isError && (
            <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
              {errorMessage(claim.error, {
                400: 'Kod śledzenia ma osiem znaków, np. K7QM-2XDF.',
                404: 'Nie znaleźliśmy zgłoszenia z tym kodem.',
                409: 'To zgłoszenie jest już przypisane do konta.',
              })}
            </p>
          )}
        </div>
      </CeramicCard>
    </Section>
  )
}
