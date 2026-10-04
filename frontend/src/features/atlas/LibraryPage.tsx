import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { LayoutGrid, List } from 'lucide-react'
import { useGetApiChallengeAreas, useGetApiInnovations, type InnovationSummaryResponse } from '@/api/generated/castor'
import {
  Badge,
  CeramicCard,
  CollectionTemplate,
  EmptyState,
  ListRow,
  SearchAndFilters,
  SegmentedControl,
  SelectField,
  SoftButton,
  TextField,
  type CollectionStatus,
  type SegmentedOption,
} from '@/design-system'
import { stageLabels } from '@/features/admin/labels'
import { youtubeId } from '@/features/atlas/youtube'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

type LibraryLayout = 'grid' | 'list'

const layoutStorageKey = 'castor.library-layout'

const layoutOptions: SegmentedOption<LibraryLayout>[] = [
  {
    value: 'grid',
    ariaLabel: 'Widok kafelków',
    label: (
      <>
        <LayoutGrid aria-hidden className="size-icon" />
        <span className="hidden sm:inline">Kafelki</span>
      </>
    ),
  },
  {
    value: 'list',
    ariaLabel: 'Widok listy',
    label: (
      <>
        <List aria-hidden className="size-icon" />
        <span className="hidden sm:inline">Lista</span>
      </>
    ),
  },
]

function readStoredLayout(): LibraryLayout {
  try {
    return localStorage.getItem(layoutStorageKey) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

/** The library: cards filtered by area, category, stage and target group. */
export function LibraryPage() {
  usePageTitle('Biblioteka innowacji')
  const [searchParams, setSearchParams] = useSearchParams()
  const area = searchParams.get('obszar') ?? ''
  const [category, setCategory] = useState('')
  const [stage, setStage] = useState('')
  const [targetGroup, setTargetGroup] = useState('')
  // `szukaj` comes from the search field in the "Opisz problem" header.
  const [search, setSearch] = useState(() => searchParams.get('szukaj') ?? '')
  const [layout, setLayout] = useState<LibraryLayout>(readStoredLayout)
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
  const areaNameByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const challengeArea of areas.data?.data ?? []) {
      map.set(challengeArea.code, challengeArea.name)
    }
    return map
  }, [areas.data])
  const rows = innovations.data?.data ?? []

  useEffect(() => {
    try {
      localStorage.setItem(layoutStorageKey, layout)
    } catch {
      // Preference still applies for this visit.
    }
  }, [layout])

  const status: CollectionStatus =
    innovations.isPending && !innovations.data
      ? 'loading'
      : innovations.isError
        ? 'error'
        : rows.length === 0
          ? 'empty'
          : 'ready'

  function clearFilters() {
    setSearch('')
    setCategory('')
    setStage('')
    setTargetGroup('')
    if (searchParams.has('obszar')) {
      const next = new URLSearchParams(searchParams)
      next.delete('obszar')
      setSearchParams(next)
    }
  }

  return (
    <CollectionTemplate
      title="Biblioteka innowacji"
      lead="Rozwiązania z Biblioteki ROPS i pomysły z Kreatora, które ROPS przyjął jako innowacje."
      actions={
        <SegmentedControl
          label="Widok wyników"
          size="sm"
          options={layoutOptions}
          value={layout}
          onValueChange={setLayout}
        />
      }
      search={
        <SearchAndFilters
          searchLabel="Szukaj po tytule"
          placeholder="Np. transport do lekarza"
          query={search}
          onQueryChange={setSearch}
          searching={innovations.isFetching}
          resultSummary={
            innovations.isFetching
              ? 'Szukam…'
              : status === 'ready'
                ? `Znaleziono ${rows.length} innowacji`
                : status === 'empty'
                  ? 'Brak innowacji dla wybranych filtrów.'
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
      }
      resultsLabel="Innowacje"
      status={status}
      items={rows}
      getKey={(item) => item.id}
      layout={layout}
      loadingLabel="Wczytuję bibliotekę…"
      errorMessage={errorMessage(innovations.error, { 400: 'Wybierz etap z listy.' })}
      onRetry={() => void innovations.refetch()}
      empty={
        <EmptyState
          title="Nic nie pasuje do filtrów"
          description="Zmień wyszukiwanie albo wyczyść filtry, żeby zobaczyć całą Bibliotekę."
          action={<SoftButton onClick={clearFilters}>Wyczyść filtry</SoftButton>}
        />
      }
      renderItem={(innovation) =>
        layout === 'grid' ? (
          <InnovationCard innovation={innovation} areaNameByCode={areaNameByCode} />
        ) : (
          <InnovationListRow innovation={innovation} areaNameByCode={areaNameByCode} />
        )
      }
    />
  )
}

/** Stage as a chip: capitalised, green once the innovation has been tested. */
function StageChip({ stage }: { stage: string }) {
  const label = stageLabels[stage] ?? stage
  return (
    <Badge tone={stage === 'TESTED' || stage === 'READY' ? 'success' : 'neutral'} className="w-fit">
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </Badge>
  )
}

function innovationMeta(innovation: InnovationSummaryResponse, areaNameByCode: Map<string, string>) {
  const areaNames = innovation.challengeAreaCodes.map((code) => areaNameByCode.get(code) ?? code)
  return [...areaNames, ...innovation.categories].filter(Boolean).join(' · ')
}

function InnovationCard({
  innovation,
  areaNameByCode,
}: {
  innovation: InnovationSummaryResponse
  areaNameByCode: Map<string, string>
}) {
  const video = innovation.videoUrl ? youtubeId(innovation.videoUrl) : null
  const meta = innovationMeta(innovation, areaNameByCode)

  return (
    <CeramicCard asChild interactive padding="none" className="h-full overflow-hidden">
      <Link to={`/innowacje/${innovation.id}`} className="grid h-full content-between">
        {video && (
          <img
            src={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`}
            alt=""
            className="aspect-video w-full object-cover"
            width={480}
            height={270}
          />
        )}
        <span className="grid flex-1 content-between gap-4 p-4 md:p-5">
          <span className="grid gap-2">
            <span className="font-display text-section-title tracking-display text-balance">
              {innovation.title}
            </span>
            {innovation.shortDescription && (
              <span className="line-clamp-3 text-body-sm text-text-muted">{innovation.shortDescription}</span>
            )}
          </span>
          <span className="grid gap-2">
            <StageChip stage={innovation.stage} />
            {meta && <span className="text-label text-text-muted">{meta}</span>}
          </span>
        </span>
      </Link>
    </CeramicCard>
  )
}

function InnovationListRow({
  innovation,
  areaNameByCode,
}: {
  innovation: InnovationSummaryResponse
  areaNameByCode: Map<string, string>
}) {
  const meta = innovationMeta(innovation, areaNameByCode)
  const description = [innovation.shortDescription, meta].filter(Boolean).join(' · ')

  return (
    <CeramicCard asChild padding="none" className="overflow-hidden">
      <div>
        <ListRow
          to={`/innowacje/${innovation.id}`}
          title={innovation.title}
          description={description || undefined}
          trailing={<StageChip stage={innovation.stage} />}
        />
      </div>
    </CeramicCard>
  )
}
