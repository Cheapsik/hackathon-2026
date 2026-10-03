import { useState } from 'react'
import { ArrowLeft, Clock, EllipsisVertical, Heart, KeyRound, Mail, MapPin, Plus, Trash2 } from 'lucide-react'
import {
  AuthTemplate,
  Avatar,
  Badge,
  BandSection,
  BottomActionDock,
  CardCarousel,
  CeramicCard,
  ChartPanel,
  CheckboxField,
  CollectionTemplate,
  ConfirmationPanel,
  FilterBar,
  FormFlowTemplate,
  IconButton,
  ImmersiveDetailTemplate,
  ListRow,
  MediaRail,
  MetricGroup,
  OverviewTemplate,
  ProfileSummary,
  PromptCard,
  RuledList,
  SearchAndFilters,
  Section,
  SegmentedControl,
  SelectField,
  SettingsGroup,
  SettingsTemplate,
  SoftButton,
  StartTemplate,
  TextAreaField,
  TextField,
  TransactionPanel,
  TransactionTemplate,
  type CollectionStatus,
  type TransactionStage,
} from '@/design-system'
import {
  sampleAreas,
  sampleCategories,
  sampleCategoryContent,
  sampleInnovations,
  sampleMedia,
  sampleMonthlyReports,
  sampleMunicipalities,
  type SampleInnovation,
} from './sample-data'

type ExampleProps = { state?: string }

/** Entry screen of the product: message and tool in one product area, the information band under it. */
export function StartExample({ state }: ExampleProps) {
  const [value, setValue] = useState(state === 'filled' ? 'W naszej wsi nie ma autobusu do przychodni.' : '')

  return (
    <StartTemplate
      eyebrow="Małopolski Hub Innowacji Społecznych"
      title="Co w Twojej okolicy nie działa?"
      lead="Opisz problem własnymi słowami. Castor podpowie sprawdzone rozwiązania z Biblioteki ROPS i wyjaśni, dlaczego pasują."
      tool={
        <form onSubmit={(event) => event.preventDefault()}>
          <PromptCard
            label="Opisz, co nie działa"
            placeholder="Np. w naszej wsi nie ma dojazdu do lekarza"
            submitLabel="Znajdź rozwiązania"
            value={value}
            onValueChange={setValue}
            error={state === 'error' ? 'Napisz kilka słów o problemie, żeby znaleźć rozwiązania.' : undefined}
            hint="Bez konta. Po wysłaniu dostajesz kod, którym sprawdzisz status zgłoszenia."
            voice={{ supported: true, listening: false, onToggle: () => undefined }}
          />
        </form>
      }
      band={
        <BandSection title="Jak to działa">
          <RuledList
            numbered
            items={[
              { id: 'a', title: 'Opisz, co nie działa', description: 'Napisz albo powiedz własnymi słowami.' },
              { id: 'b', title: 'Zobacz dopasowane innowacje', description: 'Podpowiemy sprawdzone rozwiązania.' },
              { id: 'c', title: 'Sprawdź dla swojej gminy', description: 'Karta dopasowania do gminy.' },
            ]}
          />
        </BandSection>
      }
    />
  )
}

export function ImmersiveDetailExample() {
  const [category, setCategory] = useState('wsparcie')
  const [media, setMedia] = useState('film')
  const [saved, setSaved] = useState(false)
  const content = sampleCategoryContent[category]

  return (
    <ImmersiveDetailTemplate
      hero={{
        title: 'Biblioteka innowacji',
        lead: 'Sprawdzone rozwiązania społeczne z całej Małopolski',
        leading: <IconButton label="Wstecz" icon={ArrowLeft} variant="on-media" />,
        trailing: (
          <>
            <IconButton label="Zapisz" icon={Heart} variant="on-media" pressed={saved} onClick={() => setSaved(!saved)} />
            <IconButton label="Więcej opcji" icon={EllipsisVertical} variant="on-media" />
          </>
        ),
      }}
      categories={{ label: 'Obszary', categories: sampleCategories, value: category, onValueChange: setCategory }}
      contentKey={category}
      meta={
        <>
          <Clock aria-hidden />
          <span>{content.meta}</span>
        </>
      }
      title={content.title}
      description={content.description}
      dock={
        <BottomActionDock
          label="Działania dla innowacji"
          primary={
            <SoftButton variant="primary" fullWidth icon={<MapPin aria-hidden />}>
              Sprawdź dla mojej gminy
            </SoftButton>
          }
        />
      }
    >
      <MediaRail label="Materiały o innowacji" items={sampleMedia} activeId={media} onSelect={setMedia} />
    </ImmersiveDetailTemplate>
  )
}

export function OverviewExample() {
  return (
    <OverviewTemplate
      eyebrow="Gmina Przykładowa"
      title="Panel gminy"
      lead="Zgłoszenia mieszkańców i innowacje dopasowane do Twojej gminy."
      actions={<SoftButton icon={<Plus aria-hidden />}>Nowa karta dopasowania</SoftButton>}
      highlights={
        <MetricGroup
          items={[
            {
              id: 'reports',
              label: 'Zgłoszenia w tym miesiącu',
              value: '41',
              trend: { direction: 'up', label: '+17% m/m', sentiment: 'neutral' },
            },
            { id: 'matches', label: 'Dopasowane innowacje', value: '8', hint: 'z 115 w Bibliotece' },
            { id: 'fit', label: 'Karty dopasowania', value: '3', hint: 'dane z 2024 r.' },
          ]}
        />
      }
      aside={
        <CeramicCard padding="lg">
          <ProfileSummary
            name="Ośrodek Pomocy Społecznej"
            description="Gmina Przykładowa · pracownik JST"
            meta={<Badge>Pracownik JST</Badge>}
          />
        </CeramicCard>
      }
      dock={
        <BottomActionDock
          label="Działania"
          primary={
            <SoftButton variant="primary" fullWidth>
              Nowa karta dopasowania
            </SoftButton>
          }
        />
      }
    >
      <ChartPanel
        title="Zgłoszenia w czasie"
        description="Liczba zgłoszeń z gminy w kolejnych miesiącach 2026 r."
        seriesLabel="Liczba zgłoszeń"
        categoryLabel="Miesiąc"
        data={sampleMonthlyReports}
      />
      <Section title="Ostatnie zgłoszenia" action={<SoftButton variant="ghost">Zobacz wszystkie</SoftButton>}>
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            <li>
              <ListRow
                to="#"
                title="Brak opieki popołudniowej dla seniorów"
                description="2 dni temu · Starzenie się"
                trailing={<Badge tone="warning">W analizie</Badge>}
              />
            </li>
            <li>
              <ListRow
                to="#"
                title="Młodzież nie ma gdzie spędzać czasu"
                description="5 dni temu · Wspólnota"
                trailing={<Badge tone="success">Odpowiedź</Badge>}
              />
            </li>
          </ul>
        </CeramicCard>
      </Section>
    </OverviewTemplate>
  )
}

export function CollectionExample({ state }: ExampleProps) {
  const [query, setQuery] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const status: CollectionStatus = isCollectionStatus(state) ? state : 'ready'

  const renderCard = (innovation: SampleInnovation) => (
    <CeramicCard asChild interactive padding="lg" className="h-full">
      <a href="#przyklad" className="grid h-full content-between gap-4">
        <span className="grid gap-2">
          <span className="text-label text-text-muted">{innovation.area}</span>
          <span className="font-display text-section-title tracking-display">{innovation.title}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <Badge>{innovation.stage}</Badge>
          {innovation.municipalities > 0 && (
            <span className="text-label text-text-muted tabular">{innovation.municipalities} gmin</span>
          )}
        </span>
      </a>
    </CeramicCard>
  )

  return (
    <CollectionTemplate
      title="Biblioteka innowacji"
      lead="115 sprawdzonych rozwiązań społecznych. Szukaj po problemie, grupie albo obszarze."
      search={
        <SearchAndFilters
          query={query}
          onQueryChange={setQuery}
          searchLabel="Szukaj innowacji"
          placeholder="Np. samotność seniorów"
          filters={<FilterBar label="Obszar wyzwań" options={sampleAreas} value={areas} onValueChange={setAreas} />}
          resultSummary={status === 'ready' ? `Znaleziono ${sampleInnovations.length} innowacji` : undefined}
        />
      }
      featured={
        status === 'ready' && (
          <Section title="Wybrane do upowszechniania">
            <CardCarousel
              label="Wybrane do upowszechniania"
              items={sampleInnovations.slice(0, 4)}
              getKey={(item) => item.id}
              renderItem={renderCard}
            />
          </Section>
        )
      }
      resultsLabel="Innowacje"
      status={status}
      items={sampleInnovations}
      getKey={(item) => item.id}
      renderItem={renderCard}
      errorMessage="Serwer nie odpowiada. Sprawdź połączenie i spróbuj ponownie."
      onRetry={() => undefined}
      pagination={<SoftButton>Pokaż więcej</SoftButton>}
    />
  )
}

export function FormFlowExample({ state }: ExampleProps) {
  const showErrors = state === 'error'

  return (
    <FormFlowTemplate
      title="Opisz problem"
      lead="Napisz własnymi słowami, co nie działa. Wystarczy kilka zdań."
      step={{ current: 1, total: 3 }}
      onBack={() => undefined}
      onSubmit={(event) => event.preventDefault()}
      formError={showErrors ? 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę.' : undefined}
      primaryAction={
        <SoftButton type="submit" variant="primary" fullWidth>
          Znajdź rozwiązania
        </SoftButton>
      }
    >
      <TextAreaField
        label="Opisz, co nie działa"
        required
        placeholder="Np. starsi mieszkańcy naszej wsi nie mają jak dojechać do lekarza."
        hint="Nie podawaj imion, nazwisk ani adresów."
        error={showErrors ? 'Opisz problem — to pole nie może być puste.' : undefined}
      />
      <SelectField label="Gmina" placeholder="Wybierz gminę (opcjonalnie)" options={sampleMunicipalities} />
      <CheckboxField label="Zgłaszam w czyimś imieniu" hint="Na przykład za sąsiada, który nie korzysta z internetu." />
    </FormFlowTemplate>
  )
}

export function TransactionExample({ state }: ExampleProps) {
  const stage: TransactionStage = state === 'confirm' || state === 'success' ? state : 'edit'
  const [recipients, setRecipients] = useState('40')

  return (
    <TransactionTemplate
      context="Karta dopasowania"
      onBack={() => undefined}
      title="Czy to zadziała u nas?"
      lead="Porównamy wymagania innowacji z danymi Twojej gminy."
      stage={stage}
      panel={
        <TransactionPanel
          label="Innowacja i gmina"
          from={{
            label: 'Innowacja',
            meta: 'Wymaga: 2 opiekunów',
            asset: { name: 'Sieć wsparcia seniorów', symbol: 'S' },
            onAssetSelect: () => undefined,
            value: { value: recipients, label: 'Planowana liczba odbiorców', onValueChange: setRecipients, unit: 'osób' },
            secondary: 'planowana liczba odbiorców',
          }}
          to={{
            label: 'Gmina',
            meta: 'Rok danych: 2024',
            asset: { name: 'Gmina Przykładowa', symbol: <MapPin />, tone: 'accent' },
            onAssetSelect: () => undefined,
            value: { value: '1 240', label: 'Seniorzy 75+ w gminie' },
            secondary: 'seniorów 75+ w gminie',
          }}
          onSwap={() => undefined}
          swapLabel="Zamień innowację z gminą"
          summary={[
            { label: 'Średnia regionu', value: '980 osób' },
            { label: 'Dane', value: 'Obserwator ROPS, 2024' },
          ]}
        />
      }
      note="Wynik zapiszemy, żeby nie liczyć go drugi raz."
      primaryAction={
        stage === 'edit' ? (
          <SoftButton variant="primary" fullWidth>
            Sprawdź dopasowanie
          </SoftButton>
        ) : (
          <SoftButton variant="primary" fullWidth>
            Potwierdź
          </SoftButton>
        )
      }
      dockLeading={<IconButton label="Wstecz" icon={ArrowLeft} variant="ghost" />}
      confirmation={
        <ConfirmationPanel
          tone="review"
          title="Sprawdź dane"
          description="Tak policzymy dopasowanie. Możesz jeszcze wrócić i coś zmienić."
          details={[
            { label: 'Innowacja', value: 'Sieć wsparcia seniorów' },
            { label: 'Gmina', value: 'Gmina Przykładowa' },
            { label: 'Planowani odbiorcy', value: `${recipients} osób` },
          ]}
        />
      }
      success={
        <ConfirmationPanel
          title="Karta dopasowania gotowa"
          description="Dopasowanie: wysokie. Gmina ma wystarczającą liczbę odbiorców, brakuje jednego opiekuna."
          details={[
            { label: 'Dopasowanie', value: 'Wysokie' },
            { label: 'Do dostosowania', value: '1 element' },
            { label: 'Rok danych', value: '2024' },
          ]}
          actions={
            <>
              <SoftButton>Wydrukuj kartę</SoftButton>
              <SoftButton variant="primary">Zobacz kartę</SoftButton>
            </>
          }
        />
      }
    />
  )
}

export function SettingsExample() {
  const [size, setSize] = useState('normal')

  return (
    <SettingsTemplate
      title="Ustawienia"
      lead="Konto, wygląd i Twoja gmina."
      sections={[
        {
          id: 'wyglad',
          label: 'Wygląd',
          content: (
            <SettingsGroup title="Wygląd" description="Zapamiętamy wybór na tym urządzeniu.">
              <ListRow
                title="Rozmiar tekstu"
                trailing={
                  <SegmentedControl
                    label="Rozmiar tekstu"
                    size="sm"
                    value={size}
                    onValueChange={setSize}
                    options={[
                      { value: 'normal', label: 'A', ariaLabel: 'Tekst normalny' },
                      { value: 'large', label: 'A+', ariaLabel: 'Tekst większy' },
                      { value: 'larger', label: 'A++', ariaLabel: 'Tekst największy' },
                    ]}
                  />
                }
              />
            </SettingsGroup>
          ),
        },
        {
          id: 'konto',
          label: 'Konto',
          content: (
            <SettingsGroup title="Konto">
              <ListRow leading={<Mail aria-hidden />} title="E-mail" description="opp@przykladowa.example" onClick={() => undefined} />
              <ListRow leading={<KeyRound aria-hidden />} title="Hasło" description="Zmienione 3 miesiące temu" onClick={() => undefined} />
            </SettingsGroup>
          ),
        },
        {
          id: 'gmina',
          label: 'Moja gmina',
          content: (
            <SettingsGroup title="Moja gmina" description="Nadaje ją administrator ROPS.">
              <ListRow leading={<MapPin aria-hidden />} title="Gmina Przykładowa" trailing={<Badge>Przypisana</Badge>} />
            </SettingsGroup>
          ),
        },
      ]}
      dangerZone={
        <SettingsGroup title="Usuwanie konta" tone="danger" description="Tej operacji nie da się cofnąć.">
          <ListRow leading={<Trash2 aria-hidden />} title="Usuń konto" tone="danger" onClick={() => undefined} />
        </SettingsGroup>
      }
    />
  )
}

export function AuthExample({ state }: ExampleProps) {
  const failed = state === 'error'

  return (
    <AuthTemplate
      brand={<Avatar name="Castor" />}
      title="Zaloguj się"
      lead="Zobaczysz swoje zgłoszenia, pomysły i karty dopasowania."
      footer={
        <>
          Nie masz konta?{' '}
          <a href="#przyklad" className="font-medium text-text-primary underline underline-offset-4">
            Załóż konto
          </a>
        </>
      }
    >
      <form noValidate className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
        {failed && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
            Nieprawidłowy e-mail lub hasło.
          </p>
        )}
        <TextField label="E-mail" type="email" autoComplete="email" required />
        <TextField label="Hasło" type="password" autoComplete="current-password" required />
        <SoftButton type="submit" variant="primary" size="lg" fullWidth>
          Zaloguj się
        </SoftButton>
      </form>
    </AuthTemplate>
  )
}

function isCollectionStatus(value: string | undefined): value is CollectionStatus {
  return value === 'loading' || value === 'error' || value === 'empty' || value === 'ready'
}
