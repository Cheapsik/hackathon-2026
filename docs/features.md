# Feature'y

Źródła: [`REQUIREMENTS.md`](REQUIREMENTS.md) (brief ROPS), [`SPEC.md`](SPEC.md) (decyzje zespołu). Ten plik doprecyzowuje zachowania, których brief i spec opisują tylko częściowo.

Nazwy encji: **zgłoszenie** (`ProblemReport`), **wątek** (`Thread`), **innowacja** (`Innovation`), **dopasowanie** (`MatchResult`), **pomysł** (`Idea`), **załącznik** (zdjęcie przy zgłoszeniu lub pomyśle), **reguła zatwierdzeń** (`ExpertApprovalRule`), **reguła wymaganych pól** (`SubmissionRequirementRule`), **ocena pomysłu** (`IdeaReview`), **obszar** (`ChallengeArea`). Custom fieldy — osobno w feature 3 (nie ma ich w SPEC / assumptions).

**Jedna decyzja użytkownika** przy każdym wyniku AI: *nie / tak / prawie*. Nie ma osobnych list dróg dla „podobnego problemu” i „dopasowanej innowacji” — ta sama trójka, dwa momenty w ścieżce.

**Lokalizacja i zdjęcia** należą do treści zgłoszenia (problemu albo pomysłu/innowacji użytkownika): mapa (gmina + opcjonalny punkt) i 1–3 zdjęcia. To nie jest osobny moduł GIS ani dane geodezyjne urzędowe.

---

## Analiza wymagań (punkt wyjścia)

Brief stawia matchmaking na początku: użytkownik opisuje problem, system szuka podobnych przypadków i proponuje innowacje ([`REQUIREMENTS.md`](REQUIREMENTS.md), moduł I). Ocena patrzy na łatwość zgłoszenia i trafność dopasowania.

Specyfikacja rozdziela dwa wyszukiwania, ale nie zamyka pętli po wyniku:

| Czego szuka system | Po co | Gdzie |
|---|---|---|
| Podobne **zgłoszenia** | uniknąć duplikatu wątku; pokazać, że sprawa wraca | [`SPEC.md`](SPEC.md) §6.4 pkt 5 |
| Podobne **innowacje** | zaproponować gotowe rozwiązanie | [`SPEC.md`](SPEC.md) §6.4, moduł I |

Spec kończy się kartami i licznikiem. Brakuje: co robi użytkownik, gdy wynik **spełnia / nie spełnia / prawie spełnia** potrzebę. Sprawdzanie duplikatów fiszki (§6.6) to Kreator — poza tym featurem.

Dane platformy są wspólne ([`architecture/00-stack.md`](architecture/00-stack.md)). Skrót dla obcej osoby jest po anonimizacji ([`SPEC.md`](SPEC.md) §6.2).

---

## 1. Od opisu problemu do decyzji — jedna ścieżka, jedna trójka

**Moduł:** Matchmaking — „Opisz problem”, potem wątek / innowacje.

**Kto:** mieszkaniec, NGO, JST — także bez konta (kod śledzenia).

### Po co

1. Zgłoszenie problemu jest pierwszym krokiem (nie katalog, nie Kreator).
2. Użytkownik może wskazać **gdzie** jest sprawa i dołączyć **zdjęcia** — bez żargonu i bez formularza geodezyjnego.
3. Zanim powstanie kolejny wątek, system sprawdza, czy sprawa już jest (także w tej gminie / pobliżu punktu).
4. Po każdym wyniku (podobne zgłoszenie albo innowacja) użytkownik mówi, czy to spełnia potrzebę — inaczej system nie wie, czy trafił, a UI kończy się ślepą uliczką.

### Use case: „tu, zdjęcia, jak rozwiązać”

```text
Ktoś przychodzi → wskazuje miejsce na mapie → dodaje zdjęcia
→ opisuje, co nie działa → system szuka podobnych spraw i rozwiązań
→ trójka: nie / tak / prawie
```

To samo pole lokalizacji i załączników dotyczy **zgłoszenia problemu** (`ProblemReport`) i **pomysłu / innowacji użytkownika** (`Idea`): „tu testujemy / tu działa nasze rozwiązanie”.

### Lokalizacja i zdjęcia (przy zgłoszeniu)

| Element | Reguła MVP |
|---|---|
| Gmina | **Wymagana** (TERYT) — spójne z mapą i Obserwatorem w [`SPEC.md`](SPEC.md) |
| Punkt na mapie | **Opcjonalny** (współrzędne lat/lng z pinezki). Pole / wyszukiwarka gminy zawsze obok mapy (dostępność) |
| Opis miejsca | Opcjonalny tekst („przy przejściu koło przychodni”) — nie zastępuje gminy |
| Zdjęcia | **1–3**, limit rozmiaru; podgląd przed wysłaniem. Zdjęcie **nie zastępuje** opisu tekstowego |
| Przechowywanie | Współrzędne + pliki powiązane ze zgłoszeniem / pomysłem — bez warstw geodezyjnych, działek, siatki ulic |
| Podobieństwo | AI / wyszukiwanie bierze pod uwagę treść **oraz** gminę (i odległość od punktu, gdy jest) |
| Prywatność | Ostrzeżenie: nie wysyłaj twarzy, tablic, numerów domów, gdy nie trzeba. Skrót publiczny bez dokładnego adresu; punkt na mapie w skrócie może być przybliżony |
| Temat | Zgłoszenie zostaje przy problemie / innowacji **społecznej** — mapa i zdjęcia dają kontekst, nie zamieniają platformy w ticketnię dziur w jezdni |

### Kolejność (obowiązuje zawsze)

```text
1. Opisz problem + gmina (+ opcjonalnie pinezka i zdjęcia)
         │
         ▼
2. AI szuka podobnych ZGŁOSZEŃ (treść + lokalizacja)
         │
    ┌────┴────┐
    ▼         ▼
 znaleziono   brak
    │         │
    ▼         │
  TRÓJKA ─────┤   (decyzja przy zgłoszeniu)
    │         │
    │  „tak” → dołącz do istniejącego wątku; KONIEC tej ścieżki
    │         │     (bez nowego zgłoszenia, bez matchmakingu innowacji)
    │         │
    │  „nie” / „prawie” / brak podobnych
    │         │
    └────┬────┘
         ▼
3. Nowe zgłoszenie + wątek (z lokalizacją i zdjęciami;
   przy „prawie”: z dopiskiem różnicy / braków)
         │
         ▼
4. AI szuka INNOWACJI (matchmaking z briefu)
         │
         ▼
5. TRÓJKA     (ta sama decyzja, przy innowacji)
```

Krok 2 i krok 5 używają **tej samej trójki**. Różni się tylko to, co system tworzy po wyborze.

### Trójka (jedyna decyzja w UI)

Pytanie na ekranie wyniku: **„Czy to spełnia Twoją potrzebę?”**

| Werdykt | Przy podobnym **zgłoszeniu** | Przy **innowacji** | Etykieta UI |
|---|---|---|---|
| **Nie** | Nowe zgłoszenie + wątek. Odrzucenie zapisane, żeby ta podpowiedź nie wracała jako jedyna droga. | Nowe zgłoszenie „brak rozwiązania” albo przejście do Kreatora. Odrzucenie przy `MatchResult`. | „To nie to” |
| **Tak** | Dołączenie do istniejącego wątku. Opcjonalnie krótkie „to mi pomogło”. Bez drugiego zgłoszenia. | Sygnał trafności przy dopasowaniu (`MatchResult`). Opcjonalnie jedno zdanie. Bez konta — przy kodzie śledzenia. | „To mi pomogło” / „To moja sprawa” |
| **Prawie** | Nowe zgłoszenie + wątek **powiązane** z istniejącym; użytkownik dopisuje, czym się różni / czego brakuje. | Nowe zgłoszenie **powiązane** z innowacją: „działa, ale brakuje X” (propozycja usprawnienia). **Nie** edytuje karty Biblioteki ROPS. | „Prawie — brakuje mi…” |

### Jak to wygląda na ekranie

**Krok 1 — zgłoszenie z miejscem i zdjęciami**

```text
┌─────────────────────────────────────────────┐
│  Opisz, co nie działa                       │
│  [________________________________]         │
│                                             │
│  Gmina *  [ wyszukaj gminę………… ]            │
│  ┌─────────────────────────────────────┐    │
│  │         (mapa — opcjonalna pinezka) │    │
│  └─────────────────────────────────────┘    │
│  [ + Dodaj zdjęcia ]  (max 3)               │
│   [min1] [min2]                             │
│                                             │
│           [ Szukaj rozwiązań ]              │
└─────────────────────────────────────────────┘
```

**Moment A — podobne zgłoszenie**

```text
┌─────────────────────────────────────────────┐
│  Znaleźliśmy podobną sprawę                 │
│  ─────────────────────────────────────────  │
│  Skrót (bez danych osobowych autora)        │
│  Gmina · okolica na mapie · status wątku    │
│  (miniatura zdjęcia, jeśli jest)            │
│                                             │
│  [ To nie to ]  [ To moja sprawa ]          │
│              [ Prawie — brakuje mi… ]       │
└─────────────────────────────────────────────┘
```

**Moment B — innowacja (po założeniu własnego wątku)**

```text
┌─────────────────────────────────────────────┐
│  Proponowane rozwiązanie                    │
│  ─────────────────────────────────────────  │
│  Tytuł innowacji · dlaczego pasuje          │
│  co dostosować · film / karta ROPS          │
│                                             │
│  [ To nie to ]  [ To mi pomogło ]           │
│              [ Prawie — brakuje mi… ]       │
└─────────────────────────────────────────────┘
```

W katalogu Biblioteki (przeglądanie bez zgłoszenia) ta sama trójka może być przy karcie, ale nie blokuje przejścia dalej. Obowiązkowa jest w Momentcie A (gdy AI coś znalazło) i w Momencie B (wyniki matchmakingu).

### Czego ten feature nie robi

- Nie dubluje dwóch zestawów przycisków — jest jedna trójka.
- Nie edytuje karty innowacji w Bibliotece ROPS („prawie” = powiązane zgłoszenie / propozycja).
- Nie zastępuje Testera (gwiazdki, „Chcę testować”). „To mi pomogło” = sygnał trafności dopasowania.
- Nie jest sprawdzaniem duplikatów fiszki w Kreatorze ([`SPEC.md`](SPEC.md) §6.6).
- Licznik „podobny problem zgłosiło N osób” zostaje informacją; decyzją jest trójka, nie sam licznik.
- Nie jest systemem geodezyjnym ani zgłoszeń infrastruktury miejskiej: bez działek, warstw GIS i urzędowej precyzji pomiaru.
- Nie buduje publicznego feedu zdjęć — załączniki służą obsłudze zgłoszenia i kontekstowi AI/admina.

### Kryteria

- Opis problemu jest pierwszym krokiem; gmina jest wymagana przy nowym zgłoszeniu.
- Użytkownik może dodać pinezkę i do 3 zdjęć; bez pinezki i bez zdjęć zgłoszenie też przechodzi (gmina + opis wystarczą).
- To samo (gmina, opcjonalny punkt, zdjęcia) jest dostępne przy pomyśle / innowacji użytkownika (`Idea`).
- Gdy AI znajdzie podobne zgłoszenie, użytkownik widzi tylko trójkę (nie osobną listę „dołącz / odrzuć” obok innej listy).
- „Tak” przy zgłoszeniu = dołączenie bez drugiego wątku; „tak” przy innowacji = sygnał trafności.
- „Nie” i „prawie” prowadzą do nowego zgłoszenia; przy „prawie” zawsze jest dopisek, czego brakuje albo czym się różni.
- Matchmaking innowacji uruchamia się dopiero gdy użytkownik ma (albo właśnie zakłada) własny wątek — nie po samym dołączeniu do cudzego.
- Skrót podobnego zgłoszenia jest bez telefonu, e-maila, adresu, imienia i nazwiska; dokładny punkt nie jest wymagany w skrócie publicznym.
- Admin widzi lokalizację, zdjęcia, odrzucenia i sygnały „pomogło” (podstawa oceny trafności).

---

## 2. Reguły admina: kworum ekspertów i wymagane pola

**Moduł:** Panel administratora — reguły; egzekwowanie przy zgłoszeniu problemu, pomyśle i przed `ACCEPTED`.

**Kto:** reguły tworzy i zmienia tylko `ADMIN`. Oceny wystawiają `EXPERT` ze swoich obszarów. Autor widzi, czego brakuje w formularzu i jaki jest postęp kworum.

### Po co

SPEC ma `IdeaReview` i `ACCEPTED`/`REJECTED` u admina, ale bez progu „ilu ekspertów”. Feature 1 ma lokalizację i zdjęcia, ale **na sztywno** (gmina wymagana, pinezka i zdjęcia opcjonalne). Różne obszary potrzebują różnej dyscypliny: czasem wystarczy opis, czasem bez zdjęcia i punktu na mapie sprawa jest bezużyteczna. Admin ustawia to regułami per **typ zgłoszenia** + **obszar**, zamiast hardkodu.

W SPEC / assumptions **nie ma** silnika custom fieldów — tu są tylko wbudowane wymagania (zdjęcia, geolokalizacja). Swobodne pola = feature 3.

### 2a. Kworum ekspertów (`ExpertApprovalRule`)

Gdy dla obszaru **nie ma** wpisu:

- wymagane jest **1** zatwierdzenie eksperta (`IdeaReview` = `DEVELOP`).

| Pole | Znaczenie |
|---|---|
| Obszar (`ChallengeArea`) | jedna aktywna reguła na obszar |
| `requiredExpertCount` | ilu **różnych** ekspertów musi dać `DEVELOP` (≥ 1) |

```text
Brak reguły  →  1 × DEVELOP
Obszar X, N=3  →  3 × DEVELOP
```

**Liczenie kworum**

1. Pomysł `SUBMITTED` z obszarem.
2. Eksperci zostawiają `DEVELOP` | `REVISE` | `DECLINE`.
3. Do kworum tylko `DEVELOP`, jeden głos na eksperta (ponowna ocena nadpisuje).
4. Po K ≥ N → „kworum spełnione”; **`ACCEPTED`/`REJECTED` nadal ustawia admin**.
5. `ACCEPTED` bez kworum = odmowa. Odrzucenie mimo kworum = dozwolone.
6. To samo przed przekształceniem pomysłu w innowację `USER`. Genom innowacji ROPS = bez zmian (tylko admin).

### 2b. Wymagane pola (`SubmissionRequirementRule`)

Wbudowane przełączniki — **nie** dowolny formularz. Dotyczą pól już opisanych w feature 1.

| Wymaganie | Co znaczy „spełnione” | Domyślnie (brak reguły) |
|---|---|---|
| Zdjęcia | ≥ 1 załącznik obrazu | opcjonalne |
| Geolokalizacja (pinezka) | punkt lat/lng na mapie | opcjonalne |
| Gmina | TERYT wybrany | **zawsze wymagana** (feature 1; reguła tego nie wyłącza) |
| Opis | niepusty tekst | **zawsze wymagany** |

Reguła ma klucz:

| Pole | Znaczenie |
|---|---|
| Typ | `PROBLEM_REPORT` albo `IDEA` |
| Obszar (`ChallengeArea`, opcjonalnie null) | `null` = domyślna dla typu; wpis z obszarem nadpisuje domyślną |
| `requirePhotos` | bool |
| `requireGeoPoint` | bool |

```text
Brak reguły                         → jak feature 1 (zdjęcia i pinezka opcjonalne)
PROBLEM_REPORT + obszar „dostępność”, requirePhotos=true, requireGeoPoint=true
                                    → bez zdjęcia i pinezki nie wyślesz zgłoszenia
IDEA + null, requirePhotos=true     → każdy pomysł wymaga zdjęcia, dopóki obszar
                                      nie ma własnej reguły
```

**Kiedy egzekwować**

- Przy tworzeniu / wysłaniu zgłoszenia lub pomysłu — walidacja 400 z listą braków („dodaj zdjęcie”, „wskaż miejsce na mapie”).
- Obszar może dojść z wyboru użytkownika albo z klasyfikacji AI; jeśli obszar jeszcze nieznany, obowiązuje reguła typu z `obszar = null`, a po ustaleniu obszaru system dopytuje o brakujące pola zanim domknie wątek / `SUBMITTED`.
- Nie łamie SPEC „bez długiego formularza”: ekran zostaje krótki; pojawiają się tylko oznaczenia „wymagane”, gdy admin tak ustawił.

### Jak to wygląda

**Admin — jedna sekcja reguł**

```text
┌──────────────────────────────────────────────────────────┐
│  Reguły obszaru                                          │
│  ──────────────────────────────────────────────────────  │
│  Obszar: Starzenie się                                   │
│                                                          │
│  Eksperci do APPROVE (DEVELOP):  [ 2 ]                   │
│  (domyślnie bez reguły: 1)                               │
│                                                          │
│  Wymagane przy zgłoszeniu problemu:                      │
│  [x] Zdjęcia   [x] Punkt na mapie                        │
│                                                          │
│  Wymagane przy pomyśle (Idea):                           │
│  [ ] Zdjęcia   [ ] Punkt na mapie                        │
│                                                          │
│  [ Zapisz ]                                              │
└──────────────────────────────────────────────────────────┘
```

**Użytkownik — gdy reguła wymaga zdjęć i pinezki**

```text
┌─────────────────────────────────────────────┐
│  Opisz, co nie działa *                     │
│  Gmina *                                    │
│  Punkt na mapie *  (wymagane w tym obszarze)│
│  Zdjęcia * (min. 1)                         │
│  [ Szukaj rozwiązań ]                       │
└─────────────────────────────────────────────┘
```

### Ocena w kontekście HubMI

| Plus | Minus / ryzyko |
|---|---|
| Admin dopasowuje dyscyplinę do obszaru bez deployu | Zbyt wiele „wymagane” psuje łatwość zgłoszenia (20%+ oceny za intuicyjność) |
| Zdjęcia + mapa wzmacniają use case „tu i zdjęcie” | Seniorzy / niski poziom cyfrowy — każdy obowiązkowy krok boli |
| Spójne z feature 1 (te same pola, tylko twardsze) | Obszar z AI na końcu → trzeba drugiego kroku „uzupełnij wymagane” |
| Kworum ekspertów = kontrola jakości pomysłów dla ROPS | Na demo wystarczy 1–2 obszary z regułami; reszta na defaultach |

**Rekomendacja:** trzymać domyślnie lekki formularz; włączać zdjęcia/geo tylko tam, gdzie lokalność jest sednem sprawy. Nie budować tu jeszcze dowolnych pól — to feature 3.

### Czego ten feature nie robi

- Nie wprowadza głosowania mieszkańców / JST.
- Nie jest silnikiem custom fieldów (feature 3).
- Nie dotyczy innowacji seedowanych z Biblioteki ROPS.
- Nie pozwala wyłączyć gminy ani opisu.
- Nie jest regułą per pojedynczy rekord — tylko typ + obszar.

### Kryteria

- Bez `ExpertApprovalRule` → 1× `DEVELOP`; bez `SubmissionRequirementRule` → zdjęcia i pinezka opcjonalne.
- Admin ustawia N ekspertów oraz `requirePhotos` / `requireGeoPoint` per typ i obszar.
- Brak wymaganego pola = odmowa wysłania z czytelnym komunikatem.
- `ACCEPTED` bez kworum = odmowa; `REVISE`/`DECLINE` nie budują kworum.
- Autor widzi postęp kworum i które pola są wymagane w jego obszarze.

---

## 3. Pomysł: kategorie i custom fieldy per typ

**Status:** osobny pomysł produktowy — **nie ma** tego w [`SPEC.md`](SPEC.md) ani [`assumptions.md`](assumptions.md). Nie mylić z wbudowanymi wymaganiami z feature 2b.

### Po co ktoś by to chciał

Admin ROPS chce różne formularze: przy „dostępności” pytanie o barierę architektoniczną, przy „zdrowiu psychicznym” inne, przy pomyśle inne niż przy problemie. Klasyczny CMS: kategoria + pola dynamiczne.

### Propozycja modelu (gdyby iść w tę stronę)

| Pojęcie | Znaczenie w HubMI |
|---|---|
| Typ (`SubmissionType`) | `PROBLEM_REPORT` \| `IDEA` (ew. później `INNOVATION_USER`) |
| Kategoria | **Nie nowy słownik** — używamy istniejących `ChallengeArea` (8 obszarów Mapy Wyzwań). Osobna „kategoria admina” dublowałaby Atlas i prawdę domenową. |
| Definicja pola (`CustomFieldDefinition`) | typ zgłoszenia + obszar (opcjonalnie) + klucz + etykieta PL + rodzaj (`TEXT` \| `NUMBER` \| `SELECT` \| `BOOLEAN`) + `isRequired` + kolejność |
| Wartość (`CustomFieldValue`) | powiązanie ze zgłoszeniem / pomysłem + klucz + wartość |

```text
Typ: PROBLEM_REPORT · Obszar: Dostępność
  — bariera (SELECT: krawężnik / brak pochylni / …) *
  — od kiedy (TEXT)

Typ: IDEA · Obszar: null (wszystkie)
  — budżet szacunkowy (NUMBER)
```

Walidacja przy wysłaniu jak w 2b; wartości idą do skrzynki admina i (ostrożnie) do promptu matchmakingu jako dodatkowy kontekst.

### Ocena w kontekście tej aplikacji

| Argument za | Argument przeciw |
|---|---|
| Elastyczność po hackathonie, gdy ROPS doprecyzuje nabory i obszary | SPEC celowo: **jedno duże pole**, bez długiego formularza — to jest rdzeń oceny „łatwość zgłoszenia” |
| Admin sam dokłada pytania bez deployu | Duży koszt: model, migracje, UI builder, dostępność każdego typu pola, OpenAPI, testy |
| Lepsze dane dla ekspertów | AI matchmaking i tak najlepiej żuje język naturalny; sztywne SELECT-y rzadko biją dobry opis |
| Spójne z regułami 2a/2b (konfiguracja per obszar) | Canvas pomysłu **już ma** stały schemat (`canvas_schema.json`) — drugi silnik pól przy `Idea` to duplikacja |
| | Ryzyko zejścia w „generyczny ticket system”, nie hub innowacji społecznych |

**Werdykt dla HubMI / Castor**

1. **Na MVP / demo:** tylko feature **2b** (wbudowane: zdjęcia, geo) + stałe pola feature 1 + Canvas z SPEC.  
2. **Custom fieldy:** odłożyć; jeśli ROPS po demie poprosi o 1–2 pytania per obszar, rozważyć wąski wariant (max kilka pól `SELECT`/`TEXT`, bez buildera drag-and-drop).  
3. **Kategorie:** nie inventować — **`ChallengeArea` jest kategorią**.  
4. Gdy custom fieldy powstaną, muszą dać się **wyłączyć domyślnie** (puste definicje = obecny krótki formularz), inaczej zabiją intuicyjność.

### Czego ten pomysł nie robi (na teraz)

- Nie jest w zakresie implementacji hackathonowej, dopóki zespół świadomie nie podniesie priorytetu.
- Nie zastępuje Canvasu ani 6 sekcji karty innowacji ROPS.
- Nie dodaje osobnego drzewa kategorii obok Mapy Wyzwań.

