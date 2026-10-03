# DESIGN — Civic Product / Tactile Utility (v3)

Źródło prawdy dla wyglądu Castora. Zastępuje v1 („Soft Frosted Fintech") i v2 („Niebo i szkło"), które wyglądały jak szablon landing page'a.

## 1. Klasyfikacja i słowa kluczowe

Castor to **interfejs produktu usługi publicznej**: nie landing page SaaS, nie kampania, nie strona wellness, nie dashboard administracyjny, nie portal urzędowy z 2015 roku.

Słowa kluczowe: grounded, trustworthy, calm, tactile, precise, local, human, restrained, functional.
Zakazane: dreamy, ethereal, futuristic, wellness, aurora, magical, playful SaaS, glass dashboard.

Zasada nadrzędna: jeśli decyzja wizualna nie wynika z referencji ani z funkcji produktu, nie dodajemy jej.

## 2. Referencje

`fintech-ui-kit/references/` (`reference-style-zenvest.jpg`, `reference-layout-sleep.jpg`, `reference-style-fintech.jpg`) są kontraktem dla **jakości i dyscypliny**: jeden dominujący element interaktywny, wyraźne warstwy, mocna hierarchia, spokojna prawie monochromatyczna paleta, precyzyjne powierzchnie, ciemny przycisk główny. Nie przenosimy z nich pastelowych tła, rozmytego szkła ani motywów dekoracyjnych. Tam, gdzie referencje i ta specyfikacja się różnią, wygrywa specyfikacja.

## 3. Kolor

Tokeny w `src/design-system/tokens.css`. Ciepłe, lekko zielonkawe neutrale; ciemna zieleń tylko dla głównej akcji, stanów aktywnych i marki. Bez gradientów, poświat, kul i blura.

| Token | Wartość | Rola |
|---|---|---|
| `canvas` / `app` | `#E9EBE5` | Tło strony (bg). |
| `surface-glass`, `surface-solid` | `#F4F4EF` | Pas informacyjny, stopka, hover (surface). |
| `surface-glass-strong`, `surface-ceramic` | `#FCFCF8` | Główna powierzchnia, pola, popover (surface-strong). |
| `text-primary` | `#111613` | Tekst (ink). |
| `text-muted`, `text-faint` | `#626A65` | Opisy, etykiety, placeholdery. |
| `border-subtle` | `rgba(17,22,19,.12)` | Linie (line). |
| `border-strong` | `#7C847F` | Obrys pól i przycisków drugorzędnych. |
| `surface-active`, `accent`, `focus` | `#173F38` | Główna akcja, stan aktywny, marka, obwódka focusu (primary). |
| `primary-hover` | `#0F302B` | Główna akcja po najechaniu. |
| `chip` | `#C8D8CF` | Aktywne tło (accent-soft). |
| `danger` | `#9B2C2C` | Komunikaty błędu. |

Nazwy `surface-glass*` są historyczne: wszystkie powierzchnie są nieprzezroczyste.

Zmierzone kontrasty (WCAG): ink na bg 15,2:1; muted na bg 4,64:1, na surface 5,05:1, na surface-strong 5,42:1; tekst przycisku głównego 11,3:1; obrys `border-strong` 3,20:1 na bg i 3,74:1 na surface-strong (WCAG 1.4.11); danger 7,3:1; focus na bg 9,7:1. Zakres 4,5:1 dla muted na bg jest wąski, więc nie jaśniej.

Kolor nigdy nie niesie znaczenia sam. Wysoki kontrast podmienia tokeny na czarno-białe (`:root[data-contrast='high']`).

## 4. Typografia

Jedna rodzina: **Satoshi** (Indian Type Foundry, Fontshare), self-hosted: `src/assets/fonts/Satoshi-Variable.woff2` (zmienna waga, `fonts.css`). Bez serifa, bez bardzo cienkich odmian.

| Token | Rozmiar (desktop) | Waga | Zastosowanie |
|---|---|---|---|
| `text-logo` | 24 px | 600 | Marka. |
| `text-eyebrow` | 14 px | 500 | Linia nad nagłówkiem. |
| `text-hero` | clamp(44 px, 5vw, 72 px), lh 1,05, −0,02 em | 500 | Jedno `h1`, najwyżej 3 linie. |
| `text-lead` | 18–20 px | 400 | Opis pod nagłówkiem. |
| `text-section-title` | 22–28 px | 500 | `h2` sekcji. |
| `text-body` | 16–18 px | 400/500 | Tekst główny i tekst w polu. |
| `text-body-sm`, `text-label` | 15–16 px, 14–16 px | 400/500 | Opisy, etykiety. Nic poniżej 14 px. |
| przycisk | 15–16 px | 600 | `text-body-sm` z `font-semibold`. |

## 5. Układ

- Pełny viewport, treść `PageContainer` do **1240 px**, marginesy 32 px (20 px na telefonie), siatka 12 kolumn, odstęp 24 px.
- **Header** 76 px: marka po lewej, przycisk „Dostępność" po prawej. Bez nawigacji (pojawia się dopiero przy więcej niż jednej trasie) i bez linii.
- **Product area** (`StartTemplate`) ok. 540 px: komunikat w kol. 1–5, narzędzie w kol. 7–12. Jedna główna powierzchnia interaktywna.
- **Information band**: zmiana tła na `surface` i linia 1 px, bez fal i kart. Sekcje (`BandSection`) mają tytuł w kol. 1–3 i `RuledList` w kol. 4–12. Początek pasa jest widoczny przed foldem.
- Mobile: jedna kolumna, przycisk główny na pełną szerokość (container query w `rem`, więc reaguje też na duży tekst).

## 6. Powierzchnie i promienie

- Maksymalnie: jedna główna powierzchnia interaktywna, jedna opcjonalna drugorzędna i popover po otwarciu. Sekcji informacyjnych nie opakowujemy w karty, szkło, bento ani ikony w kółkach: używamy typografii, linii, numeracji, odstępów i zmiany tła.
- Główna powierzchnia: promień 22, padding 20–24, tło `surface-strong`, obrys `border-strong`, jedna warstwa cienia (`shadow-card`). Bez blura i gradientu.
- Promienie: control 10 · button i pole 14 · card 16 · panel 22. Koła tylko dla statusu, przełącznika i awatara. Nie ma promienia pill.
- Przyciski: główny min. 48 px, ciemna zieleń, tekst `text-inverse`, wewnętrzne światło 1 px zamiast cienia; drugorzędny z obrysem `border-strong`.

## 7. Komponenty

Z `@/design-system`. Ekrany używają wyłącznie komponentów i tokenów systemu; brakujący element dodajemy najpierw tam i do podglądu `/design-system`.

| Komponent | Rola |
|---|---|
| `AppShell` | Skip link, header, `main`, stopka. Bez ramki. |
| `UtilityMenu` | Przycisk „Dostępność" (na telefonie sama ikona z nazwą) i panel ustawień. |
| `SwitchField` | Przełącznik: stan niesie położenie kółka i wypełnienie. |
| `StartTemplate` | Ekran wejściowy: komunikat + narzędzie + pas informacyjny. |
| `PromptCard` | Główne pole: etykieta, textarea, „Dyktuj" (drugorzędny, z tooltipem), jedna główna akcja. |
| `BandSection`, `RuledList` | Pas informacyjny: tytuł + wiersze z liniami i numeracją. |

Szablon `ImmersiveDetailTemplate` (ze zdjęciem) zostaje do ekranów szczegółów; dziedziczy tokeny.

## 8. Dostępność jako część systemu

- Panel „Dostępność": rozmiar tekstu (A / A+ / A++), wysoki kontrast, ograniczenie animacji (`data-motion="reduce"`, obok ustawienia systemu). Wybór zapamiętuje przeglądarka.
- Układ w `rem`, więc tekst skaluje wszystko; `body` ma `min-width: 320px` (w px celowo), a przy dużym tekście przycisk przechodzi do własnego wiersza.
- Focus: 2 px `focus` (3 px w wysokim kontraście), offset 3 px; przy polu obwódka otacza całą powierzchnię.
- Cele dotykowe min. 44 × 44 px; skip link „Przejdź do treści".
- Dyktowanie (Web Speech API) działa w Chrome i Edge. Pole tekstowe jest zawsze, a przeglądarki bez dyktowania dostają widoczną informację.

## 9. Motion

Tylko: hover i focus 160 ms, panel „Dostępność" (opacity + przesunięcie o 6 px, 200 ms), zmiana stanu przycisku, a później rozwinięcie kolejnego etapu formularza. Bez parallaxu, scroll-jackingu, wejść każdej sekcji i animowanych teł. Przy `prefers-reduced-motion` i „Ogranicz animacje" wszystko jest natychmiastowe.

## 10. Obrazy i dekoracje

Bez dekoracji. Nie generujemy obrazów. Jeśli kiedyś potrzebny będzie motyw: oryginalna fotografia lokalnego miejsca, mapa lub fragment mapy, materiał dokumentalny albo abstrakcja z danych o regionie. Zaplanowany, ale na razie pominięty gest wyróżniający: bardzo delikatny (≤ 4–6% krycia) kontur Małopolski w tle, tylko z prawdziwymi danymi granic.

## 11. Weryfikacja

Screenshoty Playwright (1440 × 900, 1280 × 800, 768 × 1024, 390 × 844, 375 × 667, 200% zoom, reduced motion, wysoki kontrast z A++) i pisemna ocena względem referencji: czy to produkt, a nie landing page; czy nie ma przypadkowej dekoracji; czy pole jest oczywistym początkiem; czy karta jest tylko tam, gdzie ma sens; czy następna sekcja jest widoczna przed foldem. Dodatkowo `chop npm run build` i `chop npm run lint` bez błędów.
