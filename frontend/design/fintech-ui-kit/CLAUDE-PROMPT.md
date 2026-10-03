# Prompt dla Claude / Claude Code

Skopiuj tekst od sekcji „START PROMPTU”. Uzupełnij pola w nawiasach kwadratowych i dołącz obie referencje z katalogu `references/`.

---

## START PROMPTU

Jesteś senior frontend engineerem i UI engineerem specjalizującym się w pixel-perfect implementacjach React/Next.js. Masz przebudować istniejącą aplikację tak, aby pierwszy ekran odwzorowywał układ `references/reference-layout-sleep.jpg`, a cała aplikacja używała języka wizualnego `references/reference-style-fintech.jpg`.

### KONTEKST PROJEKTU

- Repozytorium: `[NAZWA / ŚCIEŻKA]`
- Stack: `[np. Next.js 15, React 19, TypeScript, Tailwind CSS v4]`
- Package manager: `[pnpm/npm/yarn/bun]`
- Ekran do przebudowy: `[ROUTE / NAZWA]`
- Zachować obecną logikę biznesową: `TAK`
- Dozwolone nowe zależności: `[NIE / lista]`

### ŹRÓDŁA PRAWDY

1. `DESIGN.md` — obowiązkowe zasady design systemu.
2. `references/reference-layout-sleep.jpg` — kanoniczna referencja układu i hierarchii pierwszego ekranu.
3. `references/reference-style-fintech.jpg` — kanoniczna referencja stylu całej aplikacji.
4. Aktualna logika i model danych w repozytorium — nie wolno ich zepsuć.
5. `styles/fintech-theme.css` — bazowe tokeny i primitive classes.

Jeżeli istniejący kod koliduje z wyglądem, zmień warstwę prezentacji. Jeżeli wymaganie wizualne koliduje z dostępnością lub funkcją, zachowaj funkcję i dostępność, a wygląd zbliż maksymalnie bez łamania tych zasad.

### CEL

Zachowaj kompozycję pierwszego ekranu Sleep możliwie 1:1, ale przestyluj go oraz resztę aplikacji jako jasny, monochromatyczny fintech UI oparty na mlecznych powierzchniach, satynowym szkle, delikatnym ambient light, precyzyjnej typografii i miękkiej geometrii. Efekt ma być bardzo bliski referencji, a nie „luźno inspirowany”. To nie może wyglądać jak generyczny dashboard SaaS ani ciężki neumorphism.

### TRYB PRACY

Wykonaj zadanie etapowo. Nie zaczynaj od masowej edycji komponentów.

#### Etap 1 — audyt

1. Przeczytaj strukturę repozytorium, globalne style, layouty i komponenty współdzielone.
2. Zidentyfikuj routing, źródła danych, formularze, interakcje i testy.
3. Wypisz pliki, które planujesz zmienić, oraz krótko uzasadnij każdą zmianę.
4. Sprawdź, czy projekt ma już biblioteki ikon, fontów, animacji i class merging. Reużyj ich zamiast dublować zależności.
5. Nie zmieniaj API, modeli danych, autoryzacji ani logiki biznesowej bez konieczności.

#### Etap 2 — design foundation

1. Dodaj semantyczne tokeny CSS z `styles/fintech-theme.css` do globalnej warstwy stylów.
2. Ustaw font UI na Satoshi lub istniejący kompatybilny grotesk. Ustaw Instrument Serif tylko dla wybranych tytułów i dużych wartości.
3. Zbuduj lub popraw primitives: `AppShell`, `TopBar`, `GlassPanel`, `SoftButton`, `IconButton`, `Pill`, `AssetField`, `BottomActionDock`.
4. Nie hardcoduj powtarzalnych kolorów, cieni, radiusów i spacingu wewnątrz komponentów. Używaj tokenów.
5. Najpierw zbuduj mały `/design-test` albo Storybook story prezentujący powierzchnie, typografię i stany komponentów. Jeśli projekt nie ma routingu testowego, utwórz tymczasowy komponent development-only.

#### Etap 3 — ekran wzorcowy

1. Zaimplementuj ekran Sleep detail w pierwszej kolejności, zachowując: hero 54–56% wysokości, top controls, wycentrowane hero copy, pięć okrągłych kategorii, nachodzący falujący sheet, metadata, dwuwierszowy tytuł, opis i sound rail.
2. Bazowy viewport porównania: `390 × 844 px`.
3. Na ekranie Sleep zachowaj kolejność i proporcje pierwszej referencji; na pozostałych ekranach stosuj safe area → top bar → primary content → secondary content → bottom action dock.
4. Użyj jednej dominującej akcji. Pozostałe akcje powinny być secondary albo icon-only.
5. Dane finansowe renderuj z cyframi tabelarycznymi.
6. Używaj realnych danych i assetów z projektu. Nie dodawaj lorem ipsum ani przypadkowych mocków, jeżeli repo ma dane.

#### Etap 4 — propagacja

Po zaakceptowaniu ekranu wzorcowego przenieś te same primitives i tokeny na pozostałe widoki. Nie kopiuj dużych bloków klas. Jeśli wzorzec pojawia się co najmniej dwa razy, wydziel komponent lub wariant.

#### Etap 5 — QA

1. Sprawdź 375, 390, 430, 768, 1024 i 1440 px.
2. Na mobile nie może być poziomego overflow.
3. Touch target ma minimum 44 × 44 px.
4. Obsłuż `:hover`, `:focus-visible`, `:active`, disabled, loading, empty i error.
5. Obsłuż `prefers-reduced-motion`.
6. Sprawdź kontrast WCAG AA; półprzezroczyste powierzchnie nie mogą obniżyć czytelności.
7. Uruchom lint, typecheck i dostępne testy. Napraw problemy w zmienianym zakresie.
8. Nie kończ na opisie — dokonaj rzeczywistych zmian w kodzie.

### BEZWZGLĘDNE ZASADY WIZUALNE

- Tło aplikacji: jasne chłodno-ciepłe szarości, nie czysta biel.
- Karty: mleczne, półprzezroczyste, blur 18–24 px, subtelny biały highlight.
- Cienie: rozproszone, wielowarstwowe, o niskiej alfie; zero ciężkiej czerni.
- Radius: app shell 40 px, panel 24–28 px, karta 18–22 px, pill 999 px.
- Typografia: kompaktowa; page title 24–28 px, body 15–16 px, labels 12–13 px, nigdy poniżej 12 px.
- Kolor: neutralny UI; zielony, żółty i czerwony wyłącznie dla danych/statusów.
- Ikony: jedna biblioteka SVG, 18–20 px, stroke 1.5–1.75.
- Przyciski: grafitowy primary; mleczny secondary; bez gradientów.
- Bottom dock: pływająca mleczna kapsuła z jedną dominującą akcją.
- Wykres: cienka grafitowa linia, niemal niewidoczne gridlines, bez gradientowego area fill.

### ZAKAZANE

- Niebiesko-fioletowe gradienty, neon glow, gradient text.
- Generyczne karty dashboardowe z grubym borderem.
- Kolorowy pasek po lewej stronie karty.
- Ten sam wielki radius na każdym elemencie.
- Blur na tekście lub nadmierne warstwy szkła.
- Font mniejszy niż 12 px.
- Animowanie layoutu przez `width/height/top/left`, jeśli można użyć `transform/opacity`.
- Zastąpienie istniejącej logiki statycznym mockiem.
- Wprowadzanie nowej biblioteki UI bez uzasadnienia.

### WYMAGANIA IMPLEMENTACYJNE

- TypeScript bez `any`, chyba że istniejący typ zewnętrzny wymaga izolowanego obejścia z komentarzem.
- Semantyczny HTML; realne `button`, `nav`, `header`, `main`, `section`, `label`.
- Icon-only button ma `aria-label`; tooltip na desktopie.
- Wartości wpisywane jako kwoty mają `inputmode="decimal"`.
- Klasy i warianty komponentów powinny być przewidywalne. Jeśli repo używa `cva`, wykorzystaj `cva`; inaczej zastosuj prosty typed variant map.
- Nie używaj inline styles, chyba że wartość jest dynamiczna i nie da się jej opisać klasą lub custom property.
- Dodaj fallback `background` przed `backdrop-filter`.
- Obrazy i logotypy mają poprawne `alt`, wymiary i stabilny layout.

### FORMAT ODPOWIEDZI

Najpierw pokaż:

1. Krótką diagnozę aktualnej architektury UI.
2. Plan zmian w plikach.
3. Ryzyka i założenia.

Potem wykonaj implementację. Na końcu pokaż:

1. Listę zmienionych plików.
2. Co zostało odwzorowane z layoutu pierwszej referencji i co ze stylu drugiej.
3. Wyniki lint/typecheck/test.
4. Elementy wymagające mojego review wizualnego.
5. Krótką checklistę porównania screenshotu 390 × 844 px.

Nie deklaruj „pixel-perfect” bez wykonania porównania screenshotów. Jeśli nie masz narzędzia screenshot-diff, napisz wprost, co powinienem porównać ręcznie.

## KONIEC PROMPTU
