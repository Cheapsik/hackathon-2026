import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useGetApiChallengeAreas, useGetApiInnovations } from '@/api/generated/castor'
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
      <form onSubmit={(event) => event.preventDefault()}>
        <p>
          <label>
            Szukaj po tytule <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Obszar{' '}
            <select
              value={area}
              onChange={(event) => {
                const next = new URLSearchParams(searchParams)
                if (event.target.value) {
                  next.set('obszar', event.target.value)
                } else {
                  next.delete('obszar')
                }
                setSearchParams(next)
              }}
            >
              <option value="">wszystkie</option>
              {(areas.data?.data ?? []).map((challengeArea) => (
                <option key={challengeArea.code} value={challengeArea.code}>
                  {challengeArea.name}
                </option>
              ))}
            </select>
          </label>{' '}
          <label>
            Kategoria{' '}
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">wszystkie</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>{' '}
          <label>
            Etap{' '}
            <select value={stage} onChange={(event) => setStage(event.target.value)}>
              <option value="">wszystkie</option>
              {Object.entries(stageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </p>
        <p>
          <label>
            Grupa docelowa <input type="search" value={targetGroup} onChange={(event) => setTargetGroup(event.target.value)} />
          </label>
        </p>
      </form>
      <div aria-live="polite">
        {innovations.isPending && (
          <p>
            <output>Wczytuję bibliotekę…</output>
          </p>
        )}
        {innovations.isError && <p role="alert">{errorMessage(innovations.error, { 400: 'Wybierz etap z listy.' })}</p>}
        {innovations.isSuccess && rows.length === 0 && <p>Brak innowacji dla wybranych filtrów.</p>}
        {rows.length > 0 && <p>Innowacji: {rows.length}.</p>}
      </div>
      <ul>
        {rows.map((innovation) => {
          const video = innovation.videoUrl ? youtubeId(innovation.videoUrl) : null
          return (
            <li key={innovation.id}>
              <article aria-labelledby={`library-${innovation.id}`}>
                <h2 id={`library-${innovation.id}`}>
                  <Link to={`/innowacje/${innovation.id}`}>{innovation.title}</Link>
                </h2>
                {video && (
                  <p>
                    <img src={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`} alt="" width={240} height={135} />
                  </p>
                )}
                {innovation.shortDescription && <p>{innovation.shortDescription}</p>}
                <p>
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
