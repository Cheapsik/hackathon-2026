# Struktura kodu i konwencje

## Układ repozytorium

```
<repo>/
├── AGENTS.md, README.md, GLOSSARY.md, .gitignore, .gitattributes   ← wspólne dla całego zespołu
├── docker-compose.yml, .env.example, .dockerignore                 ← całe demo: db + backend + frontend
├── docs/
│   ├── REQUIREMENTS.md, LINKS.md   treść zadania HubMI i linki do zasobów ROPS
│   ├── SPEC.md                co budujemy — źródło prawdy dla „co”
│   ├── TODO.md                decyzje odłożone na później i to, co blokują
│   ├── assumptions.md         założenia agenta do weryfikacji
│   ├── adr/                   decyzje trudne do odwrócenia
│   └── architecture/          jak budujemy — rozstrzygnięte
├── backend/
│   ├── AGENTS.md, CLAUDE.md   zasady backendu (węższe niż AGENTS.md w korzeniu)
│   ├── .editorconfig, .gitignore, Directory.Build.props, Dockerfile, Dockerfile.dockerignore, dotnet-tools.json, global.json
│   ├── Castor.slnx
│   ├── openapi/               Castor.Api.json z buildu — wejście generatora klienta frontendu
│   └── src/Castor.Api/
├── frontend/                  Vite + React + TS — patrz 04-frontend.md
├── data/                      scrapers/ (Python), seed/ (JSON), geo/ (GeoJSON gmin)
└── tools/film/                automatyczne nagranie filmu prezentującego (Playwright, głos, ffmpeg) — patrz jego README
```

## Jeden projekt — monolit

Backend jest **jednym projektem** z jedną bazą i jednym wdrożeniem. **Nie dzielimy go na moduły ani osobne projekty** (`.Domain.csproj`, `.Application.csproj`) z portami między nimi. Katalogi porządkują kod według roli, a reguł pilnują encje, nie foldery.

## Układ kodu

```
backend/src/Castor.Api/
├── Domain/              encje, typy wartości, enumy, reguły
│   ├── DomainException.cs, NamedEnum.cs
│   ├── Identity/        User, UserRole, PasswordPolicy
│   └── <Temat>/         podfoldery tematyczne
│
├── Persistence/         DbContext, konwencje, mapowanie (…Configuration), import seedu (Seeding/)
│   └── <Temat>/
│
├── Queries/             odczyty używane przez wiele handlerów (…Query)
│   └── <Temat>/
│
├── Features/            przypadki użycia — folder na zasób
│   ├── Register/        ┐
│   ├── SignIn/          │ czynności konta i sesji — jedyne foldery nazwane czynnością
│   ├── SignOut/         ┘
│   └── <Zasoby>/        kontroler, żądania, odpowiedzi, handlery, konwerter zasobu
│
├── Shared/              usługi wykonujące czynność używaną przez kilka funkcji: Ai/ (LLM, embeddingi,
│                        prompty, potoki dopasowania), Jobs/ (zadania w tle)
│
├── Infrastructure/      mechanika żądania: filtr wyjątków, prefiks /api, cookie, CurrentUser, zegar,
│                        hub SignalR (Realtime/)
│
├── Migrations/          migracje EF Core — jedna historia
├── GlobalUsings.cs
└── Program.cs           jedyne miejsce, które składa całość (DI, middleware)
```

### `Domain/` — encje i reguły

**Reguła rozstrzygająca:** jeżeli coś opisuje, **jakie stany są dozwolone albo jak system liczy**, należy do `Domain/`. Jeżeli opisuje, **co się dzieje po kliknięciu**, należy do `Features/`.

- **Encja pilnuje własnego stanu i tego, z czego się składa.** Warunek w rodzaju „zarchiwizowanej sali nie da się zarezerwować” albo „koniec rezerwacji jest po jej początku” jest metodą encji, nie `if` w handlerze. Składową jest też encja, na którą wskazuje nawigacja: rezerwacja sprawdza swoją salę, bo ją ma (`Booking.Room`).
- **Encja nie przyjmuje faktów spoza siebie jako flag.** Parametr `bool hasBookings` nie jest walidacją: encja nie może go sprawdzić, a `if (flaga) throw` tylko udaje, że pilnuje reguły. Za dane odpowiada handler, który je wczytuje.
- **Regułę łączącą encję z danymi spoza niej** rozstrzyga:
  - **handler**, jeśli potrzebuje jej tylko on — warunek z `DomainException` tuż po wczytaniu danych;
  - **nazwany typ reguły w `Domain/`**, jeśli potrzebuje jej kilka handlerów. Typ dostaje dane, na których decyduje, i da się go przetestować bez bazy. Przykład: `RoomSchedule` dostaje rezerwacje sali z danego dnia i rozstrzyga, czy termin jest wolny — używają go `CreateBookingHandler` i `RescheduleBookingHandler`;
  - **serwis domenowy w `Domain/`**, jeśli reguła należy do czynności, którą wykonuje wiele handlerów — serwis wykonuje całą czynność: metodę encji i reguły ważące ją względem innych agregatów.
- **Za spójność na zewnątrz encji odpowiada ten, kto woła jej metodę.** Encja nie tworzy innego agregatu ani nie pośredniczy w jego walidacji.
- **Dane, z których encja liczy własną treść, mogą być parametrem jej metody** — to obliczenie tego, czym encja jest, a nie sprawdzenie cudzego faktu.
- **Stan encji zmienia się wyłącznie przez jej metody.** Właściwości mają `private set`, konstruktor jest prywatny (dla EF), encja powstaje przez statyczną metodę fabryczną o nazwie czynności (`Booking.Book`, `Room.Create`).
- **Domena nie czyta bazy.** Dane referencyjne (obszary wyzwań, gminy, wskaźniki) leżą w tabelach wypełnianych importem seedu ([ADR 0003](../adr/0003-seed-import-without-overwriting-content.md)); encja sięga do nich przez nawigację, a nie przez plik.
- **Kryterium, które musi być warunkiem zapytania** (np. które rezerwacje są aktywne) jest zapisane **raz**, w `Domain/`, jako `Expression<Func<T, bool>>` przy encji, i używane przez wszystkie zapytania. Dwa zapytania z tym samym warunkiem przepisanym ręcznie to zduplikowana reguła.

### `Persistence/` — baza

`CastorDbContext` z `DbSet` dla wszystkich tabel, globalne konwencje (precyzja, enumy jako tekst, klucze, daty), mapowanie encji (`…Configuration : IEntityTypeConfiguration<T>`), konwertery wartości i seedy danych referencyjnych. Mapowanie leży tutaj, nie obok encji — encja opisuje stan i reguły, nie kolumny.

**`Persistence/` opisuje, jak model leży w bazie — nie odpowiada na pytania.** Zapytań tu nie ma.

**Import seedu** (`Persistence/Seeding/`) czyta JSON-y z `Seed__Path` przy starcie, gdy `Seed__OnStartup=true`. Treści (innowacje, raporty z badań, obszary, persony) tylko dopisuje po kluczu źródłowym, statystyki (gminy, wskaźniki, wartości) upsertuje — [ADR 0003](../adr/0003-seed-import-without-overwriting-content.md). Genomów nie liczy: zleca je jako zadanie w tle.

### `Queries/` — odczyty wspólne

- **Każdy odczyt ma postać `…Query`**: klasa wstrzykiwana przez DI, która dostaje `CastorDbContext` w konstruktorze. Bez klas statycznych z kontekstem w parametrze i bez innych przyrostków (`…Lookup`, `…Reader`, `…Repository`).
- **Zapytanie czyta, nie rozstrzyga.** Zwraca dane, na których decyduje reguła (np. `RoomSchedule` z rezerwacjami), a nie gotową odpowiedź „czy wolno”. Wynik jest typem z `Domain/` albo nazwanym rekordem obok zapytania.
- **Odczyt jednego handlera zostaje w handlerze.** Lista, szczegóły, wczytanie encji do zmiany to część przypadku użycia, nie zapytanie wspólne.

### `Features/` — przypadki użycia

**Jeden folder funkcji zawiera wszystko, czego ta funkcja potrzebuje** — kontroler, żądania, odpowiedzi, handlery i konwerter. Zmiana jednej funkcji dotyka jednego folderu.

- **Folder obejmuje jeden zasób i jego operacje**, nie jedną czynność: utworzenie, lista, zmiana i usunięcie rezerwacji leżą w `Features/Bookings/`. Nazwa to rzeczownik zasobu w liczbie mnogiej, nazwa encji, nie słowo z UI. Wyjątek: `Register`, `SignIn`, `SignOut`.
- **Zasób o wielu typach dzieli się na podfoldery typów** (np. `Payments/Card/`, `Payments/Transfer/`), z własnym kontrolerem, żądaniami i handlerami. W folderze nadrzędnym leży to, co wspólne dla typów (lista, szczegóły, usunięcie, `Converters/` z odpowiedzią wspólną). **Podfolder może sięgać do folderu nadrzędnego, nie do rodzeństwa.**
- **Kod potrzebny kilku folderom funkcji przenosisz** do `Domain/` (reguła), `Queries/` (odczyt) albo `Shared/` (czynność, np. potok AI), zamiast sięgać do cudzego folderu funkcji.
- **Przypadek użycia, który zapisuje encje z kilku obszarów, to jeden handler** — tworzy obie encje przez ich metody i zapisuje je w jednej transakcji. Bez pośrednika i bez portów.

Pliki w folderze funkcji:

| Plik | Nazwa |
|---|---|
| Kontroler | `<Zasób w l. mn.>Controller` — `BookingsController` |
| Handler | `<Czynność><Zasób>Handler` — `CreateBookingHandler`, `ListBookingsHandler`, `GetBookingHandler`, `UpdateRoomHandler`, `ArchiveRoomHandler`, `CancelBookingHandler`, `DeleteBookingHandler` |
| Żądanie | nazwa handlera z `Request` zamiast `Handler` — `CreateBookingRequest` |
| Odpowiedź | `<Zasób>Response` — `BookingResponse`; wspólna dla handlerów zasobu |
| Konwerter | `<Zasób>Converter` — klasa statyczna z metodami rozszerzającymi `ToResponse()` |

Czasowniki: `Create`, `Get`, `List`, `Update` (PATCH), `Revise` (PUT), `Archive`, `Delete` plus czasowniki domenowe, gdy czynność nie jest zwykłą edycją (`Cancel`, `Reschedule`, `Approve`). Różnicę między `Update`, `Revise`, `Archive` i `Delete` opisuje „Zmiana i usuwanie” niżej.

### Handler, żądanie, konwersja

- **Jeden handler = jedna czynność na jednym typie.** Jedna publiczna metoda `HandleAsync`. Handler nie obsługuje kilku typów przez wspólny interfejs ani flagi.
- **Kontroler tylko tłumaczy HTTP i woła handler — także przy odczycie.** Kontroler nie dostaje `DbContext` i nie czyta danych sam.
- **Każdy handler przyjmuje własny typ żądania** o nazwie zgodnej z nazwą handlera. Żądanie nie ma pól, których handler nie czyta. Parametry trasy (`{bookingId}`) idą osobnym argumentem `HandleAsync`.
- **Żądanie opisuje intencję, nie gotowy zapis.** Formularz podaje to, co wie użytkownik; to, co wynika z reguł (status, wyliczone pola), nadaje domena.
- **Konwersja jednego typu na drugi to metoda rozszerzająca w klasie `…Converter`** wewnątrz folderu funkcji. Konwersja przepisuje i parsuje pola; reguły należą do `Domain/`. Globalnego katalogu konwersji nie ma.
- **Użytkownik nie jest parametrem handlera.** Mówi, kto pyta, a nie o co — handler bierze go z `CurrentUser`.
- **Ograniczenie widoczności sprawdza handler jawnie.** Dane są wspólne (patrz [`00-stack.md`](00-stack.md), „Dostęp do danych”); jeśli produkt zawęża, kto widzi zasób, handler sprawdza to sam i odmawia 404.
- **Handler czyta się bez skakania po plikach.** Wczytanie i zapis piszemy w każdym handlerze, nawet kosztem powtórzeń; handler nie woła innego handlera. Zduplikowane reguły biznesowe — nie; zduplikowane „wczytaj/zapisz” — tak.
- **`HandleAsync` czyta się jak spis kroków.** Długi, zamknięty blok (sprawdzenie warunków przed zapisem, zmiana kilku pól naraz) trafia do prywatnej metody tego samego handlera nazwanej tym, co robi (`EnsureNoOverlapAsync`, `ApplyChanges`). Pojedynczego wywołania nie opakowujesz w metodę.

### Zmiana i usuwanie

**Zmiana — dwa wzorce, wybierane po tym, czy pola zależą od siebie.**

| | `PATCH` + `Update…Handler` | `PUT` + `Revise…Handler` |
|---|---|---|
| Kiedy | niezależne atrybuty: nazwa, flagi, pojemność, kolejność | treść, którą trzeba sprawdzić w całości: pola zależą od siebie (dzień i godziny, kwota i waluta) |
| Żądanie | **wszystkie pola nullowalne**; komentarz `/// Only the fields present change.` | pełna treść jak przy `Create`; pola wymagane — brak to odmowa 400 |
| `null` w polu | **„nie zmieniaj”** | błąd — handler odrzuca brak |
| Handler | dla każdego obecnego pola woła metodę encji: `if (request.Name is not null) { room.Rename(request.Name, now); }` | woła jedną metodę encji z całą nową treścią, która sprawdza ją razem |

- **PATCH nie czyści pola do `null`.** Jeśli produkt potrzebuje wyczyszczenia wartości, to jest osobna czynność (`POST /<zasoby>/{id}/clear-<pole>`) albo PUT. Nie wprowadzamy pól-flag „czy pole przyszło” ani `JsonPatchDocument`.
- **Czynność z domenowym czasownikiem** (np. przesunięcie rezerwacji) wystawiamy jako `POST /<zasoby>/{id}/<czynność>` z pełną treścią tej czynności — to ten sam wzorzec co PUT, tylko z nazwą, którą zna użytkownik (`RescheduleBookingHandler`). `PUT /<zasoby>/{id}` + `Revise…` zostaje dla zasobu, którego zmiany nie da się nazwać jednym czasownikiem.

**Usuwanie — o wzorcu decyduje to, czy coś wskazuje na encję.**

- **Encja, na którą wskazują inne encje, nie jest usuwana — jest archiwizowana.** Ma status (`ACTIVE` / `ARCHIVED`) i metodę `Archive`; zarchiwizowana nie przyjmuje nowych powiązań, a stare zostają z historią. Endpoint `POST /<zasoby>/{id}/archive`, handler `Archive…Handler`. Przykład: sala, do której są rezerwacje — nie ma `DeleteRoomHandler`.
- **Twarde `Delete` ma tylko liść** — encja, na którą nic nie wskazuje (`DeleteBookingHandler`). `DELETE /<zasoby>/{id}`, 204.
- **Gdy reguła blokuje archiwizację albo usunięcie, handler sam sprawdza zależności i odmawia z 409**, mówiąc, co zrobić najpierw: „The room has upcoming bookings. Cancel or move them before archiving the room.” Sprawdzenie leży w prywatnej metodzie handlera (`EnsureNoUpcomingBookingsAsync`), a jeśli potrzebuje go kilka handlerów — w typie reguły w `Domain/`.
- **Naruszenia klucza obcego (23503) nie łapiemy.** Błąd FK oznacza, że handler zapomniał sprawdzić zależności — to błąd programisty i ma wyjść jako 500 w teście, a nie zostać zamaskowany jako 409. Inaczej niż unikalność (23505): tę łapiemy i zamieniamy na 409, bo indeks unikalny **jest** sprawdzeniem — handler nie odpytuje wcześniej, czy nazwa jest wolna.
- Klucze obce mają `DeleteBehavior.Restrict` — baza nie kasuje kaskadowo niczego za handlerem.

### Styl C#, którego pilnujemy

| Reguła | Dobrze | Źle |
|---|---|---|
| `var` tylko z typem widocznym w linii | `var booking = Booking.Book(...);` · `var room = new Room(...);` | `var now = clock.UtcNow;` · `foreach (var booking in bookings)` · `var count = 0;` |
| Wynik wywołania do nazwanej zmiennej | `string hash = passwords.HashPassword(user, password);`<br>`user.AssignPasswordHash(hash, now);` | `user.AssignPasswordHash(passwords.HashPassword(user, password), now);` |
| `await` też do zmiennej | `List<Room> rooms = await query.ToListAsync(ct);`<br>`return rooms.Select(...)` | `return (await query.ToListAsync(ct)).Select(...)` |
| Metody w klamrach | `public Task<X> Get(...) { return handler.HandleAsync(...); }` | `public Task<X> Get(...) => handler.HandleAsync(...);` |
| `=>` zostaje | liczona właściwość `public bool IsActive => Status == ...;`, lambdy | — |
| Bez krotek | `return new RoomAvailability(isFree, nextFreeAt);` | `return (isFree, nextFreeAt);` |
| Jeden typ na plik | `BookingStatus.cs`, `Booking.cs` | enum w pliku encji |
| Klamry zawsze | `if (x) { throw ...; }` | `if (x) throw ...;` |
| Pełne nazwy | `booking`, `cancellationToken`, `databaseTransaction` | `b`, `ct`, `tx` |

Wyjątki od reguły o zagnieżdżonych wywołaniach: lambda w zapytaniu EF (drzewo wyrażeń nie przyjmuje instrukcji), inicjalizator pola statycznego, `nameof`. `new` w argumencie zostaje, ale wywołania w jego argumentach też idą do zmiennych. Lambda wykonywana w pamięci, która potrzebuje wyniku wywołania, dostaje ciało w klamrach ze zmienną. Wywołanie w gałęzi `?:` przerabiasz na `if` z wczesnym `return`.

## Równoczesne zapisy

**Szkielet nie ma globalnej blokady zapisu** — bez workspace'ów nie ma czego blokować jako całości. Spójność przy równoczesnych zapisach daje baza:

- **Unikalność, `CHECK` i klucze obce** wyrażają regułę tam, gdzie się da. Naruszenie unikalności łapiemy i zamieniamy na 409: `catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))`.
- **Zapis kilku encji naraz** idzie w jednym `SaveChanges` (jedna transakcja) albo w jawnej transakcji handlera.

> **Do rozstrzygnięcia przy pierwszej takiej regule:** walidacja „odczytaj stan, sprawdź, zapisz”, której nie da się wyrazić constraintem bazy (np. limit zgłoszeń), jest podatna na wyścig dwóch równoczesnych zapisów. Gdy pojawi się pierwsza, zespół wybiera mechanizm (np. `pg_advisory_xact_lock` na identyfikatorze pilnowanego agregatu) i zapisuje go tutaj.

## `Shared/` — czynności wielu funkcji

Usługa, która **wykonuje czynność** potrzebną kilku funkcjom, a nie jest ani regułą (`Domain/`), ani odczytem (`Queries/`). Nie jest workiem na pomocników — „Helpers” i „Utils” nadal nie istnieją ([ADR 0002](../adr/0002-shared-folder-and-no-dependency-rules.md)).

- **`Shared/Ai/`** — `ILlmClient` i `IEmbeddingClient` z adapterami wybieranymi w DI po `Llm:Provider` / `Embeddings:Provider` (brak klucza albo nieznany dostawca = czytelny błąd przy starcie); prompty jako pliki `Shared/Ai/Prompts/*.md` osadzone w assembly, nie stringi w kodzie; potoki wołane przez kilka funkcji (`Matchmaker` — dopasowanie zgłoszeń i pomysłów, `GenomeGenerator`, `FitAssessor`). Do LLM trafia wyłącznie tekst po anonimizacji (typ reguły w `Domain/`); w logach czas i tokeny, nigdy treść. Dostawcy i adaptery: [TODO](../TODO.md).
- **`Shared/Jobs/`** — długie operacje (genomy, embeddingi raportów) w procesie: `BackgroundService` czyta zlecenia z `Channel`, stan i postęp zapisuje w tabeli zadań, którą czyta panel admina. Zadanie przerwane restartem dostaje `FAILED` i można je uruchomić ponownie — każde jest idempotentne. Bez Hangfire i zewnętrznych kolejek.

Namespace: `Castor.Api.Shared`.

## `Infrastructure/` — mechanika żądania

Filtr zamieniający `DomainException` na odpowiedź, `ApiRoutePrefixConvention` (prefiks `/api`), polityki rate limitingu, cookie logowania, `CurrentUser`, zegar, hub SignalR i start aplikacji (`Startup/DatabaseStartup`: migracje, zadania przerwane restartem, import seedu). Nie trafiają tu encje ani przypadki użycia.

**Praca przy starcie** idzie do `IHostedService`, nie do `Program.cs` za `Build()`: generator OpenAPI przy buildzie (`GetDocument.Insider`) i `dotnet-ef` (`ef`) wykonują `Program.cs`, a nie mają bazy — `Program.cs` nie rejestruje dla nich `DatabaseStartup`.

**SignalR:** `LiveHub` pod `/hubs/live`. Połączenie zalogowanego dołącza do grupy `user:{id}`, administratora także do `admins`; anonim łączy się, żeby śledzić jedno zgłoszenie po kodzie (`report:{trackingCode}`), a ekspert dochodzi do `experts:{obszar}` razem z obszarami. Handler wysyła zdarzenie przez `IHubContext<LiveHub>` po `SaveChanges` — powiadomienie o zapisie, który się nie udał, byłoby fałszywe.

## Namespace

- **Wspólny dla katalogu w korzeniu:** `Castor.Api.Domain`, `Castor.Api.Persistence`, `Castor.Api.Queries`, `Castor.Api.Shared`, `Castor.Api.Infrastructure`. Podfoldery organizują pliki, nie tworzą namespace'ów (typ o nazwie folderu dawałby `CS0118`). `Domain`, `Persistence` i `Infrastructure` są w `GlobalUsings.cs`; `Queries` i `Shared` dopisujesz razem z pierwszym użyciem w funkcji (`global using` pustego namespace'u się nie kompiluje).
- **W `Features/` namespace odpowiada folderowi** (`Castor.Api.Features.Bookings`) — folder grupuje jeden zasób.

## Zależności między katalogami

**Każdy katalog może używać każdego** — decyzja zespołu z 2026-10-03 ([ADR 0002](../adr/0002-shared-folder-and-no-dependency-rules.md)). Nie ma tabeli zakazów ani testu architektury. To, gdzie leży kod, wynika z ról katalogów opisanych wyżej i pilnuje tego przegląd kodu, nie kompilator.

## Konwencje — skrót

| Rzecz | Zasada |
|---|---|
| Klucze | `Guid` z `Guid.CreateVersion7()`, ustawiany w fabryce encji |
| Kwoty | `decimal`, precyzja z globalnej konwencji |
| Enumy | `UPPER_SNAKE_CASE`, w bazie tekst nazwy; w żądaniu `string` parsowany przez `NamedEnum` |
| Daty biznesowe | `DateOnly` → `date`, bez stref |
| Znaczniki techniczne | `DateTimeOffset` → `timestamptz`, UTC, z `IClock` |
| Nazwy w bazie | domyślne EF Core |
| Migracje | `chop dotnet dotnet-ef migrations add <Nazwa>` — znacznik czasu dodaje EF; zmergowanej się nie edytuje |
| JSON | `camelCase` (domyślny ASP.NET Core), enumy jako tekst |
