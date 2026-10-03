import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetApiAdminUsersQueryKey,
  useGetApiAdminUsers,
  useGetApiChallengeAreas,
  usePostApiAdminUsersUserIdRole,
  type MunicipalityResponse,
  type UserResponse,
} from '@/api/generated/castor'
import { MunicipalityPicker } from '@/components/MunicipalityPicker'
import { roleLabels } from '@/features/admin/labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/** Accounts and roles: an officer gets one gmina, an expert their challenge areas (SPEC 5). */
export function UsersPage() {
  usePageTitle('Użytkownicy i role')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<UserResponse | null>(null)
  const users = useGetApiAdminUsers({ Search: search || undefined })

  return (
    <>
      <h1>Użytkownicy i role</h1>
      <p>Nowa rola działa od następnego logowania użytkownika.</p>
      <label>
        Szukaj po adresie e-mail <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>

      {editing && <RoleForm user={editing} onDone={() => setEditing(null)} />}

      <table>
        <caption>Konta ({users.data?.data.length ?? 0})</caption>
        <thead>
          <tr>
            <th scope="col">E-mail</th>
            <th scope="col">Rola</th>
            <th scope="col">Gmina / obszary</th>
            <th scope="col">Akcja</th>
          </tr>
        </thead>
        <tbody>
          {(users.data?.data ?? []).map((user) => (
            <tr key={user.id}>
              <th scope="row">{user.email}</th>
              <td>{roleLabels[user.role] ?? user.role}</td>
              <td>{user.municipality?.name ?? user.challengeAreaCodes.join(', ')}</td>
              <td>
                <button type="button" onClick={() => setEditing(user)}>
                  Zmień rolę: {user.email}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function RoleForm({ user, onDone }: { user: UserResponse; onDone: () => void }) {
  const [role, setRole] = useState(user.role)
  const [municipality, setMunicipality] = useState<MunicipalityResponse | null>(null)
  const [areaCodes, setAreaCodes] = useState<string[]>(user.challengeAreaCodes)
  const areas = useGetApiChallengeAreas()
  const assign = usePostApiAdminUsersUserIdRole()
  const queryClient = useQueryClient()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    assign.mutate(
      { userId: user.id, data: { role, municipalityTeryt: municipality?.teryt ?? user.municipality?.teryt ?? null, challengeAreaCodes: areaCodes } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetApiAdminUsersQueryKey() })
          onDone()
        },
      },
    )
  }

  return (
    <section aria-labelledby="role-form-title">
      <h2 id="role-form-title">Rola: {user.email}</h2>
      <form onSubmit={submit}>
        <p>
          <label>
            Rola{' '}
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </p>
        {role === 'MUNICIPAL_OFFICER' && (
          <>
            {user.municipality && !municipality && <p>Obecna gmina: {user.municipality.name}</p>}
            <MunicipalityPicker selected={municipality} onSelect={setMunicipality} />
          </>
        )}
        {role === 'EXPERT' && (
          <fieldset>
            <legend>Obszary eksperta</legend>
            {(areas.data?.data ?? []).map((area) => (
              <label key={area.code}>
                <input
                  type="checkbox"
                  checked={areaCodes.includes(area.code)}
                  onChange={(event) => setAreaCodes(event.target.checked ? [...areaCodes, area.code] : areaCodes.filter((code) => code !== area.code))}
                />{' '}
                {area.name}
                <br />
              </label>
            ))}
          </fieldset>
        )}
        <button type="submit" disabled={assign.isPending}>
          Zapisz rolę
        </button>{' '}
        <button type="button" onClick={onDone}>
          Anuluj
        </button>
      </form>
      <div aria-live="polite">
        {assign.isError && (
          <p role="alert">
            {errorMessage(assign.error, {
              400: 'Pracownik JST potrzebuje gminy, a ekspert co najmniej jednego obszaru.',
              409: 'Nie możesz odebrać roli administratora samemu sobie.',
            })}
          </p>
        )}
      </div>
    </section>
  )
}
