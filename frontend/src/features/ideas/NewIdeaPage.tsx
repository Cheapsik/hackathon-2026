import { Link, useNavigate } from 'react-router'
import { usePostApiIdeas } from '@/api/generated/castor'
import { canvasRequestOf, emptyCanvas } from '@/features/ideas/canvas-values'
import { IdeaCanvasForm } from '@/features/ideas/IdeaCanvasForm'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** A new card in the Kreator: saved as a draft, which only its authors see until they submit it. */
export function NewIdeaPage() {
  usePageTitle('Nowy pomysł')
  const session = useSession()
  const navigate = useNavigate()
  const create = usePostApiIdeas()

  if (session && !session.signedIn) {
    return (
      <>
        <h1>Nowy pomysł</h1>
        <p>
          Aby zapisać pomysł, <Link to="/logowanie">zaloguj się</Link> albo <Link to="/rejestracja">załóż konto</Link>.
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Nowy pomysł</h1>
      <p>
        Wypełnij Canvas innowacji. Do zapisania szkicu wystarczy nazwa; resztę uzupełnisz później. Szkic widzisz tylko Ty
        i współautorzy — inni zobaczą pomysł dopiero, gdy go zgłosisz.
      </p>
      <div aria-live="polite">
        {create.isError && <p role="alert">{errorMessage(create.error, { 400: 'Sprawdź pola formularza: nazwa jest wymagana, a obszary — najwyżej trzy.' })}</p>}
      </div>
      <IdeaCanvasForm
        initial={emptyCanvas}
        submitLabel="Zapisz szkic"
        pending={create.isPending}
        onSubmit={(values) => create.mutate({ data: canvasRequestOf(values) }, { onSuccess: (response) => navigate(`/pomysly/${response.data.id}`) })}
      />
    </>
  )
}
