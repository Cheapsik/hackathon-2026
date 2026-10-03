import { useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Bell, Check, Heart, MapPin, Plus, Search, Settings, TriangleAlert } from 'lucide-react'
import {
  AssetField,
  Avatar,
  Badge,
  BottomActionDock,
  BottomSheet,
  CeramicCard,
  CheckboxField,
  EmptyState,
  ErrorState,
  GlassPanel,
  IconButton,
  ImageFallback,
  ListRow,
  LoadingState,
  MetricValue,
  Modal,
  Pill,
  SearchField,
  Section,
  SegmentedControl,
  SelectField,
  Skeleton,
  SoftButton,
  SwitchField,
  Tabs,
  TextAreaField,
  TextField,
  TopBar,
  useToast,
  UtilityMenu,
} from '@/design-system'
import { sampleMunicipalities } from './sample-data'

function Specimen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Section title={title} titleAs="h3">
      <CeramicCard padding="lg" className="flex flex-wrap items-start gap-3">
        {children}
      </CeramicCard>
    </Section>
  )
}

export function PrimitiveSpecimens() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('seniorzy')
  const [segment, setSegment] = useState('month')
  const [pressed, setPressed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [amount, setAmount] = useState('40')
  const [contrast, setContrast] = useState(false)

  return (
    <div className="grid gap-8">
      <Specimen title="SoftButton">
        <SoftButton variant="primary">Główna akcja</SoftButton>
        <SoftButton>Drugorzędna</SoftButton>
        <SoftButton variant="ghost">Ghost</SoftButton>
        <SoftButton variant="danger">Usuń</SoftButton>
        <SoftButton variant="primary" icon={<Plus aria-hidden />}>
          Z ikoną
        </SoftButton>
        <SoftButton trailingIcon={<ArrowRight aria-hidden />}>Dalej</SoftButton>
        <SoftButton variant="primary" loading>
          Zapisuję
        </SoftButton>
        <SoftButton disabled>Niedostępny</SoftButton>
        <SoftButton variant="primary" size="lg">
          Duży
        </SoftButton>
      </Specimen>

      <Specimen title="IconButton">
        <IconButton label="Ustawienia" icon={Settings} />
        <IconButton label="Powiadomienia" icon={Bell} variant="ghost" />
        <IconButton label="Zapisz" icon={Heart} pressed={pressed} onClick={() => setPressed(!pressed)} />
        <IconButton label="Szukaj" icon={Search} size="sm" />
        <IconButton label="Wczytuję" icon={Search} loading />
        <IconButton label="Niedostępny" icon={Check} disabled />
        <span className="flex gap-2 rounded-button p-2 media-fallback">
          <IconButton label="Na zdjęciu" icon={Heart} variant="on-media" />
        </span>
      </Specimen>

      <Specimen title="Pill i SegmentedControl">
        <Pill selected>Wybrany</Pill>
        <Pill count={14}>Starzenie się</Pill>
        <Pill icon={<MapPin aria-hidden />}>Z ikoną</Pill>
        <Pill disabled>Niedostępny</Pill>
        <SegmentedControl
          label="Zakres"
          value={segment}
          onValueChange={setSegment}
          options={[
            { value: 'week', label: 'Tydzień' },
            { value: 'month', label: 'Miesiąc' },
            { value: 'year', label: 'Rok' },
          ]}
        />
      </Specimen>

      <Specimen title="SwitchField i UtilityMenu">
        <div className="w-full max-w-xs">
          <SwitchField
            label="Wysoki kontrast"
            description="Czarny tekst na białym tle, wyraźne krawędzie."
            checked={contrast}
            onCheckedChange={setContrast}
          />
        </div>
        <UtilityMenu label="Dostępność" title="Dostępność">
          <p className="text-body-sm text-text-muted">Ustawienia dla całej aplikacji, np. rozmiar tekstu.</p>
        </UtilityMenu>
      </Specimen>

      <Specimen title="Avatar i Badge">
        <Avatar name="Ośrodek Pomocy" size="sm" />
        <Avatar name="Gmina Przykładowa" />
        <Avatar name="Zespół Innowacji" size="lg" />
        <Badge>Neutralny</Badge>
        <Badge tone="strong">Mocny</Badge>
        <Badge tone="success" icon={<Check aria-hidden />}>
          Odpowiedź
        </Badge>
        <Badge tone="warning">W analizie</Badge>
        <Badge tone="danger" icon={<TriangleAlert aria-hidden />}>
          Odrzucone
        </Badge>
      </Specimen>

      <Section title="Pola formularza" titleAs="h3">
        <CeramicCard padding="lg" className="grid gap-5 md:grid-cols-2">
          <TextField label="Nazwa" placeholder="Np. Klub sąsiedzki" hint="Krótko, do 80 znaków." />
          <TextField label="E-mail" type="email" required error="Podaj adres e-mail w formacie nazwa@domena.pl." />
          <TextField label="Niedostępne" disabled value="Tylko do odczytu" readOnly />
          <SelectField label="Gmina" placeholder="Wybierz gminę" options={sampleMunicipalities} />
          <SelectField label="Gmina (ładowanie)" options={[]} loading />
          <SearchField label="Szukaj" value={query} onValueChange={setQuery} />
          <SearchField label="Szukaj (w toku)" value="opieka" onValueChange={() => undefined} loading />
          <CheckboxField label="Zgadzam się na zapis opisu" hint="Opis zobaczy tylko administrator." />
          <TextAreaField label="Opis" rows={3} fieldClassName="md:col-span-2" />
          <AssetField
            label="Innowacja"
            meta="Wymaga: 2 opiekunów"
            asset={{ name: 'Sieć wsparcia seniorów', symbol: 'S' }}
            onAssetSelect={() => undefined}
            value={{ value: amount, label: 'Liczba odbiorców', onValueChange: setAmount }}
            secondary="planowana liczba odbiorców"
          />
          <AssetField
            label="Gmina"
            meta="Rok danych: 2024"
            asset={{ name: 'Gmina Przykładowa', symbol: <MapPin />, tone: 'accent' }}
            value={{ value: '1 240', label: 'Seniorzy 75+' }}
            error="Brak danych dla tej gminy w 2024 r."
          />
        </CeramicCard>
      </Section>

      <Specimen title="MetricValue">
        <MetricValue label="Zgłoszenia" value="41" trend={{ direction: 'up', label: '+17% m/m' }} />
        <MetricValue label="Indeks starości" value="1,62" hint="Średnia regionu: 1,41" size="lg" />
        <MetricValue
          label="Dzienne domy pomocy"
          value="0"
          unit="placówek"
          trend={{ direction: 'down', label: 'brak w gminie', sentiment: 'negative' }}
        />
      </Specimen>

      <Section title="ListRow i TopBar" titleAs="h3">
        <CeramicCard padding="md" className="grid gap-2">
          <TopBar
            leading={<Avatar name="Gmina Przykładowa" size="sm" />}
            title="Tytuł ekranu"
            trailing={<IconButton label="Powiadomienia" icon={Bell} />}
          />
          <ListRow to="#" leading={<MapPin aria-hidden />} title="Link" description="Opis pod tytułem" />
          <ListRow onClick={() => undefined} title="Przycisk" trailing={<Badge>Nowe</Badge>} />
          <ListRow title="Zaznaczony" selected onClick={() => undefined} />
          <ListRow title="Niedostępny" disabled onClick={() => undefined} />
          <ListRow title="Usuń konto" tone="danger" onClick={() => undefined} />
        </CeramicCard>
      </Section>

      <Section title="Tabs" titleAs="h3">
        <GlassPanel>
          <Tabs
            label="Sekcje karty"
            items={[
              { value: 'opis', label: 'Na czym polega', content: <p className="text-body">Treść pierwszej zakładki.</p> },
              { value: 'grupa', label: 'Grupa docelowa', content: <p className="text-body">Treść drugiej zakładki.</p> },
              { value: 'efekty', label: 'Czy to działa?', content: <p className="text-body">Treść trzeciej zakładki.</p> },
            ]}
          />
        </GlassPanel>
      </Section>

      <Specimen title="Modal, BottomSheet, Toast">
        <SoftButton onClick={() => setModalOpen(true)}>Otwórz modal</SoftButton>
        <SoftButton onClick={() => setSheetOpen(true)}>Otwórz bottom sheet</SoftButton>
        <SoftButton
          onClick={() => showToast({ title: 'Zapisano zmiany', description: 'Karta jest aktualna.', tone: 'success' })}
        >
          Pokaż toast
        </SoftButton>
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Wysłać zgłoszenie?"
          description="Po wysłaniu zgłoszenie trafi do zespołu ROPS."
          footer={
            <>
              <SoftButton onClick={() => setModalOpen(false)}>Anuluj</SoftButton>
              <SoftButton variant="primary" onClick={() => setModalOpen(false)}>
                Wyślij
              </SoftButton>
            </>
          }
        />
        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Wybierz gminę">
          <ul className="grid gap-1">
            {sampleMunicipalities.map((municipality) => (
              <li key={municipality.value}>
                <ListRow title={municipality.label} onClick={() => setSheetOpen(false)} />
              </li>
            ))}
          </ul>
        </BottomSheet>
      </Specimen>

      <Section title="BottomActionDock" titleAs="h3">
        <div className="rounded-panel p-6 ambient-light">
          <BottomActionDock
            label="Działania"
            placement="inline"
            leading={<IconButton label="Wstecz" icon={ArrowLeft} variant="ghost" />}
            primary={
              <SoftButton variant="primary" fullWidth>
                Sprawdź dla mojej gminy
              </SoftButton>
            }
            trailing={<IconButton label="Zapisz" icon={Heart} variant="ghost" />}
          />
        </div>
      </Section>

      <Section title="Stany: ładowanie, pusto, błąd, brak obrazu" titleAs="h3">
        <div className="grid gap-4 lg:grid-cols-2">
          <CeramicCard padding="lg">
            <LoadingState label="Wczytuję innowacje…">
              <div className="flex items-center gap-3">
                <Skeleton shape="circle" className="size-touch" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="w-2/3" />
                  <Skeleton className="w-1/3" />
                </div>
              </div>
              <Skeleton shape="block" className="h-24" />
            </LoadingState>
          </CeramicCard>
          <CeramicCard padding="none">
            <EmptyState
              titleAs="h4"
              title="Brak zgłoszeń"
              description="Gdy mieszkańcy coś zgłoszą, zobaczysz to tutaj."
              action={<SoftButton>Odśwież</SoftButton>}
            />
          </CeramicCard>
          <CeramicCard padding="none">
            <ErrorState titleAs="h4" description="Serwer nie odpowiada. Spróbuj za chwilę." onRetry={() => undefined} />
          </CeramicCard>
          <CeramicCard padding="lg" className="grid grid-cols-2 gap-3">
            <ImageFallback alt="Zdjęcie bez źródła" width={320} height={200} fallbackLabel="Brak zdjęcia" className="rounded-card" />
            <ImageFallback
              src="/nie-ma-takiego-pliku.jpg"
              alt="Zdjęcie, które się nie wczytało"
              width={320}
              height={200}
              fallbackLabel="Nie udało się wczytać"
              className="rounded-card"
            />
          </CeramicCard>
        </div>
      </Section>
    </div>
  )
}
