import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, ScrollText } from 'lucide-react'
import { Link } from 'react-router'
import {
  getGetApiAdminGrantCallsQueryKey,
  useGetApiAdminGrantCalls,
  useGetApiChallengeAreas,
  usePostApiAdminGrantCalls,
  usePostApiAdminGrantCallsGrantCallIdClose,
  usePostApiAdminGrantCallsGrantCallIdOpen,
  usePutApiAdminGrantCallsGrantCallId,
  type GrantCallResponse,
} from '@/api/generated/castor'
import { grantCallStatusLabels } from '@/features/admin/labels'
import {
  Badge,
  CeramicCard,
  CheckboxField,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  SoftButton,
  TextAreaField,
  TextField,
  useToast,
  type BadgeProps,
} from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { linesOf } from '@/lib/format'

function statusTone(status: string): BadgeProps['tone'] {
  if (status === 'OPEN') {
    return 'success'
  }
  if (status === 'CLOSED') {
    return 'neutral'
  }
  return 'warning'
}

/** "Nabory": drafts (also from the radar's blank spots), opening and closing. An open call enables the Kreator's generator. */
export function GrantCallsPage() {
  usePageTitle('Nabory')
  const [editing, setEditing] = useState<GrantCallResponse | 'new' | null>(null)
  const queryClient = useQueryClient()
  const grantCalls = useGetApiAdminGrantCalls()
  const open = usePostApiAdminGrantCallsGrantCallIdOpen()
  const close = usePostApiAdminGrantCallsGrantCallIdClose()
  const { showToast } = useToast()
  const rows = grantCalls.data?.data ?? []
  const pageStatus =
    grantCalls.isPending && !grantCalls.data
      ? 'loading'
      : grantCalls.isError
        ? 'error'
        : rows.length === 0
          ? 'empty'
          : 'ready'

  const refresh = () => void queryClient.invalidateQueries({ queryKey: getGetApiAdminGrantCallsQueryKey() })

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Nabory</h1>
          <p className="text-body text-text-muted">
            Szkice z radaru, otwieranie i zamykanie naborów. Otwarty nabór włącza generator wniosków w Kreatorze.
          </p>
        </div>
        <SoftButton type="button" variant="primary" icon={<Plus aria-hidden />} onClick={() => setEditing('new')}>
          Nowy nabór
        </SoftButton>
      </header>

      {(open.isError || close.isError) && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {errorMessage(open.error ?? close.error, {
            400: 'Dodaj kryteria, zanim otworzysz nabór.',
            409: 'Nabór jest już w tym stanie.',
          })}
        </p>
      )}

      {pageStatus === 'loading' && <LoadingState label="Wczytuję nabory…" />}
      {pageStatus === 'error' && (
        <ErrorState
          description={errorMessage(grantCalls.error)}
          onRetry={() => {
            void grantCalls.refetch()
          }}
        />
      )}
      {pageStatus === 'empty' && (
        <EmptyState
          title="Brak naborów"
          description="Dodaj nabór albo zrób szkic z białej plamy na radarze."
          icon={ScrollText}
          action={
            <SoftButton type="button" variant="primary" onClick={() => setEditing('new')}>
              Nowy nabór
            </SoftButton>
          }
        />
      )}

      {pageStatus === 'ready' && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {rows.map((grantCall) => (
              <li key={grantCall.id}>
                <div className="grid gap-3 px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid min-w-0 gap-1">
                      <p className="text-body font-medium text-text-primary">{grantCall.title}</p>
                      <p className="text-body-sm text-text-muted">
                        {grantCall.opensOn ?? 'bez daty'} - {grantCall.closesOn ?? 'bez daty'}
                        {grantCall.criteria.length > 0 ? ` · ${grantCall.criteria.length} kryteriów` : ''}
                      </p>
                    </div>
                    <Badge tone={statusTone(grantCall.status)}>
                      {grantCallStatusLabels[grantCall.status] ?? grantCall.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SoftButton type="button" variant="secondary" onClick={() => setEditing(grantCall)}>
                      Edytuj
                    </SoftButton>
                    <SoftButton asChild variant="secondary">
                      <Link to={`/admin/nabory/${grantCall.id}/wnioski`}>Wnioski</Link>
                    </SoftButton>
                    {grantCall.status !== 'OPEN' ? (
                      <SoftButton
                        type="button"
                        variant="primary"
                        loading={open.isPending}
                        onClick={() =>
                          open.mutate(
                            { grantCallId: grantCall.id },
                            {
                              onSuccess: () => {
                                showToast({ title: 'Nabór otwarty', tone: 'success' })
                                refresh()
                              },
                            },
                          )
                        }
                      >
                        Otwórz
                      </SoftButton>
                    ) : (
                      <SoftButton
                        type="button"
                        variant="ghost"
                        loading={close.isPending}
                        onClick={() =>
                          close.mutate(
                            { grantCallId: grantCall.id },
                            {
                              onSuccess: () => {
                                showToast({ title: 'Nabór zamknięty', tone: 'neutral' })
                                refresh()
                              },
                            },
                          )
                        }
                      >
                        Zamknij
                      </SoftButton>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CeramicCard>
      )}

      {editing && (
        <GrantCallFormModal
          key={editing === 'new' ? 'new' : editing.id}
          grantCall={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function GrantCallFormModal({
  grantCall,
  onClose,
  onDone,
}: {
  grantCall?: GrantCallResponse
  onClose: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState(grantCall?.title ?? '')
  const [description, setDescription] = useState(grantCall?.description ?? '')
  const [criteria, setCriteria] = useState((grantCall?.criteria ?? []).join('\n'))
  const [opensOn, setOpensOn] = useState(grantCall?.opensOn ?? '')
  const [closesOn, setClosesOn] = useState(grantCall?.closesOn ?? '')
  const [areaCodes, setAreaCodes] = useState<string[]>(grantCall?.challengeAreaCodes ?? [])
  const areas = useGetApiChallengeAreas()
  const create = usePostApiAdminGrantCalls()
  const revise = usePutApiAdminGrantCallsGrantCallId()
  const mutation = grantCall ? revise : create
  const { showToast } = useToast()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = {
      title,
      description: description || null,
      criteria: linesOf(criteria),
      challengeAreaCodes: areaCodes,
      opensOn: opensOn || null,
      closesOn: closesOn || null,
    }

    if (grantCall) {
      revise.mutate(
        { grantCallId: grantCall.id, data },
        {
          onSuccess: () => {
            showToast({ title: 'Zapisano nabór', tone: 'success' })
            onDone()
          },
        },
      )
    } else {
      create.mutate(
        { data },
        {
          onSuccess: () => {
            showToast({ title: 'Dodano szkic naboru', tone: 'success' })
            onDone()
          },
        },
      )
    }
  }

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title={grantCall ? 'Edycja naboru' : 'Nowy nabór'}
      description={grantCall?.title}
      size="default"
      footer={
        <>
          <SoftButton type="button" variant="ghost" onClick={onClose}>
            Anuluj
          </SoftButton>
          <SoftButton type="submit" form="grant-call-form" variant="primary" loading={mutation.isPending}>
            {grantCall ? 'Zapisz nabór' : 'Dodaj szkic'}
          </SoftButton>
        </>
      }
    >
      <form id="grant-call-form" className="grid gap-5" onSubmit={submit}>
        <TextField label="Tytuł" required value={title} onChange={(event) => setTitle(event.target.value)} />
        <TextAreaField
          label="Opis"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <TextAreaField
          label="Kryteria oceny"
          hint="Jedno kryterium w wierszu."
          rows={5}
          value={criteria}
          onChange={(event) => setCriteria(event.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Otwarcie" type="date" value={opensOn} onChange={(event) => setOpensOn(event.target.value)} />
          <TextField
            label="Zamknięcie"
            type="date"
            value={closesOn}
            onChange={(event) => setClosesOn(event.target.value)}
          />
        </div>
        <fieldset className="grid gap-2 rounded-control border border-border-subtle p-4">
          <legend className="px-1 text-label font-medium text-text-muted">Obszary wyzwań</legend>
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
        {mutation.isError && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            {errorMessage(mutation.error, {
              400: 'Nabór potrzebuje tytułu, a zamknięcie musi być po otwarciu.',
            })}
          </p>
        )}
      </form>
    </Modal>
  )
}
