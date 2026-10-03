import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetApiAdminChallengeAreasCodePlainTextQueryKey,
  getGetApiAdminInnovationsInnovationIdPlainTextQueryKey,
  useGetApiAdminChallengeAreasCodePlainText,
  useGetApiAdminInnovationsInnovationIdPlainText,
  useGetApiChallengeAreas,
  usePostApiAdminChallengeAreasCodePlainText,
  usePostApiAdminChallengeAreasCodePlainTextApprove,
  usePostApiAdminInnovationsInnovationIdPlainText,
  usePostApiAdminInnovationsInnovationIdPlainTextApprove,
  usePutApiAdminChallengeAreasCodePlainText,
  usePutApiAdminInnovationsInnovationIdPlainText,
  type PlainTextResponse,
} from '@/api/generated/castor'
import { ApiError } from '@/api/castor-fetch'
import { errorMessage } from '@/lib/error-message'

/** Draft and approval of one innovation's "Prościej" text. Editing the card clears it. */
export function InnovationPlainLanguage({ innovationId }: { innovationId: string }) {
  const queryClient = useQueryClient()
  const current = useGetApiAdminInnovationsInnovationIdPlainText(innovationId, { query: { retry: false } })
  const generate = usePostApiAdminInnovationsInnovationIdPlainText()
  const revise = usePutApiAdminInnovationsInnovationIdPlainText()
  const approve = usePostApiAdminInnovationsInnovationIdPlainTextApprove()
  const key = getGetApiAdminInnovationsInnovationIdPlainTextQueryKey(innovationId)

  return (
    <PlainLanguageForm
      heading="Prościej"
      explanation="Tekst łatwy do czytania. Na karcie innowacji pojawi się dopiero po zatwierdzeniu. Zapis karty usuwa go, bo opisuje starą treść."
      stored={current.data?.data}
      missing={current.isError && isMissing(current.error)}
      loading={current.isPending}
      busy={generate.isPending || revise.isPending || approve.isPending}
      failure={generate.error ?? revise.error ?? approve.error}
      onGenerate={() => generate.mutate({ innovationId }, { onSuccess: (response) => queryClient.setQueryData(key, response) })}
      onSave={(text) => revise.mutate({ innovationId, data: { text } }, { onSuccess: (response) => queryClient.setQueryData(key, response) })}
      onApprove={() => approve.mutate({ innovationId }, { onSuccess: (response) => queryClient.setQueryData(key, response) })}
    />
  )
}

/** The eight areas, each with its own plain-language definition. */
export function AreaPlainLanguage() {
  const areas = useGetApiChallengeAreas()

  return (
    <section aria-labelledby="area-plain-title">
      <h2 id="area-plain-title">Prościej: obszary wyzwań</h2>
      <ul>
        {(areas.data?.data ?? []).map((area) => (
          <li key={area.code}>
            <AreaPlainLanguageItem code={area.code} name={area.name} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function AreaPlainLanguageItem({ code, name }: { code: string; name: string }) {
  const queryClient = useQueryClient()
  const current = useGetApiAdminChallengeAreasCodePlainText(code, { query: { retry: false } })
  const generate = usePostApiAdminChallengeAreasCodePlainText()
  const revise = usePutApiAdminChallengeAreasCodePlainText()
  const approve = usePostApiAdminChallengeAreasCodePlainTextApprove()
  const key = getGetApiAdminChallengeAreasCodePlainTextQueryKey(code)

  return (
    <PlainLanguageForm
      heading={name}
      explanation="Prostsza definicja obszaru. Na stronie obszaru widać ją po zatwierdzeniu."
      stored={current.data?.data}
      missing={current.isError && isMissing(current.error)}
      loading={current.isPending}
      busy={generate.isPending || revise.isPending || approve.isPending}
      failure={generate.error ?? revise.error ?? approve.error}
      onGenerate={() => generate.mutate({ code }, { onSuccess: (response) => queryClient.setQueryData(key, response) })}
      onSave={(text) => revise.mutate({ code, data: { text } }, { onSuccess: (response) => queryClient.setQueryData(key, response) })}
      onApprove={() => approve.mutate({ code }, { onSuccess: (response) => queryClient.setQueryData(key, response) })}
    />
  )
}

function PlainLanguageForm({
  heading,
  explanation,
  stored,
  missing,
  loading,
  busy,
  failure,
  onGenerate,
  onSave,
  onApprove,
}: {
  heading: string
  explanation: string
  stored: PlainTextResponse | undefined
  missing: boolean
  loading: boolean
  busy: boolean
  failure: unknown
  onGenerate: () => void
  onSave: (text: string) => void
  onApprove: () => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? stored?.text ?? ''

  return (
    <section aria-labelledby={`plain-${heading}`}>
      <h3 id={`plain-${heading}`}>{heading}</h3>
      <p>{explanation}</p>
      {loading && (
        <p>
          <output>Sprawdzam tekst…</output>
        </p>
      )}
      {missing && !stored && <p>Nie ma jeszcze tekstu.</p>}
      {stored && <p>Status: {stored.status === 'APPROVED' ? 'zatwierdzony, widoczny na stronie' : 'szkic, niewidoczny na stronie'}.</p>}
      {(stored || draft !== null) && (
        <p>
          <label>
            Tekst
            <br />
            <textarea rows={6} cols={70} maxLength={4000} value={text} onChange={(event) => setDraft(event.target.value)} />
          </label>
        </p>
      )}
      <p>
        <button type="button" disabled={busy} onClick={onGenerate}>
          {stored ? 'Napisz od nowa' : 'Przygotuj tekst'}
        </button>
        {stored && (
          <>
            {' '}
            <button type="button" disabled={busy || text.trim().length === 0} onClick={() => onSave(text)}>
              Zapisz szkic
            </button>{' '}
            <button type="button" disabled={busy} onClick={onApprove}>
              Zatwierdź
            </button>
          </>
        )}
      </p>
      <div aria-live="polite">{failure ? <p role="alert">{errorMessage(failure, { 400: 'Tekst nie może być pusty.' })}</p> : null}</div>
    </section>
  )
}

function isMissing(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}
