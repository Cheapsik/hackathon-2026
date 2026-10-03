# Feature'y

Źródła: [`REQUIREMENTS.md`](REQUIREMENTS.md) (brief ROPS), [`SPEC.md`](SPEC.md) (decyzje zespołu). Ten plik doprecyzowuje zachowania, których brief i spec opisują tylko częściowo.

Nazwy encji: **zgłoszenie** (`ProblemReport`), **wątek** (`Thread`), **innowacja** (`Innovation`), **dopasowanie** (`MatchResult`), **pomysł** (`Idea`), **załącznik** (zdjęcie przy zgłoszeniu lub pomyśle).

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

