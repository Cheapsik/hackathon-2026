# [nazwa aplikacji] — specyfikacja dla agenta budującego aplikację

Ten plik mówi agentowi **co** zbudować i **jak**.

Zasada nadrzędna: **nie zmieniaj decyzji z sekcji 1 bez pytania człowieka**. Gdy czegoś tu brakuje, zapytaj albo wybierz najprostsze rozwiązanie i zapisz je w sekcji 13 („Decyzje podjęte przez agenta”).

---



## 0. Czym jest [nazwa aplikacji] (w 5 zdaniach)

Platforma Małopolskiego Hubu Innowacji Społecznych (ROPS Kraków). Mieszkaniec, NGO albo gmina opisuje problem, a system dobiera sprawdzone innowacje z Biblioteki ROPS i wyjaśnia, dlaczego pasują. Gmina dostaje „kartę [nazwa aplikacji]ienia”, czyli ocenę, czy dana innowacja przyjmie się u niej, na podstawie danych z Obserwatora Statystyk Społecznych. Gdy nic nie pasuje, system proponuje hybrydę kilku innowacji („krzyżówka”), która trafia do Kreatora jako szkic pomysłu. Administrator ROPS widzi zgłoszenia na żywo, trendy potrzeb i białe plamy, czyli obszary bez innowacji.

Metafora (tylko marka i grafika, **nie** etykiety w UI): [nazwa aplikacji]ienie drzew. Innowacji nie kopiuje się 1:1, tylko „[nazwa aplikacji]i” na lokalnych zasobach gminy.

---



## 1. Decyzje techniczne (ustalone, nie zmieniać)


| Obszar                 | Decyzja                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Repozytorium           | Jedno repo. Backend w podkatalogu `backend/`                                                                                                |
| Backend                | **.NET 10**. Backend już powstaje poza tym repo; trafi do `backend/`. **Kontynuuj jego istniejącą architekturę**, nie narzucaj nowej        |
| Baza                   | **PostgreSQL + pgvector** (powstaje razem z backendem)                                                                                      |
| ORM / dostęp do danych | Taki, jaki jest już w backendzie (jeśli nic nie ma: EF Core + Npgsql + `Pgvector.EntityFrameworkCore`)                                      |
| Frontend               | **Vite + React + TypeScript** w `frontend/`                                                                                                 |
| UI                     | **shadcn/ui + Tailwind CSS** (Radix pod spodem, dostępność)                                                                                 |
| Kontrakt API           | **REST + OpenAPI** z .NET; frontend generuje typy i klienta (np. `orval` lub `openapi-typescript`) + **TanStack Query**                     |
| Logowanie i role       | **ASP.NET Core Identity + JWT** (role w sekcji 5)                                                                                           |
| LLM                    | **Za abstrakcją z adapterami** (`ILlmClient`). Dostawca, model, klucz i URL z sekretów. Nie wiązać kodu z jednym dostawcą                   |
| Embeddingi             | **Do ustalenia.** Zrób interfejs `IEmbeddingClient` z adapterami jak przy LLM; model i wymiar wektora z konfiguracji. Nie hardkoduj wymiaru |
| Czas rzeczywisty       | **SignalR**. Bez e-maili, SMS-ów i push: tylko aktualizacje na żywo w aplikacji                                                             |
| Głos                   | **Web Speech API** w przeglądarce (`pl-PL`), zawsze z polem tekstowym jako alternatywą                                                      |
| Mapa                   | **Leaflet + GeoJSON granic gmin Małopolski**; każda mapa ma obok tabelę z tymi samymi danymi (dostępność)                                   |
| Import danych          | **Skrypty Python → pliki seed JSON** w `data/seed/`; backend importuje seed przy starcie (idempotentnie)                                    |
| Język UI               | **Tylko polski, teksty na sztywno** (bez i18n)                                                                                              |
| Testy                  | **Brak testów** w szkielecie                                                                                                                |
| Wdrożenie demo         | **Docker na VPS**: `docker-compose.yml` w korzeniu repo                                                                                     |


---



## 2. Docelowa struktura repo (instrukcja, nie generuj na zapas)

```
/backend            .NET 10 (istniejący projekt; nie przebudowuj struktury)
/frontend           Vite + React + TS + shadcn/ui
/data
  /scrapers         skrypty Python (requirements.txt)
  /seed             wynikowe JSON-y (commitowane)
  /geo              GeoJSON gmin Małopolski
/docs               REQUIREMENTS.md, IDEA.md, LINKS.md, SPEC.md, raport
docker-compose.yml
.env.example        wszystkie zmienne z sekcji 3, bez wartości sekretów
```

Usługi w `docker-compose.yml`:

- `db`: obraz `pgvector/pgvector` (Postgres z pgvector), wolumen na dane, healthcheck.
- `backend`: build z `backend/`, zależy od `db`, czyta zmienne z `.env`, wystawia API, `/swagger` i `/hubs/*`.
- `frontend`: build Vite, serwowany przez nginx; nginx proxuje `/api` i `/hubs` (z WebSocketami) do `backend`.

Jeden `docker compose up` ma postawić działające demo z zaimportowanym seedem.

---



## 3. Konfiguracja i sekrety

Wszystko przez zmienne środowiskowe (konwencja .NET `Sekcja__Klucz`). Wartości tylko w `.env` (poza gitem); w repo jest `.env.example`.


| Zmienna                                                                                  | Znaczenie                                                      |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ConnectionStrings__Postgres`                                                            | Połączenie do bazy                                             |
| `Jwt__Issuer`, `Jwt__Audience`, `Jwt__Key`                                               | Tokeny JWT                                                     |
| `Llm__Provider`                                                                          | np. `anthropic`, `openai`, `azure-openai`, `openai-compatible` |
| `Llm__Model`                                                                             | identyfikator modelu u dostawcy                                |
| `Llm__ApiKey`, `Llm__BaseUrl`                                                            | klucz i (opcjonalnie) adres API                                |
| `Llm__MaxOutputTokens`, `Llm__TimeoutSeconds`                                            | limity                                                         |
| `Embeddings__Provider`, `Embeddings__Model`, `Embeddings__ApiKey`, `Embeddings__BaseUrl` | jak wyżej, **do ustalenia**                                    |
| `Embeddings__Dimensions`                                                                 | wymiar wektora; kolumny `vector(N)` tworzone z tej wartości    |
| `Seed__Path`                                                                             | ścieżka do `data/seed` w kontenerze                            |
| `Seed__OnStartup`                                                                        | `true`/`false`                                                 |
| `Cors__AllowedOrigins`                                                                   | adres frontendu                                                |


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

Nazwy orientacyjne; dopasuj do konwencji istniejącego backendu.

- **ChallengeArea**: 8 obszarów Mapy Wyzwań (kod, nazwa, definicja, kluczowe wyzwania[], powiązane wskaźniki[]).
- **Persona**: 9 person (imię, wiek, opis, cele, wyzwania, motywacje, obszar). Służą do demo i testu trafności.
- **Innovation**: tytuł, krótki opis, kategoria biblioteki, 6 sekcji karty, `organization`, URL karty / filmu / ZIP / PDF / zasad, `featured`, `inServiceModel`, `stage` (pomysł/prototyp/przetestowane/gotowe), `source` (`rops` | `user`).
- **InnovationGenome** (1:1 z Innovation): `rootCauses[]`, `mechanisms[]`, `targetGroups[]`, `requiredSoil[]` (instytucje, ludzie, budżet, infrastruktura), `scale`, `challengeAreas[]`, `summary` (≤ 600 znaków), `embedding vector(N)`, `status` (`draft` | `approved`), `approvedBy`, `approvedAt`.
- **Gmina**: TERYT, nazwa, typ (miejska/wiejska/miejsko-wiejska), powiat.
- **Indicator**: id z Obserwatora, nazwa, grupa, jednostka, opis, źródło.
- **IndicatorValue**: gmina, wskaźnik, rok, wartość.
- **Report** + **ReportChunk**: raport (metadane, obszary) i fragmenty tekstu ze stroną PDF i `embedding vector(N)`.
- **ProblemReport** (zgłoszenie): treść (po anonimizacji), opis oryginalny tylko jeśli autor się zgodził, gmina, obszar(y), kanał (`tekst` | `głos` | `asysta`), `submittedOnBehalf`, status, `trackingCode`, autor (opcjonalny), daty.
- **MatchResult**: zgłoszenie, innowacja, pozycja, `score`, uzasadnienie, cytowane pola karty, `kind` (`match` | `hybrid`).
- **Idea** (fiszka z Kreatora): pola Canvasu, autor, status, powiązane podobne innowacje/pomysły, `fromHybridOf[]`.
- **GrantCall** (nabór): tytuł, daty, kryteria, `isOpen`. **Application**: fiszka dopasowana do naboru.
- **TestSignup** / **Feedback**: zapis na test i ocena/uwagi do innowacji (także transkrypcja głosowa).
- **Thread** / **Message**: rozmowy (zgłoszenie ↔ ROPS, pytania do mentora, partnerstwa).
- Tożsamość: tabele ASP.NET Identity + role.

---



## 5. Role


| Rola           | Kto              | Może                                                                                                             |
| -------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `anon`         | każdy            | przeglądać Atlas i Bibliotekę, zgłosić problem **bez konta** (dostaje kod śledzenia), sprawdzić status po kodzie |
| `resident`     | mieszkaniec, NGO | jak `anon` + własne zgłoszenia, fiszki, zapisy na testy, wiadomości                                              |
| `municipality` | pracownik JST    | jak `resident` + karta [nazwa aplikacji]ienia dla swojej gminy, mapa wyzwań gminy                                |
| `expert`       | ekspert, mentor  | odpowiada w wątkach ze swoich obszarów, ocenia fiszki                                                            |
| `admin`        | pracownik ROPS   | wszystko + panel administratora, trendy, zatwierdzanie genomów, nabory                                           |


Trendy i agregaty potrzeb są **wyłącznie dla** `admin` (wymóg briefu).

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



### 6.5. Karta [nazwa aplikacji]ienia

Wejście: innowacja + gmina. Backend pobiera z SQL portret gminy: wskaźniki powiązane z obszarami innowacji + średnia regionu + rok danych. Przykłady wskaźników: indeks starości, podwójne starzenie, potencjał pielęgnacyjny, gęstość zaludnienia, dzienne domy pomocy, UTW, ŚDS, mieszkania wspomagane, budżet gminy. LLM porównuje je z `requiredSoil` i zwraca JSON: `fit` (wysoka/średnia/niska), co zostaje bez zmian, co dostosować, czego brakuje (z liczbami), model usługi (kto realizuje: OPS/CUS/NGO, forma: zadanie publiczne/usługa), szacunek skali (liczba odbiorców z danych), gminy, które już to wdrożyły (gdy będą takie dane). 9 innowacji z „Małopolskich Modeli Usług Społecznych” podawaj jako przykłady przejścia od innowacji do usługi.

### 6.6. Sprawdzanie duplikatów (Kreator)

Ten sam mechanizm co 6.4, ale wejściem jest fiszka. Wynik: „Podobne innowacje i pomysły” z oceną podobieństwa. Użytkownik może: dołączyć do istniejącego pomysłu, potraktować podobną innowację jako punkt wyjścia albo kontynuować z uzasadnieniem różnicy.

### 6.7. Pytania do raportów (RAG)

Raporty PDF → tekst po stronach → fragmenty (~800–1200 tokenów, z numerem strony) → embeddingi w `ReportChunk`. Zapytanie: filtr po obszarze/roku → najbliższe fragmenty → LLM odpowiada **wyłącznie** na ich podstawie i zwraca cytaty (raport, strona). Brak podstaw = „Nie znalazłem tego w raportach ROPS”. **Zależy od decyzji o embeddingach.**

### 6.8. Tryb „Prościej”

LLM przepisuje opis innowacji / obszaru na tekst łatwy do czytania (krótkie zdania, proste słowa). Wynik zapisywany i **zatwierdzany przez admina** przed pokazaniem.

---



## 7. Moduły

Każdy moduł opisany jest w dwóch wariantach: **Pełny** (działa na prawdziwych danych) i **Makieta** (klikalne ekrany na danych z seedu, bez logiki AI). **O tym, który moduł w jakim wariancie budujemy, decyduje człowiek. Nie zaczynaj modułu bez jego decyzji.** Sugerowana kolejność, jeśli człowiek nie wskaże innej: I → VII → VI → V → III → II → IV.

### I. Matchmaking — „Opisz problem” (obowiązkowy)

- **Ekran:** jedno duże pole „Opisz, co nie działa” + przycisk mikrofonu (Web Speech API) + opcjonalnie gmina (wyszukiwarka) + przełącznik „Zgłaszam w czyimś imieniu”. Bez długiego formularza.
- **Przepływ:** wyślij → (opcjonalnie) do 3 pytań doprecyzowujących jako kolejne krótkie pytania → wyniki.
- **Wyniki:** 3–5 kart innowacji: tytuł, 1 zdanie „dlaczego pasuje”, co dostosować, film, link do karty ROPS; licznik podobnych zgłoszeń; krzyżówka, gdy brak dobrego dopasowania; kod śledzenia zgłoszenia.
- **API (orientacyjnie):** `POST /api/problem-reports` (tworzy zgłoszenie, zwraca pytania lub wyniki), `POST /api/problem-reports/{id}/answers`, `GET /api/problem-reports/{id}/matches`, `GET /api/problem-reports/track/{code}`.
- **SignalR:** nowe zgłoszenie → zdarzenie do grupy `admins`.
- **Makieta:** wyniki to stałe dopasowania dla 9 person z seedu.



### II. Zasobnik wiedzy — „Atlas”

- **Ekrany:** strona główna z 8 obszarami wyzwań; strona obszaru (definicja, kluczowe wyzwania, persona, dane mojej gminy z Obserwatora vs średnia regionu, pasujące innowacje, raporty); Biblioteka (filtry: obszar, kategoria, grupa docelowa, etap; widok kart z miniaturą filmu); karta innowacji (6 sekcji, film osadzony, materiały, przełącznik „Prościej”); materiały edukacyjne (4 publikacje + Canvas); pytania do raportów (6.7).
- **Mapa wyzwań gminy:** Leaflet, kartogram wybranego wskaźnika, obok tabela.
- **Admin:** agregacja potrzeb ze zgłoszeń wg obszaru, gminy i czasu (trend), **tylko dla** `admin`.
- **API:** `GET /api/challenge-areas`, `GET /api/challenge-areas/{code}`, `GET /api/innovations?…`, `GET /api/innovations/{id}`, `GET /api/gminas/{teryt}/profile`, `GET /api/indicators/{id}/values?year=`, `POST /api/reports/ask`.
- **Makieta:** bez pytań do raportów, reszta na seedzie.



### III. Kreator pomysłów — „Szkółka”

- **Fiszka** (zawsze dostępna): pola z Canvasu (`seed/canvas_schema.json`): problem (intensywność, częstotliwość, skala jako **klikane skale 4-stopniowe**), odbiorcy (lista wyboru), istota rozwiązania, etap (pomysł/prototyp/przetestowane/gotowe), aktorzy zmiany, wartość dla odbiorcy (lista wyboru).
- **Sprawdzanie duplikatów** (6.6) przy zapisie i na żądanie.
- **Asystent kreatora:** czat obok fiszki: dopytuje pole po polu, proponuje nieoczywiste warianty, generuje opis wizualizacji przedmiotu (generowanie obrazu opcjonalne, za tą samą abstrakcją).
- **Start z krzyżówki:** fiszka wypełniona wstępnie danymi hybrydy, z listą innowacji źródłowych.
- **Generator wniosku** widoczny **tylko gdy jakiś** `GrantCall.isOpen`: przekształca fiszkę w wniosek pod kryteria konkretnego naboru (formularz do edycji, nie wysyłka automatyczna).
- **API:** `POST/GET/PUT /api/ideas`, `POST /api/ideas/{id}/similar`, `POST /api/ideas/{id}/assistant`, `GET /api/grant-calls?open=true`, `POST /api/ideas/{id}/applications`.



### IV. Tester innowacji — „Poletko”

- **Ekrany:** lista innowacji/pomysłów szukających testerów (etap prototyp); karta z opisem i przyciskiem „Chcę testować”; profil testera (wiek, gmina, potrzeby dostępności, sprzęt); formularz oceny: gwiazdki + „co działa / co poprawić” (tekst lub głos).
- **Kontakt z zespołem innowacji:** wątek wiadomości z organizacją/autorem (moduł V).
- **AI:** zbiorcze podsumowanie opinii na listę usprawnień dla autora.
- **API:** `GET /api/tests`, `POST /api/tests/{id}/signups`, `POST /api/innovations/{id}/feedback`, `GET /api/innovations/{id}/feedback/summary`.



### V. Platforma aktywnej komunikacji — „Śledź zgłoszenie”

- **Śledzenie zgłoszenia jak paczki:** oś statusów `przyjęte → w analizie → u eksperta → odpowiedź → zamknięte`; dostęp kodem bez logowania.
- **Wątki:** zgłoszenie ↔ ROPS, pytanie do mentora/eksperta (kierowane wg obszaru), propozycja partnerstwa (np. „połącz mnie z gminą, która to wdrożyła”).
- **SignalR (bez e-maili):** hub `/hubs/live`. Grupy: `admins`, `experts:{obszar}`, `report:{trackingCode}`, `user:{id}`. Zdarzenia: `ProblemReportCreated`, `ProblemReportStatusChanged`, `MessagePosted`, `IdeaSubmitted`.
- **API:** `GET/POST /api/threads`, `POST /api/threads/{id}/messages`, `PATCH /api/problem-reports/{id}/status`.



### VI. Panel administratora — „Ogrodnik”

- **Skrzynka zgłoszeń na żywo** (SignalR): nowe zgłoszenia i fiszki, klasyfikacja AI (obszar, pilność), sugerowany ekspert, **szkic odpowiedzi do edycji**, licznik czasu od wpłynięcia.
- **Radar:** trendy potrzeb wg obszaru i gminy (wykres + mapa), **białe plamy** = obszary/skupiska zgłoszeń bez dopasowania; przycisk „Szkic naboru” (LLM tworzy projekt `GrantCall` z kryteriami).
- **Wiedza:** CRUD innowacji, zatwierdzanie genomów i tekstów „Prościej”, dodanie innowacji z linku do karty ROPS lub z PDF (AI wypełnia pola, admin zatwierdza), ponowne przeliczenie genomu/embeddingów, import raportów do RAG.
- **Nabory:** CRUD `GrantCall`, otwieranie i zamykanie.
- **Użytkownicy i role.**
- **API:** pod `/api/admin/`*, tylko rola `admin`.



### VII. Middleman innowacji — „Karta [nazwa aplikacji]ienia”

- **Ekran:** z karty innowacji: „Sprawdź dla mojej gminy” → wybór gminy → karta (6.5): ocena dopasowania, tabela „wymaganie innowacji vs stan gminy (wartość, średnia regionu, rok)”, co dostosować, model usługi, szacunek skali, mini-mapa.
- **Asystent:** czat dopasowujący innowację do formy usługi pod potrzeby instytucji (np. „mamy 2 opiekunki i budżet X”).
- **Eksport:** wydruk / PDF karty (CSS print wystarczy).
- **API:** `POST /api/innovations/{id}/fit` `{ teryt }`, `POST /api/innovations/{id}/fit/{fitId}/assistant`.

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

- **Kontynuuj istniejącą architekturę** w `backend/`. Dodawaj moduły w jej konwencji.
- OpenAPI włączone (Swagger UI pod `/swagger`) z poprawnymi schematami odpowiedzi, bo z nich generuje się klient frontendu.
- Migracje bazy: mechanizm już używany w backendzie; rozszerzenie `vector` włączone migracją.
- Seed: import z `Seed__Path` przy starcie, gdy `Seed__OnStartup=true`; idempotentny (upsert po kluczu źródłowym).
- Wywołania LLM: timeout, ponowienie przy 429/5xx, logowanie czasu i liczby tokenów (bez treści zgłoszeń w logach).
- Długie operacje (genomy dla 115 innowacji, embeddingi raportów) jako zadania w tle z postępem w panelu admina.
- Walidacja wejścia, limity rozmiaru tekstu, rate limiting na publicznych endpointach AI.

---



## 10. Ograniczenia i zakazy

- Żadnych prawdziwych danych osobowych w seedzie, demo i logach. Użytkownicy demo = 9 person z Mapy Wyzwań.
- Nie kopiuj materiałów ROPS (ZIP, PDF, filmy) do repo ani na serwer; linkuj.
- Nie dodawaj e-maili, SMS ani powiadomień push.
- Nie dodawaj i18n.
- Nie pisz testów (decyzja zespołu na hackathon).
- Nie wiąż kodu z jednym dostawcą LLM ani embeddingów.

