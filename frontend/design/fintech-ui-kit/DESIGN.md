# DESIGN — Soft Frosted Fintech

## 1. Cel

Połączyć dwie role referencji bez mieszania ich odpowiedzialności:

- `references/reference-layout-sleep.jpg` jest źródłem prawdy dla **układu pierwszego ekranu**: immersyjny hero, nawigacja, rząd kategorii na granicy sekcji, falujący biały sheet, tytuł treści i poziomy rail dźwięków.
- `references/reference-style-fintech.jpg` jest źródłem prawdy dla **globalnego stylu całej aplikacji**: jasny, niemal monochromatyczny fintech, mleczne powierzchnie, szkło satynowe, miękka głębia i precyzyjna typografia.

Rezultat ma zachowywać kompozycję i hierarchię ekranu Sleep możliwie 1:1, lecz nie kopiować jego ciemnozielonej estetyki. Ten sam ekran należy przestylować materiałami z drugiej referencji. To nie jest klasyczny neumorphism: bazą jest **frosted glass + ceramic surface + ambient shadow**.

## 2. Kierunek wizualny

Pięć filarów:

1. **Kolor:** neutralna, chłodno-ciepła szarość; prawie cały interfejs jest achromatyczny. Kolor pojawia się tylko w danych, aktywach i statusach.
2. **Typografia:** spokojny grotesk do nawigacji i opisów; elegancki serif wyłącznie dla wybranych tytułów i dużych wartości.
3. **Powierzchnie:** półprzezroczyste biele z rozmyciem tła, mleczne karty, delikatny wewnętrzny highlight.
4. **Geometria:** iOS-owe proporcje, miękkie narożniki, dużo kapsułek, cienkie obrysy.
5. **Głębia:** szerokie, rozproszone cienie o małej alfie. Żadnych ciężkich czarnych cieni.

Słowa kontrolne: `quiet luxury`, `soft industrial`, `frosted ceramic`, `precision`, `editorial fintech`, `calm`.

## 3. Hierarchia kolorów

### Tokeny bazowe

| Rola | Wartość startowa | Zastosowanie |
|---|---:|---|
| Canvas | `#D8D9DC` | Tło desktopu i obszary poza aplikacją |
| App background | `#E8E8E4` | Główna powierzchnia aplikacji |
| Surface 1 | `rgba(250,250,247,.58)` | Duże panele i sekcje |
| Surface 2 | `rgba(255,255,252,.76)` | Karty, formularze, panele transakcji |
| Surface solid | `#F2F2EE` | Fallback bez blur |
| Text | `#171816` | Tytuły, wartości, ikony |
| Text muted | `#686B67` | Opisy, etykiety pomocnicze |
| Text faint | `#949792` | Dane trzeciorzędne |
| Border | `rgba(28,30,27,.10)` | Obrysy kart |
| Highlight | `rgba(255,255,255,.72)` | Górny highlight powierzchni |
| Green | `#359879` | Wzrost, USDT, sukces |
| Yellow | `#E6B928` | BNB i ostrzeżenia aktywów |
| Danger | `#A75959` | Tylko błędy/destrukcja |

Kolor akcentowy nie może dominować. Na typowym ekranie 85–95% powierzchni pozostaje neutralne.

### Tło ambientowe

Tło nie jest płaskie, ale gradient ma być niemal niewidoczny. Stosuj maksymalnie trzy miękkie plamy światła:

```css
background:
  radial-gradient(70% 45% at 50% 42%, rgba(255,255,255,.52), transparent 72%),
  radial-gradient(40% 30% at 18% 72%, rgba(181,194,188,.16), transparent 80%),
  linear-gradient(145deg, #dde0e2 0%, #d2d3d6 100%);
```

Nie stosuj fioletu, neonów, mocnych gradientów, gradientowego tekstu ani kolorowych poświat.

## 4. Typografia

### Fonty

Preferowana para bezpłatna:

- UI/body: `Satoshi`, fallback `Inter`, `system-ui`, `sans-serif`.
- Display/value: `Instrument Serif`, fallback `Georgia`, `serif`.
- Dane tabelaryczne: Satoshi z `font-variant-numeric: tabular-nums lining-nums`.

Serif nie może być używany do małych labeli, przycisków ani długiego tekstu. Używaj go oszczędnie: tytuł ekranu, nazwa produktu, duża kwota.

### Skala mobilna

| Element | Rozmiar | Waga / line-height |
|---|---:|---|
| Page title | 24–28 px | serif 400 / 1.05 |
| Large amount | 30–34 px | serif 400 / 1.0 |
| Section title | 18–20 px | serif 400 lub sans 500 / 1.15 |
| Body | 15–16 px | 400 / 1.45 |
| Button | 14 px | 500 / 1 |
| Label | 12–13 px | 500 / 1.25 |
| Micro metadata | 12 px minimum | 400 / 1.25 |

Nie używaj uppercase poza bardzo krótkimi symbolami aktywów. Tracking zazwyczaj `-0.01em`; duże liczby `-0.035em`.

## 5. Siatka i proporcje

### Kanoniczny viewport

Projektuj i porównuj na `390 × 844 px`. Dopuszczalny zakres aplikacji mobilnej: `375–430 px`.

### Mobile shell

- Gutter poziomy: 16 px.
- Gutter sekcji: 20–24 px.
- Safe area top: `max(12px, env(safe-area-inset-top))`.
- Safe area bottom: `max(12px, env(safe-area-inset-bottom))`.
- Minimalny touch target: 44 × 44 px.
- App shell: pełny viewport na telefonie; w desktop preview maks. 390 px i promień 36–42 px.

### Rytm odstępów

Używaj wyłącznie skali: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` px.

Najczęstsze ustawienia:

- Ikona + tekst: 8 px.
- Label + wartość: 8–12 px.
- Padding małej kapsułki: 8 px pion / 12–16 px poziom.
- Padding karty: 16–20 px.
- Odstęp kart: 8–12 px.
- Odstęp sekcji: 24–32 px.

## 6. Promienie

| Element | Radius |
|---|---:|
| App shell | 40 px |
| Duży panel | 28 px |
| Standardowa karta | 20 px |
| Input / asset row | 18 px |
| Small control | 14 px |
| Pill | 999 px |
| Okrągły icon button | 50% |

Promień wewnętrznego elementu zawsze pomniejsz o odstęp od zewnętrznego kontenera. Nie dawaj wszystkim elementom identycznego radiusu.

## 7. Materiał i głębia

### Standardowa karta szkła

```css
background: rgba(255, 255, 252, .62);
backdrop-filter: blur(22px) saturate(.82);
-webkit-backdrop-filter: blur(22px) saturate(.82);
border: 1px solid rgba(255, 255, 255, .52);
box-shadow:
  inset 0 1px 0 rgba(255,255,255,.70),
  0 1px 2px rgba(36,38,34,.05),
  0 14px 36px rgba(36,38,34,.08);
```

### Ceramiczna karta pierwszego planu

```css
background: rgba(247, 247, 243, .90);
border: 1px solid rgba(31,33,30,.08);
box-shadow:
  inset 0 1px 0 rgba(255,255,255,.82),
  0 18px 44px rgba(43,45,41,.12);
```

### Ikonowy przycisk

Okrąg lub kapsułka; białawy środek, prawie niewidoczny border, wewnętrzny highlight i krótki cień kontaktowy. Aktywny wariant jest grafitowy z jasną ikoną.

## 8. Kanoniczny ekran 1:1 — Sleep detail

Ten ekran odwzorowuje strukturę `reference-layout-sleep.jpg`, ale korzysta z jasnego systemu wizualnego z `reference-style-fintech.jpg`.

### Podział wysokości 390 × 844 px

- **Hero media:** od y=0 do około y=462, czyli 54–56% viewportu.
- **Top controls:** w safe area; back po lewej, favorite i menu po prawej.
- **Hero copy:** wycentrowane około y=118–196; tytuł 26–28 px, lead maks. 30–34 znaki w wierszu.
- **Category orbit:** rząd pięciu okrągłych kategorii około y=334–424. Środkowa kategoria jest aktywna i większa/optycznie jaśniejsza.
- **Content sheet:** zaczyna się wizualnie około y=438, nachodzi na hero i wypełnia dół. Jego górna krawędź tworzy szeroki, płytki łuk — środek jest niżej niż boki o około 28–36 px.
- **Drag handle:** wycentrowany na sheet, 32 × 4 px.
- **Metadata:** jedna linia, 12–13 px, około 28–36 px pod handle.
- **Content title:** 30–34 px, maks. dwa wiersze, szerokość około 320 px.
- **Description:** 14–15 px, maks. 3 wiersze, szerokość 300–320 px.
- **Sound rail:** przy dolnej części sheet; cztery okrągłe miniatury 66–76 px z gap 8–10 px.

### Jasna reinterpretacja hero

Hero nadal używa pełnokadrowej fotografii, ale nakładka powinna być chłodno-szara, a nie zielono-czarna. Dodaj gradient poprawiający kontrast białego tekstu. W miejscu kategorii zastosuj translucent circles z blur; aktywna kategoria jest mlecznobiała z grafitową ikoną. Sheet korzysta z ceramicznego `--ft-surface-2`, delikatnego border highlight i ambient shadow.

### Geometria falującego sheet

Preferowana implementacja to pseudoelement lub dodatkowa warstwa eliptyczna, nie SVG dekoracyjne:

```css
.ft-content-sheet::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -8%;
  top: -44px;
  width: 116%;
  height: 88px;
  background: inherit;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
}
```

Dostosuj wysokość łuku na podstawie screenshot-diff. Krawędź nie może wyglądać jak ostra fala ani przypadkowy blob.

### Zachowania

- Back wraca do poprzedniego widoku.
- Favorite przełącza stan z czytelnym `aria-pressed`.
- Kategoria zmienia content z płynnym fade/translateY, bez teleportowania.
- Kliknięcie sound chip rozpoczyna playback i zmienia go w aktywny control.
- Sheet może być statyczny; drag handle nie sugeruje przeciągania, jeśli funkcja nie istnieje. W takim przypadku ma być tylko subtelnym separatorem albo należy go usunąć.

## 8. Architektura ekranu

Pozostałe ekrany aplikacji składają się w tej kolejności:

1. **Status/safe area** — bez niestandardowych ozdobników.
2. **Top bar** — avatar lub back po lewej, wycentrowany tytuł/logo, akcja po prawej.
3. **Primary content** — jeden dominujący cel: szczegóły aktywa, wybór karty albo swap.
4. **Secondary content** — metadane, wykres, opis lub warianty.
5. **Bottom action dock** — pływająca kapsułka z jedną akcją główną i maksymalnie dwiema pobocznymi.

Nie używaj klasycznego desktopowego sidebaru na mobile. Na desktopie aplikacja może dostać lewą nawigację, ale musi zachować ten sam materiał, kolor i gęstość.

## 9. Komponenty

### AppShell

- Minimalna wysokość `100dvh`.
- Tło `--ft-bg-app` plus 2–3 rozmyte plamy ambientowe.
- `overflow: clip`; zawartość przewijana w jednym regionie.
- Opcjonalna subtelna tekstura noise o opacity 1.5–2.5%.

### TopBar

- Wysokość wizualna: 52–56 px.
- Środek jest geometrycznie wycentrowany niezależnie od szerokości bocznych akcji.
- Icon buttons: 44 × 44 px, ikona 18–20 px, stroke 1.5.
- Brak ciężkiego separatora pod top barem.

### GlassPanel

- Radius 24–28 px.
- Padding 16–20 px.
- Jedna warstwa szkła wystarcza; nie zagnieżdżaj więcej niż dwóch rozmytych powierzchni.
- Border jest światłem, nie szarą ramką.

### AssetField

- Dwie kondygnacje: mały label/balance na górze, token i wartość niżej.
- Symbol + nazwa po lewej, wartość wyrównana do prawej.
- `font-variant-numeric: tabular-nums`.
- Wysokość 104–116 px.
- Ikona aktywa może mieć kolor; reszta pozostaje neutralna.

### SegmentedPills

- Całość bez widocznego kontenera albo w bardzo subtelnej mlecznej kapsule.
- Aktywna pozycja: grafitowe wypełnienie, biały tekst.
- Nieaktywne: mleczne tło, tekst muted.
- Wysokość 32–36 px, label 12–13 px.

### SoftButton

- Primary: grafitowe tło `#343633`, jasny tekst; bez gradientu.
- Secondary: mleczne tło + highlight + neutralny border.
- Ghost: brak wypełnienia, tylko tekst/ikona.
- Wysokość 44–48 px, radius pill.
- `:active`: scale `.98` i skrócony cień. Hover tylko na urządzeniach z hover.

### BottomActionDock

- `position: sticky` lub `fixed` z uwzględnieniem safe area.
- Mleczna kapsuła 52–60 px wysokości.
- Główna akcja zajmuje większość szerokości; action icon po lewej, menu po prawej.
- Backdrop blur 20–24 px; cień szerszy niż na zwykłych kartach.

### FinanceCard

- Proporcja zbliżona do `1.586`.
- Radius 24 px.
- Tło rozmyte, ale tekst i brand muszą być ostre.
- Numer karty maskowany, wyrównany do dolnego lewego rogu.
- Logo sieci płatniczej w dolnym prawym rogu.

### Chart

- Cienka linia 1.25–1.5 px, grafit 80–90%.
- Brak kolorowego gradientu pod wykresem.
- Gridlines maksymalnie 6–8% czerni.
- Osie i podpisy 12 px minimum.
- Aktywny punkt: mały grafitowy punkt i mleczny tooltip.

## 10. Ikonografia

Używaj `Lucide React`, `Phosphor` lub istniejącego zestawu projektu. Jedna biblioteka na całą aplikację.

- Domyślny rozmiar: 18 px.
- Nawigacja: 20 px.
- Stroke: 1.5–1.75.
- Ikony tylko jako SVG; bez emoji.
- Icon-only button zawsze ma `aria-label` i tooltip na desktopie.

## 11. Motion

Ruch ma być dyskretny i fizyczny.

- Hover/focus: 160–180 ms.
- Wejście panelu: 280–360 ms.
- Spring dla kart/karuzeli: `stiffness 280`, `damping 28`, `mass .8`.
- Easing ogólny: `cubic-bezier(.16,1,.3,1)`.
- Przejście ekranu: opacity + translateY 8 px; żadnego dużego slide'u.
- Wszystkie animacje wyłączone lub skrócone przy `prefers-reduced-motion`.

## 12. Responsywność

### 375–767 px

Pełnoekranowa aplikacja, jedna kolumna, bottom dock. Karty zachowują duże promienie, ale padding schodzi do 16 px.

### 768–1199 px

Centrowany shell lub układ dwukolumnowy: główny workflow 420–520 px + panel kontekstowy. Nawigacja może być ikonowa.

### 1200 px+

Nie rozciągaj mobilnych kart na całą szerokość. Użyj desktopowego canvasu z max-width 1280 px, panelami 360–480 px i dużą ilością oddechu. Materiał oraz typografia pozostają identyczne.

## 13. Dostępność

- Kontrast body text minimum 4.5:1; duży tekst 3:1.
- Tekst muted nadal musi przejść 4.5:1, jeśli ma 12–16 px.
- Kolor nie może być jedynym nośnikiem statusu.
- Touch targets minimum 44 × 44 px.
- Focus ring: 2 px grafitowy lub zielony, offset 3 px.
- Formularze mają realne `<label>`; wartości transakcji korzystają z `inputmode="decimal"`.
- Interfejs działa klawiaturą; Escape zamyka sheet/modal.

## 14. Czego nie robić

- Nie zamieniaj tego w standardowy biały dashboard SaaS.
- Nie używaj mocnego neumorphismu, czarnych cieni ani grubych obrysów.
- Nie dodawaj niebiesko-fioletowych gradientów, neonów i glow.
- Nie stosuj glassmorphismu na każdym elemencie; blur jest dla warstw, nie dla tekstu.
- Nie używaj dużych, ciężkich nagłówków sans-serif.
- Nie dodawaj kart z kolorowym paskiem po lewej.
- Nie używaj identycznego radiusu wszędzie.
- Nie zmniejszaj tekstu poniżej 12 px.
- Nie ustawiaj wielu równorzędnych CTA.

## 15. Procedura „1:1”

1. Zbuduj jeden ekran wzorcowy w 390 × 844 px.
2. Wykonaj screenshot bez skalowania przeglądarki.
3. Nałóż screenshot na referencję z opacity 50% lub użyj pixel-diff.
4. Najpierw popraw: bounding boxy, osie wyrównania, wysokości sekcji i promienie.
5. Następnie popraw fonty, line-height, tracking i wagi.
6. Na końcu popraw blur, alfy borderów, cienie oraz ambient light.
7. Zaakceptuj ekran dopiero po sprawdzeniu 375, 390, 430 i 768 px.

## 16. Kryteria ekranu Sleep

- [ ] Hero zajmuje 54–56% wysokości bazowego viewportu.
- [ ] Copy, controls i category orbit zachowują osie i kolejność z pierwszej referencji.
- [ ] Sheet nachodzi na hero szerokim, płytkim łukiem; nie jest zwykłą prostokątną kartą.
- [ ] Metadata, dwuwierszowy tytuł, opis i sound rail odpowiadają hierarchii pierwszej referencji.
- [ ] Kolor, powierzchnie, cienie, typografia i kontrolki odpowiadają drugiej referencji.
- [ ] Nie pozostały ciemnozielone komponenty poza samą fotografią, jeśli asset tego wymaga.

## 17. Definition of Done

- [ ] Widok 390 × 844 odpowiada referencji pod względem proporcji i rytmu.
- [ ] Maksymalnie jedna dominująca akcja na ekran.
- [ ] Neutralne powierzchnie zajmują co najmniej 85% UI.
- [ ] Wszystkie wartości finansowe mają cyfry tabelaryczne.
- [ ] Każdy interaktywny element ma hover, focus i active.
- [ ] Brak tekstu poniżej 12 px i targetów poniżej 44 px.
- [ ] Blur ma fallback dla przeglądarek bez `backdrop-filter`.
- [ ] `prefers-reduced-motion` jest obsłużone.
- [ ] Brak poziomego overflow przy 375 px.
- [ ] Desktop nie jest rozciągniętym mobilem; korzysta z kontrolowanych paneli.
