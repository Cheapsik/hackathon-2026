import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useGetApiChallengeAreas, useGetApiInnovations } from '@/api/generated/castor'
import { SearchAndFilters, SelectField, TextField } from '@/design-system'
import { stageLabels } from '@/features/admin/labels'
import { youtubeId } from '@/features/atlas/youtube'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/** The library: cards filtered by area, category, stage and target group. */
export function LibraryPage() {
  usePageTitle('Biblioteka innowacji')
  const [searchParams, setSearchParams] = useSearchParams()
  const area = searchParams.get('obszar') ?? ''
  const [category, setCategory] = useState('')
  const [stage, setStage] = useState('')
  const [targetGroup, setTargetGroup] = useState('')
  const [search, setSearch] = useState('')
  const areas = useGetApiChallengeAreas()
  const catalog = useGetApiInnovations()
  const innovations = useGetApiInnovations({
    Search: search || undefined,
    ChallengeArea: area || undefined,
    Category: category || undefined,
    Stage: stage || undefined,
    TargetGroup: targetGroup || undefined,
  })
  const categories = useMemo(() => {
    const names = new Set<string>()
    for (const innovation of catalog.data?.data ?? []) {
      for (const name of innovation.categories) {
        names.add(name)
      }
    }
    return [...names].sort((left, right) => left.localeCompare(right, 'pl'))
  }, [catalog.data])
  const rows = innovations.data?.data ?? []

  return (
    <>
      <h1>Biblioteka innowacji</h1>
      <p>Rozwiązania z Biblioteki ROPS i pomysły z Kreatora, które ROPS przyjął jako innowacje.</p>

      <SearchAndFilters
        searchLabel="Szukaj po tytule"
        placeholder="Np. transport do lekarza"
        query={search}
        onQueryChange={setSearch}
        searching={innovations.isPending}
        resultSummary={
          innovations.isPending
            ? 'Wczytuję bibliotekę…'
            : innovations.isSuccess && rows.length === 0
              ? 'Brak innowacji dla wybranych filtrów.'
              : innovations.isSuccess
                ? `Innowacji: ${rows.length}.`
                : null
        }
        filters={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="Obszar"
              value={area}
              placeholder="wszystkie"
              loading={areas.isPending}
              options={(areas.data?.data ?? []).map((challengeArea) => ({
                value: challengeArea.code,
                label: challengeArea.name,
              }))}
              onChange={(event) => {
                const next = new URLSearchParams(searchParams)
                if (event.target.value) {
                  next.set('obszar', event.target.value)
                } else {
                  next.delete('obszar')
                }
                setSearchParams(next)
              }}
            />
            <SelectField
              label="Kategoria"
              value={category}
              placeholder="wszystkie"
              options={categories.map((name) => ({ value: name, label: name }))}
              onChange={(event) => setCategory(event.target.value)}
            />
            <SelectField
              label="Etap"
              value={stage}
              placeholder="wszystkie"
              options={Object.entries(stageLabels).map(([value, label]) => ({ value, label }))}
              onChange={(event) => setStage(event.target.value)}
            />
            <TextField
              label="Grupa docelowa"
              type="search"
              value={targetGroup}
              onChange={(event) => setTargetGroup(event.target.value)}
            />
          </div>
        }
      />

      {innovations.isError && (
        <p role="alert">{errorMessage(innovations.error, { 400: 'Wybierz etap z listy.' })}</p>
      )}

      <ul className="grid gap-6">
        {rows.map((innovation) => {
          const video = innovation.videoUrl ? youtubeId(innovation.videoUrl) : null
          return (
            <li key={innovation.id}>
              <article aria-labelledby={`library-${innovation.id}`} className="grid gap-2">
                <h2 id={`library-${innovation.id}`}>
                  <Link to={`/innowacje/${innovation.id}`}>{innovation.title}</Link>
                </h2>
                {video && (
                  <p>
                    <img src={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`} alt="" width={240} height={135} />
                  </p>
                )}
                {innovation.shortDescription && <p>{innovation.shortDescription}</p>}
                <p className="text-label text-text-muted">
                  {innovation.categories.join(', ')}
                  {innovation.categories.length > 0 && ' · '}
                  {stageLabels[innovation.stage] ?? innovation.stage}
                </p>
              </article>
            </li>
          )
        })}
      </ul>
    </>
  )
}
