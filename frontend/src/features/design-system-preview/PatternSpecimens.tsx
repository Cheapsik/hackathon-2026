import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  BandSection,
  Badge,
  CardCarousel,
  CategoryOrbit,
  CeramicCard,
  ChartPanel,
  ConfirmationPanel,
  DataList,
  FilterBar,
  ListRow,
  MediaRail,
  MetricGroup,
  ProfileSummary,
  PromptCard,
  RuledList,
  SearchAndFilters,
  Section,
  SettingsGroup,
  SoftButton,
  TransactionPanel,
  type PromptCardVoice,
} from '@/design-system'
import {
  sampleAreas,
  sampleCategories,
  sampleInnovations,
  sampleMedia,
  sampleMonthlyReports,
} from './sample-data'

function PromptSpecimen({
  title,
  initial = '',
  error,
  voice,
}: {
  title: string
  initial?: string
  error?: string
  voice: PromptCardVoice
}) {
  const [value, setValue] = useState(initial)

  return (
    <form onSubmit={(event) => event.preventDefault()} aria-label={title} className="grid gap-3">
      <p className="text-label font-medium text-text-muted">{title}</p>
      <PromptCard
        label="Opisz, co nie działa"
        placeholder="Np. w naszej wsi nie ma dojazdu do lekarza"
        submitLabel="Znajdź rozwiązania"
        value={value}
        onValueChange={setValue}
        error={error}
        voice={voice}
      />
    </form>
  )
}

export function PatternSpecimens() {
  const [category, setCategory] = useState('dom')
  const [media, setMedia] = useState('materialy')
  const [areas, setAreas] = useState<string[]>(['rodzina'])
  const [query, setQuery] = useState('')
  const idle: PromptCardVoice = { supported: true, listening: false, onToggle: () => undefined }

  return (
    <div className="grid gap-8">
      <Section
        title="PromptCard"
        titleAs="h3"
        description="Główne pole strony: opis problemu, dyktowanie i jedna akcja. Pięć stanów: pusty, wypełniony, błąd, dyktowanie, przeglądarka bez dyktowania."
      >
        <div className="grid gap-8 rounded-panel bg-app p-6 lg:grid-cols-2">
          <PromptSpecimen title="Pusty" voice={idle} />
          <PromptSpecimen title="Wypełniony" initial="W naszej wsi nie ma autobusu do przychodni." voice={idle} />
          <PromptSpecimen
            title="Błąd"
            error="Napisz kilka słów o problemie, żeby znaleźć rozwiązania."
            voice={idle}
          />
          <PromptSpecimen title="Dyktowanie" initial="W naszej wsi nie ma" voice={{ ...idle, listening: true }} />
          <PromptSpecimen title="Przeglądarka bez dyktowania" voice={{ ...idle, supported: false }} />
        </div>
      </Section>

      <Section
        title="BandSection i RuledList"
        titleAs="h3"
        description="Sekcja pasa informacyjnego: tytuł w kolumnach 1-3, wiersze z liniami w kolumnach 4-12. Zamiast kart."
      >
        <div className="divide-y divide-border-subtle border-y border-border-subtle bg-surface-solid">
          <BandSection title="Jak to działa">
            <RuledList
              numbered
              items={[
                { id: 'a', title: 'Opisz, co nie działa', description: 'Napisz albo powiedz własnymi słowami.' },
                { id: 'b', title: 'Zobacz dopasowane innowacje', description: 'Podpowiemy sprawdzone rozwiązania.' },
              ]}
            />
          </BandSection>
        </div>
      </Section>

      <Section title="CategoryOrbit i MediaRail" titleAs="h3" description="Elementy ekranu immersyjnego, tu na tle bez zdjęcia.">
        <div className="immersive-geometry grid gap-6 rounded-panel p-6 media-fallback">
          <CategoryOrbit label="Obszary" categories={sampleCategories} value={category} onValueChange={setCategory} />
          <div className="grid justify-items-center rounded-card bg-surface-ceramic p-5">
            <MediaRail label="Materiały" items={sampleMedia} activeId={media} onSelect={setMedia} />
          </div>
        </div>
      </Section>

      <Section title="MetricGroup" titleAs="h3">
        <MetricGroup
          items={[
            { id: 'a', label: 'Indeks starości', value: '1,62', hint: 'region: 1,41' },
            { id: 'b', label: 'Dzienne domy pomocy', value: '0', hint: 'region: 2' },
            { id: 'c', label: 'Seniorzy 75+', value: '1 240', trend: { direction: 'up', label: '+4% r/r' } },
          ]}
        />
      </Section>

      <ChartPanel
        titleAs="h3"
        title="ChartPanel - zgłoszenia w czasie"
        description="Najedź albo użyj strzałek na wykresie. Te same dane są w tabeli."
        seriesLabel="Liczba zgłoszeń"
        categoryLabel="Miesiąc"
        data={sampleMonthlyReports}
      />

      <Section title="SearchAndFilters i FilterBar" titleAs="h3">
        <SearchAndFilters
          query={query}
          onQueryChange={setQuery}
          searchLabel="Szukaj innowacji"
          placeholder="Np. samotność seniorów"
          filters={<FilterBar label="Obszar wyzwań" options={sampleAreas} value={areas} onValueChange={setAreas} />}
          resultSummary={`Znaleziono ${sampleInnovations.length} innowacji`}
        />
      </Section>

      <Section title="CardCarousel" titleAs="h3">
        <CardCarousel
          label="Wyróżnione innowacje"
          items={sampleInnovations}
          getKey={(item) => item.id}
          renderItem={(item) => (
            <CeramicCard asChild interactive padding="lg" className="h-full">
              <a href="#przyklad" className="grid gap-3">
                <span className="text-label text-text-muted">{item.area}</span>
                <span className="font-display text-section-title tracking-display">{item.title}</span>
                <Badge className="w-fit">{item.stage}</Badge>
              </a>
            </CeramicCard>
          )}
        />
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="TransactionPanel (AssetPair)" titleAs="h3">
          <TransactionPanel
            label="Innowacja i gmina"
            from={{
              label: 'Innowacja',
              asset: { name: 'Sieć wsparcia seniorów', symbol: 'S' },
              value: { value: '40', label: 'Odbiorcy' },
              secondary: 'planowani odbiorcy',
            }}
            to={{
              label: 'Gmina',
              asset: { name: 'Gmina Przykładowa', symbol: 'P', tone: 'accent' },
              value: { value: '1 240', label: 'Seniorzy 75+' },
              secondary: 'seniorów 75+',
            }}
            onSwap={() => undefined}
            summary={[{ label: 'Rok danych', value: '2024' }]}
          />
        </Section>

        <Section title="DataList i ProfileSummary" titleAs="h3">
          <CeramicCard padding="lg" className="grid gap-6">
            <ProfileSummary name="Ośrodek Pomocy Społecznej" description="Gmina Przykładowa" meta={<Badge>Pracownik JST</Badge>} />
            <DataList
              items={[
                { label: 'Dopasowanie', value: 'Wysokie' },
                { label: 'Do dostosowania', value: '1 element', hint: 'brakuje opiekuna' },
                { label: 'Rok danych', value: '2024' },
              ]}
            />
          </CeramicCard>
        </Section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="SettingsGroup" titleAs="h3">
          <div className="grid gap-6">
            <SettingsGroup title="Konto">
              <ListRow title="E-mail" description="opp@przykladowa.example" onClick={() => undefined} />
              <ListRow title="Hasło" onClick={() => undefined} />
            </SettingsGroup>
            <SettingsGroup title="Usuwanie konta" tone="danger">
              <ListRow leading={<Trash2 aria-hidden />} title="Usuń konto" tone="danger" onClick={() => undefined} />
            </SettingsGroup>
          </div>
        </Section>

        <Section title="ConfirmationPanel" titleAs="h3">
          <CeramicCard padding="lg">
            <ConfirmationPanel
              titleAs="h3"
              title="Zgłoszenie przyjęte"
              description="Kod śledzenia: K7QM-2XDF. Zapisz go, żeby sprawdzić status bez logowania."
              actions={<SoftButton variant="primary">Zobacz dopasowania</SoftButton>}
            />
          </CeramicCard>
        </Section>
      </div>
    </div>
  )
}
