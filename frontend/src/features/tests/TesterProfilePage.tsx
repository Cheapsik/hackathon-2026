import { useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  getGetApiMeTesterProfileQueryKey,
  useGetApiMeTesterProfile,
  usePutApiMeTesterProfile,
  type MunicipalityResponse,
  type TesterProfileResponse,
} from '@/api/generated/castor'
import { ApiError } from '@/api/castor-fetch'
import { MunicipalityPicker } from '@/components/MunicipalityPicker'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'

/** The tester profile filled once and reused on every "Chcę testować". */
export function TesterProfilePage() {
  usePageTitle('Profil testera')
  const session = useSession()
  const profile = useGetApiMeTesterProfile({ query: { enabled: Boolean(session?.signedIn), retry: false } })

  if (!session) {
    return (
      <p>
        <output>Sprawdzam sesję…</output>
      </p>
    )
  }

  if (!session.signedIn) {
    return (
      <>
        <h1>Profil testera</h1>
        <p>
          Aby zapisać profil testera, <Link to="/logowanie">zaloguj się</Link>.
        </p>
      </>
    )
  }

  const missing = profile.isError && profile.error instanceof ApiError && profile.error.status === 404

  return (
    <>
      <p>
        <Link to="/testy">Poletko — testy</Link>
      </p>
      <h1>Profil testera</h1>
      <p>Wiek, gmina, potrzeby dostępności i sprzęt zapisujesz raz. Przy kolejnym zapisie na test użyjemy tego samego profilu.</p>
      {profile.isPending && (
        <p>
          <output>Wczytuję profil…</output>
        </p>
      )}
      {profile.isError && !missing && <p role="alert">{errorMessage(profile.error)}</p>}
      {(profile.isSuccess || missing) && (
        <TesterProfileForm
          initial={profile.data?.data}
          suggestedTeryt={session.municipalityTeryt}
          onSaved={() => undefined}
        />
      )}
    </>
  )
}

export function TesterProfileForm({
  initial,
  suggestedTeryt,
  onSaved,
}: {
  initial?: TesterProfileResponse
  suggestedTeryt: string | null
  onSaved: (profile: TesterProfileResponse) => void
}) {
  const [age, setAge] = useState(initial ? String(initial.age) : '')
  const [needs, setNeeds] = useState(initial?.accessibilityNeeds ?? '')
  const [equipment, setEquipment] = useState(initial?.equipment ?? '')
  const [municipality, setMunicipality] = useState<MunicipalityResponse | null>(
    initial
      ? { teryt: initial.municipalityTeryt, name: initial.municipalityName, qualifiedName: initial.municipalityName, type: '', powiat: '' }
      : null,
  )
  const queryClient = useQueryClient()
  const save = usePutApiMeTesterProfile()
  const ageId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!municipality) {
      return
    }

    save.mutate(
      {
        data: {
          age: Number(age),
          municipalityTeryt: municipality.teryt,
          accessibilityNeeds: needs || null,
          equipment: equipment || null,
        },
      },
      {
        onSuccess: (response) => {
          queryClient.setQueryData(getGetApiMeTesterProfileQueryKey(), response)
          onSaved(response.data)
        },
      },
    )
  }

  return (
    <form onSubmit={submit}>
      {!municipality && suggestedTeryt && <p>Możesz wybrać swoją gminę z konta albo inną.</p>}
      <MunicipalityPicker selected={municipality} onSelect={setMunicipality} />
      <p>
        <label htmlFor={ageId}>Wiek</label>
        <br />
        <input id={ageId} type="number" min={13} max={120} required value={age} onChange={(event) => setAge(event.target.value)} />
      </p>
      <p>
        <label>
          Potrzeby dostępności
          <br />
          <textarea rows={3} cols={60} maxLength={1000} value={needs} onChange={(event) => setNeeds(event.target.value)} />
        </label>
      </p>
      <p>
        <label>
          Sprzęt, którym dysponujesz
          <br />
          <textarea rows={3} cols={60} maxLength={1000} value={equipment} onChange={(event) => setEquipment(event.target.value)} />
        </label>
      </p>
      <button type="submit" disabled={save.isPending || !municipality}>
        Zapisz profil testera
      </button>
      <div aria-live="polite">
        {save.isError && <p role="alert">{errorMessage(save.error, { 400: 'Podaj wiek od 13 do 120 lat i wybierz gminę.', 404: 'Nie znaleźliśmy tej gminy.' })}</p>}
        {save.isSuccess && <p>Profil zapisany.</p>}
      </div>
    </form>
  )
}
