import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { linesOf } from '@/lib/format'

/** "Nabory": drafts (also from the radar's blank spots), opening and closing. An open call enables the Kreator's generator. */
export function GrantCallsPage() {
  usePageTitle('Nabory')
  const [editing, setEditing] = useState<GrantCallResponse | 'new' | null>(null)
  const queryClient = useQueryClient()
  const grantCalls = useGetApiAdminGrantCalls()
  const open = usePostApiAdminGrantCallsGrantCallIdOpen()
  const close = usePostApiAdminGrantCallsGrantCallIdClose()
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetApiAdminGrantCallsQueryKey() })

  return (
    <>
      <h1>Nabory</h1>
      <p>
        <button type="button" onClick={() => setEditing('new')}>
          Nowy nabór
        </button>
      </p>
      <div aria-live="polite">
        {(open.isError || close.isError) && (
          <p role="alert">{errorMessage(open.error ?? close.error, { 400: 'Dodaj kryteria, zanim otworzysz nabór.', 409: 'Nabór jest już w tym stanie.' })}</p>
        )}
      </div>

      {editing && <GrantCallForm grantCall={editing === 'new' ? undefined : editing} onDone={() => { setEditing(null); void refresh() }} />}

      <table>
        <caption>Nabory ({grantCalls.data?.data.length ?? 0})</caption>
        <thead>
          <tr>
            <th scope="col">Tytuł</th>
            <th scope="col">Status</th>
            <th scope="col">Termin</th>
            <th scope="col">Kryteria</th>
            <th scope="col">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {(grantCalls.data?.data ?? []).map((grantCall) => (
            <tr key={grantCall.id}>
              <th scope="row">{grantCall.title}</th>
              <td>{grantCallStatusLabels[grantCall.status]}</td>
              <td>
                {grantCall.opensOn ?? '—'} – {grantCall.closesOn ?? '—'}
              </td>
              <td>
                <ul>
                  {grantCall.criteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
              </td>
              <td>
                <button type="button" onClick={() => setEditing(grantCall)}>
                  Edytuj „{grantCall.title}”
                </button>{' '}
                {grantCall.status !== 'OPEN' ? (
                  <button type="button" onClick={() => open.mutate({ grantCallId: grantCall.id }, { onSuccess: refresh })} disabled={open.isPending}>
                    Otwórz nabór
                  </button>
                ) : (
                  <button type="button" onClick={() => close.mutate({ grantCallId: grantCall.id }, { onSuccess: refresh })} disabled={close.isPending}>
                    Zamknij nabór
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function GrantCallForm({ grantCall, onDone }: { grantCall?: GrantCallResponse; onDone: () => void }) {
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
      revise.mutate({ grantCallId: grantCall.id, data }, { onSuccess: onDone })
    } else {
      create.mutate({ data }, { onSuccess: onDone })
    }
  }

  return (
    <section aria-labelledby="grant-call-form-title">
      <h2 id="grant-call-form-title">{grantCall ? `Edycja: ${grantCall.title}` : 'Nowy nabór'}</h2>
      <form onSubmit={submit}>
        <p>
          <label>
            Tytuł <input size={70} required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Opis
            <br />
            <textarea rows={5} cols={70} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Kryteria oceny (jedno w wierszu)
            <br />
            <textarea rows={6} cols={70} value={criteria} onChange={(event) => setCriteria(event.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Otwarcie <input type="date" value={opensOn} onChange={(event) => setOpensOn(event.target.value)} />
          </label>{' '}
          <label>
            Zamknięcie <input type="date" value={closesOn} onChange={(event) => setClosesOn(event.target.value)} />
          </label>
        </p>
        <fieldset>
          <legend>Obszary wyzwań</legend>
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
        <button type="submit" disabled={mutation.isPending}>
          {grantCall ? 'Zapisz nabór' : 'Dodaj nabór (jako szkic)'}
        </button>{' '}
        <button type="button" onClick={onDone}>
          Anuluj
        </button>
      </form>
      <div aria-live="polite">
        {mutation.isError && <p role="alert">{errorMessage(mutation.error, { 400: 'Nabór potrzebuje tytułu, a zamknięcie musi być po otwarciu.' })}</p>}
      </div>
    </section>
  )
}
