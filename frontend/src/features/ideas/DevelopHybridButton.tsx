import { Link, useNavigate } from 'react-router'
import { usePostApiIdeasFromHybrid } from '@/api/generated/castor'
import { SoftButton } from '@/design-system'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

interface DevelopHybridButtonProps {
  problemReportId: string
  /** A report sent without an account is opened with its code, so the code proves it is the visitor's. */
  trackingCode: string
}

/** "Rozwiń w Kreatorze": the hybrid of a report becomes a draft idea of the signed-in user. */
export function DevelopHybridButton({ problemReportId, trackingCode }: DevelopHybridButtonProps) {
  const session = useSession()
  const navigate = useNavigate()
  const develop = usePostApiIdeasFromHybrid()

  if (!session) {
    return null
  }

  if (!session.signedIn) {
    return (
      <p className="text-body text-text-muted">
        Chcesz rozwinąć tę krzyżówkę w pomysł?{' '}
        <Link to="/logowanie" className="font-medium text-text-primary underline underline-offset-4 hover:no-underline">
          Zaloguj się
        </Link>
        , a potem wróć do zgłoszenia.
      </p>
    )
  }

  return (
    <div className="grid justify-items-start gap-3">
      <SoftButton
        variant="secondary"
        loading={develop.isPending}
        onClick={() =>
          develop.mutate(
            { data: { problemReportId }, headers: { 'X-Tracking-Code': trackingCode } },
            { onSuccess: (response) => navigate(`/pomysly/${response.data.id}`) },
          )
        }
      >
        Rozwiń w Kreatorze pomysłów
      </SoftButton>
      <div aria-live="polite">
        {develop.isError && (
          <p role="alert" className="text-body-sm font-medium text-danger">
            {errorMessage(develop.error, {
              404: 'Nie znaleźliśmy tego zgłoszenia.',
              409: 'To zgłoszenie nie ma krzyżówki.',
            })}
          </p>
        )}
      </div>
    </div>
  )
}
