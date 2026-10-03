# Feature'y

Źródła: [`REQUIREMENTS.md`](REQUIREMENTS.md) (brief ROPS), [`SPEC.md`](SPEC.md) (decyzje zespołu). Ten plik doprecyzowuje zachowania, których brief i spec opisują tylko częściowo.

Nazwy encji: **zgłoszenie** (`ProblemReport`), **wątek** (`Thread`), **innowacja** (`Innovation`), **dopasowanie** (`MatchResult`).

**Jedna decyzja użytkownika** przy każdym wyniku AI: *nie / tak / prawie*. Nie ma osobnych list dróg dla „podobnego problemu” i „dopasowanej innowacji” — ta sama trójka, dwa momenty w ścieżce.

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
2. Zanim powstanie kolejny wątek, system sprawdza, czy sprawa już jest.
3. Po każdym wyniku (podobne zgłoszenie albo innowacja) użytkownik mówi, czy to spełnia potrzebę — inaczej system nie wie, czy trafił, a UI kończy się ślepą uliczką.

### Kolejność (obowiązuje zawsze)

```text
1. Opisz problem
         │
         ▼
2. AI szuka podobnych ZGŁOSZEŃ
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
3. Nowe zgłoszenie + wątek (przy „prawie”: z dopiskiem różnicy / braków)
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

**Moment A — podobne zgłoszenie**

```text
┌─────────────────────────────────────────────┐
│  Znaleźliśmy podobną sprawę                 │
│  ─────────────────────────────────────────  │
│  Skrót (bez danych osobowych autora)        │
│  Gmina · obszar · status wątku              │
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

### Kryteria

- Opis problemu jest pierwszym krokiem.
- Gdy AI znajdzie podobne zgłoszenie, użytkownik widzi tylko trójkę (nie osobną listę „dołącz / odrzuć” obok innej listy).
- „Tak” przy zgłoszeniu = dołączenie bez drugiego wątku; „tak” przy innowacji = sygnał trafności.
- „Nie” i „prawie” prowadzą do nowego zgłoszenia; przy „prawie” zawsze jest dopisek, czego brakuje albo czym się różni.
- Matchmaking innowacji uruchamia się dopiero gdy użytkownik ma (albo właśnie zakłada) własny wątek — nie po samym dołączeniu do cudzego.
- Skrót podobnego zgłoszenia jest bez telefonu, e-maila, adresu, imienia i nazwiska.
- Admin widzi odrzucenia i sygnały „pomogło” (podstawa oceny trafności).
