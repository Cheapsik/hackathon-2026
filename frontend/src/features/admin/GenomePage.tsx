import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import {
  getGetApiAdminGenomesGenomeIdQueryKey,
  getGetApiAdminGenomesQueryKey,
  useGetApiAdminGenomesGenomeId,
  useGetApiChallengeAreas,
  usePostApiAdminGenomesGenomeIdApprove,
  usePostApiAdminGenomesGenomeIdRecalculate,
  usePutApiAdminGenomesGenomeId,
  type InnovationGenomeResponse,
} from '@/api/generated/castor'
import { genomeStatusLabels } from '@/features/admin/labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'
import { linesOf } from '@/lib/format'

type ListField = 'rootCauses' | 'mechanisms' | 'targetGroups' | 'requiredInstitutions' | 'requiredPeople' | 'requiredInfrastructure'

const listFields: { key: ListField; label: string }[] = [
  { key: 'rootCauses', label: 'Przyczyny problemu' },
  { key: 'mechanisms', label: 'Mechanizmy działania' },
  { key: 'targetGroups', label: 'Grupy docelowe' },
  { key: 'requiredInstitutions', label: 'Wymagane instytucje' },
  { key: 'requiredPeople', label: 'Wymagani ludzie' },
  { key: 'requiredInfrastructure', label: 'Wymagana infrastruktura' },
]

/** Approving or correcting one genome; the corrected genome is approved on save. */
export function GenomePage() {
  const { genomeId = '' } = useParams()
  const genome = useGetApiAdminGenomesGenomeId(genomeId)
  const data = genome.data?.data
  usePageTitle(data ? `Genom: ${data.innovationTitle}` : 'Genom')

  return (
    <>
      <p>
        <Link to="/admin/wiedza">Wróć do wiedzy</Link>
      </p>
      {genome.isPending && (
        <p>
          <output>Wczytuję genom…</output>
        </p>
      )}
      {genome.isError && <p role="alert">{errorMessage(genome.error, { 404: 'Nie ma takiego genomu.' })}</p>}
      {/* A saved genome comes back with a new timestamp, which starts the form again from it. */}
      {data && <GenomeForm key={data.updatedAt} genome={data} />}
    </>
  )
}

function GenomeForm({ genome }: { genome: InnovationGenomeResponse }) {
  const [lists, setLists] = useState<Record<ListField, string>>(() => listTexts(genome))
  const [summary, setSummary] = useState(genome.summary)
  const [scale, setScale] = useState(genome.scale ?? '')
  const [budget, setBudget] = useState(genome.requiredBudget ?? '')
  const [areaCodes, setAreaCodes] = useState<string[]>(genome.challengeAreaCodes)
  const areas = useGetApiChallengeAreas()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const revise = usePutApiAdminGenomesGenomeId()
  const approve = usePostApiAdminGenomesGenomeIdApprove()
  const recalculate = usePostApiAdminGenomesGenomeIdRecalculate()

  function stored(response: { data: InnovationGenomeResponse }) {
    queryClient.setQueryData(getGetApiAdminGenomesGenomeIdQueryKey(genome.id), response)
    void queryClient.invalidateQueries({ queryKey: getGetApiAdminGenomesQueryKey() })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    revise.mutate(
      {
        genomeId: genome.id,
        data: {
          rootCauses: linesOf(lists.rootCauses),
          mechanisms: linesOf(lists.mechanisms),
          targetGroups: linesOf(lists.targetGroups),
          requiredInstitutions: linesOf(lists.requiredInstitutions),
          requiredPeople: linesOf(lists.requiredPeople),
          requiredBudget: budget || null,
          requiredInfrastructure: linesOf(lists.requiredInfrastructure),
          scale: scale || null,
          challengeAreaCodes: areaCodes,
          summary,
        },
      },
      { onSuccess: stored },
    )
  }

  function toggleArea(code: string, checked: boolean) {
    setAreaCodes(checked ? [...areaCodes, code] : areaCodes.filter((current) => current !== code))
  }

  return (
    <>
      <h1>Genom: {genome.innovationTitle}</h1>
      <p>Status: {genomeStatusLabels[genome.status]}</p>
      <p>
        <button type="button" onClick={() => approve.mutate({ genomeId: genome.id }, { onSuccess: stored })} disabled={approve.isPending || genome.status === 'APPROVED'}>
          Zatwierdź bez zmian
        </button>{' '}
        <button
          type="button"
          disabled={recalculate.isPending}
          onClick={() =>
            recalculate.mutate(
              { genomeId: genome.id },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries({ queryKey: getGetApiAdminGenomesQueryKey() })
                  navigate('/admin/wiedza')
                },
              },
            )
          }
        >
          Przelicz genom od nowa
        </button>
      </p>

      <form onSubmit={submit}>
        <p>
          <label>
            Streszczenie (do 600 znaków)
            <br />
            <textarea rows={4} cols={70} maxLength={600} required value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>
        </p>
        {listFields.map((field) => (
          <p key={field.key}>
            <label>
              {field.label} (jedna pozycja w wierszu)
              <br />
              <textarea rows={4} cols={70} value={lists[field.key]} onChange={(event) => setLists({ ...lists, [field.key]: event.target.value })} />
            </label>
          </p>
        ))}
        <p>
          <label>
            Budżet <input value={budget} onChange={(event) => setBudget(event.target.value)} size={60} />
          </label>
        </p>
        <p>
          <label>
            Skala <input value={scale} onChange={(event) => setScale(event.target.value)} size={60} />
          </label>
        </p>
        <fieldset>
          <legend>Obszary wyzwań</legend>
          {(areas.data?.data ?? []).map((area) => (
            <label key={area.code}>
              <input type="checkbox" checked={areaCodes.includes(area.code)} onChange={(event) => toggleArea(area.code, event.target.checked)} /> {area.name}
              <br />
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={revise.isPending}>
          Zapisz poprawki i zatwierdź
        </button>
      </form>
      <div aria-live="polite">
        {revise.isSuccess && (
          <p>
            <output>Genom zapisany i zatwierdzony.</output>
          </p>
        )}
        {(revise.isError || approve.isError || recalculate.isError) && (
          <p role="alert">{errorMessage(revise.error ?? approve.error ?? recalculate.error, { 400: 'Genom potrzebuje streszczenia do 600 znaków.' })}</p>
        )}
      </div>
    </>
  )
}

function listTexts(genome: InnovationGenomeResponse): Record<ListField, string> {
  return {
    rootCauses: genome.rootCauses.join('\n'),
    mechanisms: genome.mechanisms.join('\n'),
    targetGroups: genome.targetGroups.join('\n'),
    requiredInstitutions: genome.requiredInstitutions.join('\n'),
    requiredPeople: genome.requiredPeople.join('\n'),
    requiredInfrastructure: genome.requiredInfrastructure.join('\n'),
  }
}
