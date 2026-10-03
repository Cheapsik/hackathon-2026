import { useDeferredValue, useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownAZ, ArrowUpAZ, Users } from 'lucide-react'
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
import {
  Badge,
  CeramicCard,
  CheckboxField,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  SearchAndFilters,
  SelectField,
  SoftButton,
  useToast,
} from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

const roleOptions = [
  { value: 'RESIDENT', label: roleLabels.RESIDENT },
  { value: 'MUNICIPAL_OFFICER', label: roleLabels.MUNICIPAL_OFFICER },
  { value: 'EXPERT', label: roleLabels.EXPERT },
  { value: 'ADMIN', label: roleLabels.ADMIN },
] as const

const roleFilterOptions = roleOptions.map((option) => ({ value: option.value, label: option.label }))

type EmailSort = 'asc' | 'desc'

/** Accounts and roles: an officer gets one gmina, an expert their challenge areas (SPEC 5). */
export function UsersPage() {
  usePageTitle('Użytkownicy i role')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [emailSort, setEmailSort] = useState<EmailSort>('asc')
  const [editing, setEditing] = useState<UserResponse | null>(null)
  const deferredSearch = useDeferredValue(search.trim())
  const areas = useGetApiChallengeAreas()
  const users = useGetApiAdminUsers({
    Search: deferredSearch || undefined,
    Role: roleFilter || undefined,
  })
  const areaNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const area of areas.data?.data ?? []) {
      map.set(area.code, area.name)
    }
    return map
  }, [areas.data?.data])

  const rows = useMemo(() => {
    const list = [...(users.data?.data ?? [])]
    list.sort((left, right) => {
      const compared = left.email.localeCompare(right.email, 'pl')
      return emailSort === 'asc' ? compared : -compared
    })
    return list
  }, [users.data?.data, emailSort])

  const status = users.isPending && !users.data ? 'loading' : users.isError ? 'error' : rows.length === 0 ? 'empty' : 'ready'

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Użytkownicy i role</h1>
          <p className="text-body text-text-muted">
            Nowa rola działa od następnego logowania użytkownika. Szukaj i sortuj po adresie e-mail.
          </p>
        </div>
        <SoftButton
          type="button"
          variant="secondary"
          icon={emailSort === 'asc' ? <ArrowDownAZ aria-hidden /> : <ArrowUpAZ aria-hidden />}
          onClick={() => setEmailSort((current) => (current === 'asc' ? 'desc' : 'asc'))}
        >
          E-mail {emailSort === 'asc' ? 'A-Z' : 'Z-A'}
        </SoftButton>
      </header>

      <SearchAndFilters
        searchLabel="Szukaj po adresie e-mail"
        placeholder="np. anna@gmina.pl"
        query={search}
        onQueryChange={setSearch}
        searching={users.isFetching}
        resultSummary={
          users.isFetching
            ? 'Szukam…'
            : status === 'ready'
              ? `Konta: ${rows.length}`
              : status === 'empty'
                ? 'Brak kont dla tego wyszukiwania.'
                : null
        }
        filters={
          <SelectField
            label="Rola"
            value={roleFilter}
            placeholder="wszystkie role"
            options={roleFilterOptions}
            onChange={(event) => setRoleFilter(event.target.value)}
          />
        }
      />

      {status === 'loading' && <LoadingState label="Wczytuję konta…" />}
      {status === 'error' && (
        <ErrorState
          description={errorMessage(users.error)}
          onRetry={() => {
            void users.refetch()
          }}
        />
      )}
      {status === 'empty' && (
        <EmptyState
          title="Brak kont"
          description={
            deferredSearch || roleFilter
              ? 'Zmień wyszukiwanie albo filtr roli.'
              : 'Na liście pojawią się konta po rejestracji użytkowników.'
          }
          icon={Users}
        />
      )}

      {status === 'ready' && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {rows.map((user) => (
              <li key={user.id}>
                <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid min-w-0 gap-1">
                    <p className="truncate text-body font-medium text-text-primary">{user.email}</p>
                    <p className="text-body-sm text-text-muted">{assignmentSummary(user, areaNames)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{roleLabels[user.role] ?? user.role}</Badge>
                    <SoftButton type="button" variant="secondary" onClick={() => setEditing(user)}>
                      Zmień rolę
                    </SoftButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CeramicCard>
      )}

      {editing && (
        <RoleFormModal
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function assignmentSummary(user: UserResponse, areaNames: Map<string, string>): string {
  if (user.municipality?.name) {
    return user.municipality.name
  }
  if (user.challengeAreaCodes.length > 0) {
    return user.challengeAreaCodes.map((code) => areaNames.get(code) ?? code).join(', ')
  }
  return 'Bez gminy i obszarów'
}

function RoleFormModal({ user, onClose }: { user: UserResponse; onClose: () => void }) {
  const [role, setRole] = useState(user.role)
  const [municipality, setMunicipality] = useState<MunicipalityResponse | null>(null)
  const [areaCodes, setAreaCodes] = useState<string[]>(user.challengeAreaCodes)
  const areas = useGetApiChallengeAreas()
  const assign = usePostApiAdminUsersUserIdRole()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    assign.mutate(
      {
        userId: user.id,
        data: {
          role,
          municipalityTeryt: municipality?.teryt ?? user.municipality?.teryt ?? null,
          challengeAreaCodes: areaCodes,
        },
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetApiAdminUsersQueryKey() })
          showToast({
            title: 'Zapisano rolę',
            description: `${user.email}: ${roleLabels[role] ?? role}. Działa od następnego logowania.`,
            tone: 'success',
          })
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title="Zmiana roli"
      description={user.email}
      size="default"
      footer={
        <>
          <SoftButton type="button" variant="ghost" onClick={onClose}>
            Anuluj
          </SoftButton>
          <SoftButton type="submit" form="admin-role-form" variant="primary" loading={assign.isPending}>
            Zapisz rolę
          </SoftButton>
        </>
      }
    >
      <form id="admin-role-form" className="grid gap-5" onSubmit={submit}>
        <SelectField
          label="Rola"
          value={role}
          options={[...roleOptions]}
          onChange={(event) => setRole(event.target.value)}
        />

        {role === 'MUNICIPAL_OFFICER' && (
          <div className="grid gap-3 rounded-control border border-border-subtle p-4">
            {user.municipality && !municipality && (
              <p className="text-body-sm text-text-muted">Obecna gmina: {user.municipality.name}</p>
            )}
            <MunicipalityPicker selected={municipality} onSelect={setMunicipality} />
          </div>
        )}

        {role === 'EXPERT' && (
          <fieldset className="grid gap-2 rounded-control border border-border-subtle p-4">
            <legend className="px-1 text-label font-medium text-text-muted">Obszary eksperta</legend>
            {(areas.data?.data ?? []).map((area) => (
              <CheckboxField
                key={area.code}
                label={area.name}
                checked={areaCodes.includes(area.code)}
                onChange={(event) =>
                  setAreaCodes(
                    event.target.checked
                      ? [...areaCodes, area.code]
                      : areaCodes.filter((code) => code !== area.code),
                  )
                }
              />
            ))}
          </fieldset>
        )}

        {assign.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(assign.error, {
              400: 'Pracownik JST potrzebuje gminy, a ekspert co najmniej jednego obszaru.',
              409: 'Nie możesz odebrać roli administratora samemu sobie.',
            })}
          </p>
        )}
      </form>
    </Modal>
  )
}
