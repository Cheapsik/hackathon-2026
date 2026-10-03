# Castor — specyfikacja dla agenta budującego aplikację

Ten plik mówi agentowi **co** zbudować i jest źródłem prawdy dla „co” (zastępuje `docs/product.md`). **Jak** budujemy, opisuje [`architecture/`](architecture/); nazwy pojęć są w [`../GLOSSARY.md`](../GLOSSARY.md), decyzje trudne do odwrócenia w [`adr/`](adr/), odłożone na później w [`TODO.md`](TODO.md).

Zasada nadrzędna: **nie zmieniaj decyzji z sekcji 1 bez pytania człowieka**. Gdy czegoś tu brakuje, zapytaj albo wybierz najprostsze rozwiązanie i zapisz je w sekcji 11 („Decyzje”).

---



## 0. Czym jest Castor (w 5 zdaniach)

Platforma Małopolskiego Hubu Innowacji Społecznych (ROPS Kraków). Mieszkaniec, NGO albo gmina opisuje problem, a system dobiera sprawdzone innowacje z Biblioteki ROPS i wyjaśnia, dlaczego pasują. Gmina dostaje „kartę dopasowania do gminy”, czyli ocenę, czy dana innowacja przyjmie się u niej, na podstawie danych z Obserwatora Statystyk Społecznych. Gdy nic nie pasuje, system proponuje hybrydę kilku innowacji („krzyżówka”), która trafia do Kreatora jako szkic pomysłu. Administrator ROPS widzi zgłoszenia na żywo, trendy potrzeb i białe plamy, czyli obszary bez innowacji.

---



## 1. Decyzje techniczne (ustalone, nie zmieniać)


| Obszar                 | Decyzja                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Repozytorium           | Jedno repo. Backend w `backend/`, frontend w `frontend/`                                                                                    |
| Backend                | **.NET 10**, istniejący szkielet Castor w `backend/`. **Kontynuuj jego architekturę** ([`architecture/`](architecture/)), nie narzucaj nowej |
| Baza                   | **PostgreSQL 17 + pgvector** (obraz `pgvector/pgvector:pg17`); rozszerzenia `vector`, `unaccent`, `pg_trgm` włączone migracją               |
| ORM / dostęp do danych | **EF Core + Npgsql + `Pgvector.EntityFrameworkCore`**                                                                                       |
| Frontend               | **Vite + React + TypeScript** w `frontend/`                                                                                                 |
| UI                     | **shadcn/ui + Tailwind CSS** (Radix pod spodem, dostępność)                                                                                 |
| Kontrakt API           | **REST + OpenAPI** z .NET pod prefiksem `/api`; `backend/openapi/Castor.Api.json` powstaje przy buildzie backendu i jest commitowany; frontend generuje z niego klienta **orval** + **TanStack Query** |
| Logowanie i role       | **Sesja w cookie** (`Castor.Auth`) + `PasswordHasher<User>`, bez ASP.NET Core Identity jako frameworka i bez JWT ([ADR 0001](adr/0001-cookie-session-instead-of-jwt.md)); role w sekcji 5 |
| LLM                    | **Za abstrakcją z adapterami** (`ILlmClient` w `Shared/Ai/`). Dostawca, model, klucz i URL z sekretów. Nie wiązać kodu z jednym dostawcą. **Pierwszy dostawca do ustalenia** ([TODO](TODO.md)) |
| Embeddingi             | **Do ustalenia** ([TODO](TODO.md)). Interfejs `IEmbeddingClient` (`Shared/Ai/`) z adapterami jak przy LLM; model i wymiar wektora z konfiguracji. Nie hardkoduj wymiaru |
| Czas rzeczywisty       | **SignalR**. Bez e-maili, SMS-ów i push: tylko aktualizacje na żywo w aplikacji                                                             |
| Głos                   | **Web Speech API** w przeglądarce (`pl-PL`), zawsze z polem tekstowym jako alternatywą                                                      |
| Mapa                   | **Leaflet + GeoJSON granic gmin Małopolski**; każda mapa ma obok tabelę z tymi samymi danymi (dostępność)                                   |
| Import danych          | **Skrypty Python → pliki seed JSON** w `data/seed/`; backend importuje seed przy starcie (idempotentnie)                                    |
| Język UI               | **Tylko polski, teksty na sztywno** (bez i18n)                                                                                              |
| Testy                  | **Brak testów** — ani w backendzie, ani we frontendzie                                                                                      |
| Wdrożenie demo         | **Docker na VPS**: `docker-compose.yml` w korzeniu repo                                                                                     |


---



## 2. Docelowa struktura repo (instrukcja, nie generuj na zapas)

```
/backend            .NET 10 (szkielet Castor; nie przebudowuj struktury)
  /openapi          Castor.Api.json — dokument OpenAPI z buildu (commitowany)
/frontend           Vite + React + TS + shadcn/ui
/data
  /scrapers         skrypty Python (requirements.txt)
  /seed             wynikowe JSON-y (commitowane)
  /geo              GeoJSON gmin Małopolski
/docs               REQUIREMENTS.md, LINKS.md, SPEC.md, TODO.md, architecture/, adr/, raport
GLOSSARY.md         słownik pojęć
docker-compose.yml
.env.example        wszystkie zmienne z sekcji 3, bez wartości sekretów
```

Usługi w `docker-compose.yml` (jedyny compose w repo):

- `db`: obraz `pgvector/pgvector:pg17`, wolumen na dane, healthcheck, port 5432 tylko na `127.0.0.1` (do pracy lokalnej: `docker compose up -d --wait db`).
- `backend`: build z `backend/`, zależy od `db`, czyta zmienne z `.env`, migruje bazę przy starcie, wystawia `/api/*` i `/hubs/*` (Scalar tylko w `Development`).
- `frontend`: build Vite (kontekst: korzeń repo, bo klient powstaje z `backend/openapi/`), serwowany przez nginx; nginx proxuje `/api` i `/hubs` (z WebSocketami) do `backend`. Demo pod `http://localhost:8080`.

Jeden `docker compose up` ma postawić działające demo z zaimportowanym seedem.

---



## 3. Konfiguracja i sekrety

Wszystko przez zmienne środowiskowe (konwencja .NET `Sekcja__Klucz`). Wartości tylko w `.env` (poza gitem); w repo jest `.env.example`.


| Zmienna                                                                                  | Znaczenie                                                      |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ConnectionStrings__Castor`                                                              | Połączenie do bazy (w compose składane z `POSTGRES_PASSWORD`)  |
| `POSTGRES_PASSWORD`                                                                      | Hasło bazy w compose; na serwerze zawsze własne                |
| `Database__MigrateOnStartup`                                                             | `true` w kontenerze: backend sam wykonuje migracje             |
| `DataProtection__KeysPath`                                                               | katalog kluczy podpisujących cookie (wolumen w kontenerze)     |
| `Llm__Provider`                                                                          | `placeholder` (bez usługi zewnętrznej, domyślny — D-19); docelowo np. `anthropic`, `openai`, `azure-openai`, `openai-compatible` |
| `Llm__Model`                                                                             | identyfikator modelu u dostawcy                                |
| `Llm__ApiKey`, `Llm__BaseUrl`                                                            | klucz i (opcjonalnie) adres API                                |
| `Llm__MaxOutputTokens`, `Llm__TimeoutSeconds`                                            | limity                                                         |
| `Embeddings__Provider`, `Embeddings__Model`, `Embeddings__ApiKey`, `Embeddings__BaseUrl` | jak wyżej, **do ustalenia**                                    |
| `Embeddings__Dimensions`                                                                 | wymiar wektora; kolumny `vector(N)` tworzone z tej wartości    |
| `Seed__Path`                                                                             | ścieżka do `data/seed` w kontenerze                            |
| `Seed__OnStartup`                                                                        | `true`/`false`                                                 |

CORS nie jest potrzebny: aplikacja, API i hub są pod jednym originem (nginx w kontenerze, proxy Vite lokalnie).


Adaptery LLM i embeddingów wybierane w DI na podstawie `*__Provider`. Brak klucza lub nieznany dostawca = czytelny błąd przy starcie.

---



## 4. Dane



### 4.1. Skrypty pobierające (`data/scrapers/`, Python)

Strony `rops.krakow.pl` i `obserwator.rops.krakow.pl` zwracają **HTTP 403 bez nagłówka przeglądarki**. Każde żądanie musi mieć `User-Agent` zwykłej przeglądarki. Pobieraj grzecznie (opóźnienie między żądaniami), raz, a wynik zapisz do JSON.


| Skrypt           | Źródło                                                                                               | Wynik                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `innovations.py` | 9 stron kategorii Biblioteki (`.../biblioteka-innowacji-spolecznych/<kategoria>`), potem każda karta | `seed/innovations.json` (115 pozycji)                                                                                      |
| `models.py`      | `.../innowacje-w-malopolskich-modelach`                                                              | flaga `inServiceModel` przy 9 innowacjach                                                                                  |
| `reports.py`     | `.../badania-analizy-raporty/raporty-z-badan`                                                        | `seed/reports.json` (51 pozycji: tytuł, rok, opis, URL, licencja jeśli podana) + pobrane PDF-y do `data/raw/` (poza gitem) |
| `observer.py`    | `obserwator.rops.krakow.pl/differenceanalysis/<id>` (184 wskaźniki)                                  | `seed/indicators.json`, `seed/indicator_values.json`                                                                       |
| `challenges.py`  | PDF Mapy Wyzwań (`docs/LINKS.md`)                                                                    | `seed/challenge_areas.json` (8 obszarów), `seed/personas.json` (9 person)                                                  |
| `canvas.py`      | PDF Canvasu                                                                                          | `seed/canvas_schema.json` (pola i skale fiszki)                                                                            |


**Karta innowacji** ma zawsze 6 sekcji: 1. Na czym polega rozwiązanie? 2. Jakich problemów dotyczy innowacja? 3. Grupa docelowa 4. Kto może skorzystać z innowacji? 5. Czy to działa? 6. Autorzy. Do tego: link do filmu YouTube, paczka materiałów ZIP, karta PDF, „Zasady wykorzystania” (PDF), oznaczenie „wybrana do upowszechniania”.

**Dane osobowe (wymóg briefu, punkt 9):** z sekcji „Autorzy” zapisuj **tylko nazwę organizacji**, imiona i nazwiska osób usuwaj. Materiały (ZIP, PDF, filmy) **linkuj**, nie kopiuj.

**Obserwator:** wartości są w skryptach strony (`myChartLabels…`, `myChartValues…`) i w tabeli „Dane w układzie gminnym”. Zapisz rok danych przy każdej wartości. Gminy miejsko-wiejskie występują jako dwa wpisy („Gorlice (miasto)”, „Gorlice (wieś)”). Mapuj je na kody **TERYT** gmin, bo po TERYT łączymy z GeoJSON.

**Mapa Wyzwań:** dane w niej są **ogólnopolskie**; w UI zawsze z dopiskiem „dane krajowe”.

**GeoJSON:** granice gmin Małopolski (np. z PRG GUGiK), uproszczone do rozsądnego rozmiaru, z kodem TERYT w `properties`.

### 4.2. Model danych (minimalny)

Nazwy encji są kanoniczne — definicje w [`../GLOSSARY.md`](../GLOSSARY.md). Pola są orientacyjne; konwencje (klucze, enumy `UPPER_SNAKE_CASE`, daty) są w [`architecture/00-stack.md`](architecture/00-stack.md).

- **ChallengeArea**: 8 obszarów Mapy Wyzwań (kod, nazwa, definicja, kluczowe wyzwania[], powiązane wskaźniki[]).
- **Persona**: 9 person (imię, wiek, opis, cele, wyzwania, motywacje, obszar). Służą do demo i testu trafności.
- **Innovation**: tytuł, krótki opis, kategoria Biblioteki, 6 sekcji karty, `organization`, URL karty / filmu / ZIP / PDF / zasad, `featured`, `inServiceModel`, `stage` (`IDEA` | `PROTOTYPE` | `TESTED` | `READY`), `source` (`ROPS` | `USER`), `seeksTesters`, pomysł źródłowy (dla `USER`).
- **InnovationGenome** (1:1 z Innovation): `rootCauses[]`, `mechanisms[]`, `targetGroups[]`, `requiredResources[]` (instytucje, ludzie, budżet, infrastruktura), `scale`, `challengeAreas[]`, `summary` (≤ 600 znaków), `embedding vector(N)`, `status` (`DRAFT` | `APPROVED`), `approvedBy`, `approvedAt`.
- **Municipality** (gmina): TERYT, nazwa, typ (miejska/wiejska/miejsko-wiejska), powiat.
- **Indicator**: id z Obserwatora, nazwa, grupa, jednostka, opis, źródło.
- **IndicatorValue**: gmina, wskaźnik, rok, wartość.
- **ResearchReport** + **ResearchReportChunk**: raport z badań ROPS (metadane, obszary) i fragmenty tekstu ze stroną PDF i `embedding vector(N)`. Nie mylić ze zgłoszeniem.
- **ProblemReport** (zgłoszenie): treść (po anonimizacji), opis oryginalny tylko jeśli autor się zgodził, gmina, obszar(y), kanał (`TEXT` | `VOICE` | `ASSISTED`), `submittedOnBehalf`, status, `trackingCode`, autor (opcjonalny), pytania doprecyzowujące i odpowiedzi, daty.
- **MatchResult**: zgłoszenie albo pomysł, innowacja, pozycja, `score`, uzasadnienie, cytowane pola karty, `kind` (`MATCH` | `HYBRID`).
- **FitAssessment** (karta dopasowania do gminy): innowacja, gmina, rok danych, wynik z §6.5.
- **Idea** (pomysł, fiszka z Kreatora): pola Canvasu, autor i współautorzy, status, powiązane podobne innowacje/pomysły, `fromHybridOf[]`, `seeksTesters`.
- **IdeaReview**: ocena pomysłu przez eksperta (rekomendacja + komentarz).
- **GrantCall** (nabór): tytuł, daty, kryteria, `isOpen`. **GrantApplication** (wniosek): pomysł dopasowany do naboru.
- **TestSignup** / **Feedback**: zapis na test i ocena/uwagi do innowacji (także transkrypcja głosowa). Profil testera przy koncie.
- **Conversation** / **Message**: wątki (zgłoszenie ↔ ROPS, pytanie do eksperta, partnerstwo).
- **User**: e-mail, hash hasła, rola; pracownik JST ma jedną gminę, ekspert — obszary wyzwań.

---



## 5. Role


| Rola                | Kto              | Może                                                                                                             |
| ------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| (anonim, bez roli)  | każdy            | przeglądać Atlas i Bibliotekę, zgłosić problem **bez konta** (dostaje kod śledzenia), sprawdzić status po kodzie, oglądać wygenerowane karty dopasowania |
| `RESIDENT`          | mieszkaniec, NGO | jak anonim + własne zgłoszenia, pomysły, zapisy na testy, opinie, wiadomości, generowanie karty dopasowania dla dowolnej gminy |
| `MUNICIPAL_OFFICER` | pracownik JST    | jak `RESIDENT` + karta dopasowania i mapa wyzwań z podpowiedzianą **swoją** gminą (dokładnie jedną)             |
| `EXPERT`            | ekspert, mentor  | odpowiada w wątkach ze **swoich obszarów** wyzwań, ocenia pomysły z tych obszarów, przestawia zgłoszenie `WITH_EXPERT → ANSWERED` |
| `ADMIN`             | pracownik ROPS   | wszystko + panel administratora, trendy, zatwierdzanie genomów, nabory, nadawanie ról                            |

- Każdy użytkownik ma **dokładnie jedną rolę**. Rejestracja daje `RESIDENT`; pozostałe role, gminę pracownika JST i obszary eksperta nadaje administrator.
- Rola jedzie w cookie sesji, więc jej zmiana działa od następnego logowania.
- Trendy i agregaty potrzeb są **wyłącznie dla** `ADMIN` (wymóg briefu).

---



## 6. Warstwa AI (wspólna dla modułów)



### 6.1. Interfejsy

- `ILlmClient`: generowanie tekstu i **odpowiedzi w JSON zgodnej ze schematem** (dla dostawców bez trybu strukturalnego: prośba o JSON + walidacja + 1 ponowienie).
- `IEmbeddingClient`: wektor dla tekstu/partii tekstów.
- Prompty jako pliki zasobów (np. `Prompts/*.md`), nie stringi rozsiane po kodzie.



### 6.2. Zasady

1. **Anonimizacja przed wysłaniem do LLM:** usuń z treści zgłoszeń telefony, e-maile, PESEL, adresy, imiona i nazwiska (regex + prosta lista).
2. **Model wybiera tylko z katalogu.** Każde zwrócone `innovationId` sprawdzaj w bazie; nieznane id odrzucaj.
3. **Każdy wynik ma uzasadnienie** odwołujące się do konkretnych pól karty lub genomu.
4. **Odpowiedzi z raportów zawsze z cytatem** (tytuł raportu, rok, numer strony).
5. Wyniki dopasowań zapisuj (`MatchResult`); te same dane wejściowe = wynik z bazy.
6. Mapa Wyzwań = dane krajowe, Obserwator = dane gminy; LLM nie liczy statystyk, dostaje gotowe liczby z SQL.



### 6.3. Genom innowacji

Jednorazowo dla każdej innowacji (po imporcie seedu i po dodaniu nowej): LLM czyta 6 sekcji karty i zwraca JSON `InnovationGenome`. Status `draft`, a admin zatwierdza lub poprawia w panelu. Embedding liczony z `summary` + `rootCauses` + `mechanisms`.

### 6.4. Dopasowanie (rdzeń matchmakingu)

1. **Klasyfikacja zgłoszenia:** LLM zwraca obszar(y) Mapy Wyzwań, przyczyny, grupę docelową, kontekst (gmina, zasoby), a jeśli opis jest za ogólny, **do 3 pytań doprecyzowujących**.
2. **Kandydaci:** wyszukiwanie hybrydowe po innowacjach: pełnotekstowe (słowa kluczowe, ważne dla oceny jury) + wektorowe po genomach + filtr obszaru. ~30 kandydatów.
  - Dopóki embeddingi nie są ustalone: pomiń część wektorową i podaj modelowi **genomy wszystkich innowacji** (115 × ~150 tokenów to mało).
3. **Ranking:** LLM dostaje zgłoszenie + genomy kandydatów i zwraca top 3–5: `innovationId`, `score` 0–100, uzasadnienie, cytowane pola, „co trzeba dostosować”.
4. **Krzyżówka:** gdy najlepszy `score` < progu (konfigurowalny, np. 50), LLM tworzy hybrydę z 2–3 innowacji: nazwa, opis, z czego pochodzi (id), „dlaczego razem”. Zapis jako `MatchResult(kind = hybrid)` z przyciskiem „Rozwiń w Kreatorze”.
5. **Podobne zgłoszenia:** licz zgłoszenia z tym samym obszarem/przyczyną (i, gdy będą embeddingi, podobne wektorowo). Pokaż „Podobny problem zgłosiło N osób z M gmin”.



### 6.5. Karta dopasowania do gminy (`FitAssessment`)

Wejście: innowacja + gmina. Backend pobiera z SQL portret gminy: wskaźniki powiązane z obszarami innowacji + średnia regionu + rok danych. Przykłady wskaźników: indeks starości, podwójne starzenie, potencjał pielęgnacyjny, gęstość zaludnienia, dzienne domy pomocy, UTW, ŚDS, mieszkania wspomagane, budżet gminy. LLM porównuje je z `requiredResources` i zwraca JSON: `fit` (wysoka/średnia/niska), co zostaje bez zmian, co dostosować, czego brakuje (z liczbami), model usługi (kto realizuje: OPS/CUS/NGO, forma: zadanie publiczne/usługa), szacunek skali (liczba odbiorców z danych), gminy, które już to wdrożyły (gdy będą takie dane). 9 innowacji z „Małopolskich Modeli Usług Społecznych” podawaj jako przykłady przejścia od innowacji do usługi.

- Kartę generuje **każdy zalogowany** dla **dowolnej gminy** (dane Obserwatora są publiczne); pracownikowi JST podpowiadamy jego gminę. Anonim ogląda tylko karty już wygenerowane.
- Karta jest **zapisywana dla pary (innowacja, gmina, rok danych)** i używana ponownie, zamiast wołać LLM drugi raz; admin może ją przeliczyć.
- Czat asystenta przy karcie (moduł VII) należy do użytkownika, który go prowadzi.

### 6.6. Sprawdzanie duplikatów (Kreator)

Ten sam mechanizm co 6.4, ale wejściem jest fiszka. Wynik: „Podobne innowacje i pomysły” z oceną podobieństwa. Użytkownik może: dołączyć do istniejącego pomysłu, potraktować podobną innowację jako punkt wyjścia albo kontynuować z uzasadnieniem różnicy.

### 6.7. Pytania do raportów (RAG)

Raporty PDF → tekst po stronach → fragmenty (~800–1200 tokenów, z numerem strony) → embeddingi w `ResearchReportChunk`. Zapytanie: filtr po obszarze/roku → najbliższe fragmenty → LLM odpowiada **wyłącznie** na ich podstawie i zwraca cytaty (raport, strona). Brak podstaw = „Nie znalazłem tego w raportach ROPS”. **Zależy od decyzji o embeddingach.**

### 6.8. Tryb „Prościej”

LLM przepisuje opis innowacji / obszaru na tekst łatwy do czytania (krótkie zdania, proste słowa). Wynik zapisywany i **zatwierdzany przez admina** przed pokazaniem.

---



## 7. Moduły

Każdy moduł opisany jest w dwóch wariantach: **Pełny** (działa na prawdziwych danych) i **Makieta** (klikalne ekrany na danych z seedu, bez logiki AI).

**Decyzja zespołu (2026-10-03): wszystkie 7 modułów w wariancie Pełnym, w kolejności I → VII → VI → V → III → II → IV.** Warianty „Makieta” poniżej zostają tylko jako plan awaryjny, gdy zabraknie czasu. Wszystkie funkcje AI czekają na wybór dostawcy LLM, a części wektorowe i pytania do raportów — na decyzję o embeddingach ([TODO](TODO.md)).

Wyszukiwanie pełnotekstowe (6.4 krok 2): konfiguracja `simple` + `unaccent` + `pg_trgm` (PostgreSQL nie ma polskiego słownika), a krok klasyfikacji LLM zwraca słowa kluczowe w formie podstawowej i synonimy, żeby nadrobić brak stemmingu.

### I. Matchmaking — „Opisz problem” (obowiązkowy)

- **Ekran:** jedno duże pole „Opisz, co nie działa” + przycisk mikrofonu (Web Speech API) + opcjonalnie gmina (wyszukiwarka) + przełącznik „Zgłaszam w czyimś imieniu”. Bez długiego formularza.
- **Przepływ:** wyślij → (opcjonalnie) do 3 pytań doprecyzowujących jako kolejne krótkie pytania → wyniki.
- **Wyniki:** 3–5 kart innowacji: tytuł, 1 zdanie „dlaczego pasuje”, co dostosować, film, link do karty ROPS; licznik podobnych zgłoszeń; krzyżówka, gdy brak dobrego dopasowania; kod śledzenia zgłoszenia.
- **API:** `POST /api/problem-reports` (tworzy zgłoszenie, zwraca pytania albo od razu wyniki), `POST /api/problem-reports/{id}/answers` (pusta lista = „pomiń pytania”), `GET /api/problem-reports/{id}` (wyniki są częścią zgłoszenia), `GET /api/problem-reports/track/{code}`, `POST /api/problem-reports/claim` (przypięcie kodem), `GET /api/problem-reports/mine`, `GET /api/municipalities?search=`, `GET /api/auth/session`. Bez konta dostęp do `/{id}` daje nagłówek `X-Tracking-Code`.
- **SignalR:** nowe zgłoszenie → zdarzenie do grupy `admins`.
- **Reguły zgłoszenia:**
  - Zgłoszenie powstaje przy wysłaniu, ze statusem `RECEIVED`, i od razu trafia do skrzynki admina (`ProblemReportCreated`). Odpowiedzi na pytania doprecyzowujące je uzupełniają; dopasowania liczą się po odpowiedziach albo po „pomiń pytania”.
  - LLM zawsze dostaje tylko treść po anonimizacji. Opis oryginalny zapisujemy wyłącznie przy zaznaczonej zgodzie (domyślnie odznaczona); widzą go tylko autor i admin.
  - „Zgłaszam w czyimś imieniu” = `submittedOnBehalf = true` i kanał `ASSISTED`; autorem jest osoba zgłaszająca.
  - Zgłoszenie zalogowanego od razu ma autora. Zgłoszenie anonimowe dostaje kod śledzenia i autora nie ma.
- **Kod śledzenia:** 8 znaków base32 bez mylących znaków (np. `K7QM-2XDF`), unikalny. Działa jak hasło: kto go zna, widzi status, dopasowania i wątek zgłoszenia i może w nim pisać. Zalogowany użytkownik może **raz** przypiąć do konta zgłoszenie bez autora, podając jego kod.
- **Makieta:** wyniki to stałe dopasowania dla 9 person z seedu.



### II. Zasobnik wiedzy — „Atlas”

- **Ekrany:** strona główna z 8 obszarami wyzwań; strona obszaru (definicja, kluczowe wyzwania, persona, dane mojej gminy z Obserwatora vs średnia regionu, pasujące innowacje, raporty); Biblioteka (filtry: obszar, kategoria, grupa docelowa, etap; widok kart z miniaturą filmu); karta innowacji (6 sekcji, film osadzony, materiały, przełącznik „Prościej”); materiały edukacyjne (4 publikacje + Canvas); pytania do raportów (6.7).
- **Mapa wyzwań gminy:** Leaflet, kartogram wybranego wskaźnika, obok tabela.
- **Admin:** agregacja potrzeb ze zgłoszeń wg obszaru, gminy i czasu (trend), **tylko dla** `ADMIN`.
- **API:** `GET /api/challenge-areas`, `GET /api/challenge-areas/{code}`, `GET /api/innovations?…`, `GET /api/innovations/{id}`, `GET /api/municipalities/{teryt}/profile`, `GET /api/indicators/{id}/values?year=`, `POST /api/research-reports/ask`.
- **Makieta:** bez pytań do raportów, reszta na seedzie.



### III. Kreator pomysłów — „Szkółka”

- **Fiszka** (zawsze dostępna): pola z Canvasu (`seed/canvas_schema.json`): problem (intensywność, częstotliwość, skala jako **klikane skale 4-stopniowe**), odbiorcy (lista wyboru), istota rozwiązania, etap (pomysł/prototyp/przetestowane/gotowe), aktorzy zmiany, wartość dla odbiorcy (lista wyboru).
- **Sprawdzanie duplikatów** (6.6) przy zapisie i na żądanie.
- **Asystent kreatora:** czat obok fiszki: dopytuje pole po polu, proponuje nieoczywiste warianty, generuje opis wizualizacji przedmiotu (generowanie obrazu opcjonalne, za tą samą abstrakcją).
- **Start z krzyżówki:** fiszka wypełniona wstępnie danymi hybrydy, z listą innowacji źródłowych.
- **Generator wniosku** widoczny **tylko gdy jakiś** `GrantCall.isOpen`: przekształca fiszkę w wniosek pod kryteria konkretnego naboru (formularz do edycji, nie wysyłka automatyczna).
- **Reguły pomysłu:**
  - Statusy `DRAFT → SUBMITTED → ACCEPTED | REJECTED`. `DRAFT` widzi tylko autor (i współautorzy). Po wysłaniu (`IdeaSubmitted` do `admins`) pomysł widzą wszyscy zalogowani — inaczej sprawdzanie duplikatów nie miałoby czego pokazać.
  - „Dołącz do istniejącego pomysłu” robi z użytkownika **współautora** tego pomysłu.
  - Ekspert widzi wysłane pomysły ze swoich obszarów i zostawia ocenę (`IdeaReview`): rekomendację `DEVELOP` | `REVISE` | `DECLINE` i komentarz. Ocenę widzą autor i admin. `ACCEPTED`/`REJECTED` ustawia admin.
  - Admin może przekształcić pomysł `ACCEPTED` w innowację (`source = USER`) powiązaną z tym pomysłem.
- **Wniosek** (`GrantApplication`) nie ma obiegu: to edytowalny szkic pod jeden nabór, bez wysyłki i statusów oceny; użytkownik go poprawia i drukuje. Admin widzi listę wniosków w każdym naborze.
- **API:** `POST/GET/PUT /api/ideas`, `POST /api/ideas/{id}/similar`, `POST /api/ideas/{id}/assistant`, `GET /api/grant-calls?open=true`, `POST /api/ideas/{id}/grant-applications`.



### IV. Tester innowacji — „Poletko”

- **Ekrany:** lista innowacji/pomysłów szukających testerów (etap prototyp); karta z opisem i przyciskiem „Chcę testować”; profil testera (wiek, gmina, potrzeby dostępności, sprzęt); formularz oceny: gwiazdki + „co działa / co poprawić” (tekst lub głos).
- **Kontakt z zespołem innowacji:** wątek wiadomości z organizacją/autorem (moduł V).
- **AI:** zbiorcze podsumowanie opinii na listę usprawnień dla autora.
- **Reguły:**
  - Testerów szuka innowacja albo pomysł na etapie `PROTOTYPE`, gdy autor albo admin włączy „szukam testerów” (`seeksTesters`).
  - Profil testera (wiek, gmina, potrzeby dostępności, sprzęt) zapisujemy raz, przy koncie, i używamy przy kolejnych zapisach.
  - Opinię wystawia każdy zalogowany, do dowolnej innowacji („ocena istniejących rozwiązań”, REQUIREMENTS §IV). Podsumowanie AI widzą autor i admin.
- **API:** `GET /api/tests`, `POST /api/tests/{id}/signups`, `POST /api/innovations/{id}/feedback`, `GET /api/innovations/{id}/feedback/summary`.



### V. Platforma aktywnej komunikacji — „Śledź zgłoszenie”

- **Śledzenie zgłoszenia jak paczki:** oś statusów `RECEIVED → IN_ANALYSIS → WITH_EXPERT → ANSWERED → CLOSED` (w UI: przyjęte → w analizie → u eksperta → odpowiedź → zamknięte); dostęp kodem bez logowania.
  - Admin przestawia status dowolnie do przodu; ekspert tylko `WITH_EXPERT → ANSWERED`; `CLOSED` z każdego stanu ustawia admin.
  - Wiadomość autora (albo posiadacza kodu) po `ANSWERED` cofa zgłoszenie do `IN_ANALYSIS`.
- **Wątki** (`Conversation`), trzy rodzaje:

  | Rodzaj | Uczestnicy |
  |---|---|
  | `PROBLEM_REPORT` | autor albo posiadacz kodu, admini, przypisany ekspert |
  | `EXPERT_QUESTION` | pytający, eksperci obszaru (odpowiada którykolwiek), admini |
  | `PARTNERSHIP` | inicjator, admini, drugi użytkownik, jeśli ma konto |

  Wiadomość do „zespołu innowacji” ROPS (organizacja bez konta) trafia do adminów, którzy pośredniczą; przy innowacji z pomysłu użytkownika — do autora.
- **SignalR (bez e-maili):** hub `/hubs/live`. Grupy: `admins`, `experts:{obszar}`, `report:{trackingCode}`, `user:{id}`. Zdarzenia: `ProblemReportCreated`, `ProblemReportStatusChanged`, `MessagePosted`, `IdeaSubmitted`.
- **API:** `GET/POST /api/conversations`, `POST /api/conversations/{id}/messages`, `PATCH /api/problem-reports/{id}/status`.



### VI. Panel administratora — „Ogrodnik”

- **Skrzynka zgłoszeń na żywo** (SignalR): nowe zgłoszenia i fiszki, klasyfikacja AI (obszar, pilność), sugerowany ekspert, **szkic odpowiedzi do edycji**, licznik czasu od wpłynięcia.
- **Radar:** trendy potrzeb wg obszaru i gminy (wykres + mapa), **białe plamy** = obszary/skupiska zgłoszeń bez dopasowania; przycisk „Szkic naboru” (LLM tworzy projekt `GrantCall` z kryteriami).
- **Wiedza:** CRUD innowacji, zatwierdzanie genomów i tekstów „Prościej”, dodanie innowacji z linku do karty ROPS lub z PDF (AI wypełnia pola, admin zatwierdza), ponowne przeliczenie genomu/embeddingów, import raportów do RAG.
- **Nabory:** CRUD `GrantCall`, otwieranie i zamykanie.
- **Użytkownicy i role.**
- **API:** pod `/api/admin/*`, tylko rola `ADMIN`.



### VII. Middleman innowacji — „Karta dopasowania do gminy”

- **Ekran:** z karty innowacji: „Sprawdź dla mojej gminy” → wybór gminy → karta (6.5): ocena dopasowania, tabela „wymaganie innowacji vs stan gminy (wartość, średnia regionu, rok)”, co dostosować, model usługi, szacunek skali, mini-mapa.
- **Asystent:** czat dopasowujący innowację do formy usługi pod potrzeby instytucji (np. „mamy 2 opiekunki i budżet X”).
- **Eksport:** wydruk / PDF karty (CSS print wystarczy).
- **API:** `POST /api/innovations/{id}/fit` `{ teryt, recalculate }` (201 nowa karta, 200 zapisana; `recalculate` tylko admin), `GET /api/innovations/{id}/fit?teryt=` (zapisana karta, także dla anonima), `GET /api/innovations/{id}/fit/{fitId}`, `GET` i `POST /api/innovations/{id}/fit/{fitId}/assistant` (czat zalogowanego), `GET /api/innovations/{id}` (karta innowacji).

---



## 8. Frontend: zasady

- Routing: React Router. Dane: TanStack Query + wygenerowany klient OpenAPI. Formularze: React Hook Form + Zod.
- **Dostępność WCAG 2.1 AA (20% oceny):**
  - semantyczny HTML, jedna `h1` na stronę, poprawna hierarchia nagłówków, landmarki (`header`, `nav`, `main`, `footer`), link „Przejdź do treści”;
  - pełna obsługa klawiaturą, widoczny focus, brak pułapek focusu w dialogach;
  - kontrast min. 4.5:1 (tekst) i 3:1 (elementy UI); nie przekazuj informacji samym kolorem;
  - przełączniki: **powiększenie tekstu** (A / A+ / A++) i **wysoki kontrast**;
  - teksty alternatywne obrazów; filmy przez nocookie YouTube embed z tytułem;
  - komunikaty o błędach i stanach ładowania przez `aria-live`; wyniki AI ogłaszane czytnikom ekranu;
  - każda mapa i wykres ma tabelę z tymi samymi danymi;
  - mikrofon zawsze z alternatywą tekstową i informacją, że działa w Chrome/Edge;
  - po zbudowaniu sprawdź axe/Lighthouse i popraw błędy.
- Język: polski, prosty, bez żargonu; przyciski opisują akcję („Znajdź rozwiązania”, nie „Wyślij”).
- Etykiety w UI zwykłymi słowami („Opisz problem”, „Biblioteka innowacji”, „Sprawdź dla mojej gminy”). Nazwy „Atlas”, „Szkółka”, „Poletko”, „Ogrodnik” tylko jako podtytuły/marka.
- Mobile first, działa od 360 px szerokości.

---



## 9. Backend: zasady

- **Kontynuuj istniejącą architekturę** w `backend/` ([`architecture/`](architecture/)). Dodawaj moduły w jej konwencji.
- OpenAPI z poprawnymi schematami odpowiedzi (także kodami 201/204), bo z nich generuje się klient frontendu. Dokument `backend/openapi/Castor.Api.json` powstaje przy `dotnet build` i jest commitowany; UI Scalar pod `/scalar/v1` tylko w `Development`.
- Migracje bazy: EF Core (`dotnet dotnet-ef`); rozszerzenia `vector`, `unaccent`, `pg_trgm` włączone migracją.
- Seed: import z `Seed__Path` przy starcie, gdy `Seed__OnStartup=true`; idempotentny — treści tylko dopisywane, statystyki upsertowane ([ADR 0003](adr/0003-seed-import-without-overwriting-content.md)).
- Wywołania LLM: timeout, ponowienie przy 429/5xx, logowanie czasu i liczby tokenów (bez treści zgłoszeń w logach).
- Długie operacje (genomy dla 115 innowacji, embeddingi raportów) jako zadania w tle z postępem w panelu admina: w procesie (`BackgroundService` + `Channel`), stan i postęp w tabeli zadań; zadanie przerwane restartem dostaje status `FAILED` i można je uruchomić ponownie (jest idempotentne). Bez Hangfire i zewnętrznych kolejek.
- Walidacja wejścia, limity rozmiaru tekstu, rate limiting na publicznych endpointach AI (wbudowany `RateLimiter` ASP.NET Core, limit na IP).
- Anonimizacja (6.2 pkt 1) to czysty typ reguły w `Domain/`.
- „Te same dane wejściowe = wynik z bazy” (6.2 pkt 5) znaczy: dopasowania są zapisane przy zgłoszeniu (`MatchResult`) i nie liczą się drugi raz; nie ma pamięci podręcznej po skrócie tekstu między różnymi zgłoszeniami.

---



## 10. Ograniczenia i zakazy

- Żadnych prawdziwych danych osobowych w seedzie, demo i logach. Użytkownicy demo = 9 person z Mapy Wyzwań.
- Nie kopiuj materiałów ROPS (ZIP, PDF, filmy) do repo ani na serwer; linkuj.
- Nie dodawaj e-maili, SMS ani powiadomień push.
- Nie dodawaj i18n.
- Nie pisz testów (decyzja zespołu na hackathon) — ani w backendzie, ani we frontendzie.
- Nie wiąż kodu z jednym dostawcą LLM ani embeddingów.

---



## 11. Decyzje

Rozstrzygnięcia z sesji projektowej 2026-10-03. Treść reguł jest już w sekcjach powyżej; tu jest dziennik, skąd się wzięły.

| # | Decyzja | Gdzie |
|---|---|---|
| D-1 | Nazwa produktu: **Castor** (jak szkielet backendu). Metafora marki z pierwszej wersji SPEC usunięta; „karta szczepienia” → **karta dopasowania do gminy** | §0, §6.5, VII |
| D-2 | Sesja w cookie zamiast ASP.NET Core Identity + JWT | §1, [ADR 0001](adr/0001-cookie-session-instead-of-jwt.md) |
| D-3 | Jedna rola na użytkownika (`RESIDENT`, `MUNICIPAL_OFFICER`, `EXPERT`, `ADMIN`); pracownik JST z jedną gminą, ekspert z obszarami; role nadaje admin | §5 |
| D-4 | Brak testów w całym repo; projekt `backend/tests/` do usunięcia | §1, §10 |
| D-5 | Prefiks `/api` dla wszystkich kontrolerów; `openapi.json` z buildu, commitowany; Scalar tylko w `Development` | §1, §9 |
| D-6 | Jeden `docker-compose.yml` w korzeniu (db, backend, frontend); obraz `pgvector/pgvector:pg17`; zmienna `ConnectionStrings__Castor` | §2, §3 |
| D-7 | Embeddingi i pierwszy dostawca LLM — odłożone | [TODO](TODO.md) |
| D-8 | Katalog `Shared/` dla usług używanych przez kilka funkcji; brak zakazów zależności między katalogami | [ADR 0002](adr/0002-shared-folder-and-no-dependency-rules.md) |
| D-9 | Import seedu przy starcie: treści tylko dopisywane, statystyki upsertowane | §9, [ADR 0003](adr/0003-seed-import-without-overwriting-content.md) |
| D-10 | Wszystkie 7 modułów w wariancie pełnym, kolejność I → VII → VI → V → III → II → IV | §7 |
| D-11 | Nazwy encji wg [`GLOSSARY.md`](../GLOSSARY.md): `Municipality`, `ResearchReport`, `Conversation`, `GrantApplication`, `FitAssessment` | §4.2 |
| D-12 | Cykl życia zgłoszenia, kod śledzenia, przypięcie zgłoszenia anonimowego, opis oryginalny | §7 I, V |
| D-13 | Full-text: `simple` + `unaccent` + `pg_trgm` + słowa kluczowe z LLM | §7 |
| D-14 | Karta dopasowania: każdy zalogowany, dowolna gmina, zapisywana dla (innowacja, gmina, rok danych) | §6.5 |
| D-15 | Pomysł: statusy, widoczność, współautorzy, ocena eksperta, przekształcenie w innowację; wniosek bez obiegu | §7 III |
| D-16 | Wątki: trzy rodzaje i ich uczestnicy | §7 V |
| D-17 | Poletko: kto szuka testerów, profil testera, kto wystawia opinie | §7 IV |
| D-18 | Zadania w tle w procesie; rate limiting wbudowany; anonimizacja w `Domain/` | §9 |

Moduł I — sesja projektowa 2026-10-03 (po szkielecie):

| # | Decyzja | Gdzie |
|---|---|---|
| D-19 | Do wyboru dostawcy LLM działa dostawca `placeholder`: bez usługi zewnętrznej, deterministyczne odpowiedzi z pokrycia słów, te same typy wejścia i wyjścia co prawdziwy model. Aplikacja startuje bez klucza; nieznany dostawca nadal zatrzymuje start | §3, [TODO](TODO.md) |
| D-20 | Dane modułu I: skrypty `innovations.py`, `models.py`, `challenges.py` (obszary + persony) i `municipalities.py` (gminy z API BDL GUS); seed commitowany, import przy starcie | §4.1, `data/README.md` |
| D-21 | Dopasowanie korzysta z genomu `DRAFT`, dopóki administrator go nie zatwierdzi; zatwierdzony genom go zastępuje. Genomy liczy zadanie w tle po imporcie seedu | §6.3, GLOSSARY |
| D-22 | Klasyfikacja i dopasowanie liczą się w żądaniu HTTP (bez zadania w tle); nginx czeka do 120 s | §6.4 |
| D-23 | Jedna runda pytań doprecyzowujących: wszystkie naraz, w UI po jednym, odpowiedzi jednym żądaniem; bez drugiej rundy | §7 I |
| D-24 | Każde zgłoszenie (także od zalogowanego) ma kod śledzenia; bez konta dostęp do `/{id}` daje nagłówek `X-Tracking-Code`, inaczej 404 | §7 I |
| D-25 | „Podobny problem zgłosiło N osób z M gmin” = zgłoszenia z tym samym głównym obszarem wyzwań; podobieństwo wektorowe dojdzie z embeddingami | §6.4 |
| D-26 | UI modułu I to surowy, funkcjonalny HTML bez stylów (semantyka i dostępność zostają); formularze bez React Hook Form i Zod | §8 |
| D-27 | Krzyżówka pokazywana w całości, przycisk „Rozwiń w Kreatorze” dochodzi z modułem III | §6.4, §7 III |
| D-28 | Limity PoC: opis 20–3000 znaków, odpowiedź do 500, 10 żądań AI na minutę na IP | §9 |

Moduł VII — 2026-10-03:

| # | Decyzja | Gdzie |
|---|---|---|
| D-29 | Obserwator: dla każdego ze 184 wskaźników ostatni rok z jego strony; wartości gmin, a gdy wskaźnik jest tylko powiatowy — wartości powiatów (karta pokazuje je jako „dane dla powiatu”). Wskaźniki tylko wojewódzkie pomijamy | §4.1, `data/scrapers/observer.py` |
| D-30 | Wskaźnik → obszary wyzwań: reguły w skrypcie (grupa Obserwatora + słowa w nazwie); sześć wskaźników ogólnych (ludność, gęstość, urbanizacja, mieszkańcy na pracownika socjalnego, wydatki gminy ogółem i na pomoc społeczną) trafia do każdej karty | §6.5 |
| D-31 | Średnia regionu = średnia wartości wszystkich gmin (albo powiatów) w tym samym roku, liczona w SQL | §6.5 |
| D-32 | Liczby w tabeli „wymaganie vs gmina” bierzemy z bazy, nie od modelu: model wskazuje tylko, który wskaźnik ilustruje które wymaganie | §6.2 pkt 6 |
| D-33 | Czat asystenta: jeden wątek na kartę i użytkownika, wiadomości anonimizowane jak zgłoszenia | §6.5, §7 VII |
| D-34 | Mini-mapa karty dochodzi z GeoJSON-em gmin w module II; do tego czasu karta ma tabelę. Podpowiadanie gminy pracownikowi JST — gdy admin (moduł VI) przypisze mu gminę | §7 VII, [TODO](TODO.md) |

