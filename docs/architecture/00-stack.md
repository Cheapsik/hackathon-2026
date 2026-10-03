# Stack techniczny

Decyzje obowiązujące. Nie są propozycją i nie wymagają potwierdzenia przed użyciem.

| Warstwa | Wybór |
|---|---|
| Baza danych | **PostgreSQL 17 + pgvector** (obraz `pgvector/pgvector:pg17`); rozszerzenia `vector`, `unaccent`, `pg_trgm` włącza migracja |
| Backend | **.NET 10**, C#, `Nullable` i `ImplicitUsings` włączone; SDK przypięty do 10.0.x w `backend/global.json` |
| ORM i migracje | **EF Core** + `Npgsql.EntityFrameworkCore.PostgreSQL` + `Pgvector.EntityFrameworkCore`; narzędzie `dotnet-ef` lokalnie w `backend/dotnet-tools.json` |
| API | **REST — kontrolery**, nie Minimal API; wszystkie trasy pod prefiksem **`/api`** |
| Czas rzeczywisty | **SignalR**, hub `/hubs/live` |
| Testy | **Brak** — decyzja zespołu na hackathon (SPEC §1) |
| Środowisko lokalne | **Docker Compose** w korzeniu repo — do pracy nad backendem sama usługa `db` |
| Dokumentacja API | **OpenAPI** (`Microsoft.AspNetCore.OpenApi`) + UI **Scalar**, wyłącznie w `Development`; dokument generowany też przy buildzie do `backend/openapi/` (`Microsoft.Extensions.ApiDescription.Server`) |
| Frontend | Vite + React + TypeScript — [`04-frontend.md`](04-frontend.md) |
| Styl kodu | `.editorconfig` + `EnforceCodeStyleInBuild` + StyleCop (tylko SA1402, SA1649) — błędy stylu wychodzą w `dotnet build` |

Bez MediatR, AutoMappera, Swashbuckle, repozytoriów generycznych i ASP.NET Core Identity jako frameworka.

## Klucze główne

**`Guid` we wszystkich encjach**, generowany przez **`Guid.CreateVersion7()`**, nie `Guid.NewGuid()`.

- Klucz jest znany **przed** zapisem, więc encja i jej dzieci powstają razem w jednym `SaveChanges` bez zapisów pośrednich.
- UUID v7 ma znacznik czasu w części wiodącej — kolejne klucze są rosnące i nie rozrzucają wstawek po indeksie.
- Klucz ustawia domena w metodzie fabrycznej encji. W modelu EF wszystkie klucze `Guid` mają globalnie `ValueGenerated.Never` — ani EF, ani baza nie generują identyfikatora za aplikacją.

## Liczby

| Rodzaj wartości | Typ w C# | Typ w bazie |
|---|---|---|
| Liczba całkowita (sztuki, pojemność, kolejność) | `int` / `long` | `integer` / `bigint` |
| Kwota pieniężna | `decimal` | `NUMERIC(19,4)` — globalna konwencja |
| Wartość o innej skali (kurs, procent, ilość ułamkowa) | **własny typ wartości** zarejestrowany w konwencji | `NUMERIC(19,8)` |

`float`, `double` i `real` nie występują w wartościach biznesowych w żadnej postaci.

> **Precyzję ustawia globalna konwencja, nie atrybut na encji.** EF Core bez jawnej konfiguracji potrafi zmapować `decimal` na węższą kolumnę i **po cichu obciąć wartość**. Konwencja rozróżnia skalę **po typie CLR**, nie po nazwie pola: goły `decimal` to kwota, inna skala wymaga własnego typu.

**Zaokrąglanie:** mnożenie w pełnej precyzji, zaokrąglenie **raz, na końcu**, trybem `MidpointRounding.AwayFromZero`. Wartość podana przez użytkownika z nadmiarem miejsc jest błędem wejścia — odrzucamy ją, nie zaokrąglamy po cichu. Sumy pokazywane użytkownikowi liczymy z tych samych zaokrąglonych wartości, które widzi w wierszach.

## Enumy w bazie

**Enum zapisujemy jako tekst nazwy wariantu** (`ACTIVE`, `ARCHIVED`), nigdy jako liczbę porządkową. Ustawia to globalna konwencja — nowy enum jest objęty automatycznie.

- bazę czyta człowiek — `'ARCHIVED'` jest samoopisujące, `2` nie jest;
- `CHECK`-i i indeksy częściowe pisze się przeciw tym wartościom;
- przestawienie kolejności wariantów przy ordinalach to cicha zmiana znaczenia danych.

**Konsekwencja:** nazwy wariantów są kontraktem bazy. Przemianowanie wariantu wymaga migracji.

Warianty enumów piszemy `UPPER_SNAKE_CASE` — tak samo w C#, w bazie i w JSON. Żądanie przenosi enum jako `string`, a handler parsuje go przez `NamedEnum.TryParse`, który odrzuca liczby (`"1"`).

## Daty i czas

| Rodzaj | Typ w C# | Typ w bazie |
|---|---|---|
| Data biznesowa (dzień, termin naboru) | `DateOnly` | `date` — **bez konwersji stref** |
| Godzina biznesowa | `TimeOnly` | `time` |
| Znacznik techniczny (`CreatedAt`, `UpdatedAt`) | `DateTimeOffset` | `timestamptz`, w UTC |

Bieżący czas daje `IClock` (`Infrastructure/`), nie `DateTimeOffset.UtcNow` — jedno miejsce, które zna bieżący czas.

## Nazewnictwo w bazie

**Obowiązują domyślne konwencje EF Core.** Nazwy tabel i kolumn wynikają z nazw typów i właściwości w C#. Nie konfigurujemy `snake_case` ani własnego schematu nazw.

Nazwy constraintów i indeksów, które mają znaczenie biznesowe, nadajemy jawnie (`IX_Bookings_OnePerRoomAndSlot`, `CK_Rooms_Capacity_Positive`), żeby było widać, którą regułę łamie zapis.

## Dostęp do danych

**Dane platformy są wspólne.** Nie ma podziału na workspace'y ani globalnego filtra izolacji: problemy, pomysły i innowacje są widoczne w całym regionie, a dopasowanie z definicji przeszukuje zgłoszenia wszystkich użytkowników. Decyzja zespołu z 2026-10-03, podjęta przed pierwszą encją.

- Ograniczenie widoczności, które wynika z produktu (np. trendy tylko dla administratora, wątek tylko dla jego uczestników), sprawdza **handler** tej czynności — jawnie, w kodzie.
- Konflikt równoczesnych zapisów rozstrzyga baza: unikalność i `CHECK`, a naruszenie unikalności z wyścigu handler zamienia na 409.

## Uwierzytelnianie

**Minimalne.** Rejestracja, logowanie, wylogowanie, hasło wyłącznie jako bezpieczny hash.

| Element | Wybór |
|---|---|
| Hashowanie hasła | `PasswordHasher<T>` z `Microsoft.AspNetCore.Identity` — **sama klasa**, jako narzędzie |
| Sesja | cookie (`AddAuthentication().AddCookie()`), `HttpOnly`, `SameSite=Lax` |
| Odpowiedź bez sesji | `401` / `403`, nie przekierowanie na stronę logowania |
| Endpointy | `POST /api/auth/register`, `POST /api/auth/sign-in`, `POST /api/auth/sign-out` |
| Domyślnie | globalny `AuthorizeFilter` — każdy kontroler wymaga zalogowania, wyjątki mają `[AllowAnonymous]` |

Cookie niesie `NameIdentifier` (id użytkownika), e-mail i rolę (`ClaimTypes.Role`). Handler bierze id użytkownika z `CurrentUser`. Dlaczego cookie, a nie JWT: [ADR 0001](../adr/0001-cookie-session-instead-of-jwt.md).

**Role:** każdy użytkownik ma dokładnie jedną — kolumna `User.Role` z enumem `UserRole` (`RESIDENT`, `MUNICIPAL_OFFICER`, `EXPERT`, `ADMIN`). Rejestracja daje `RESIDENT`, pozostałe nadaje administrator. Endpoint dostępny dla jednej roli ma `[Authorize(Roles = nameof(UserRole.ADMIN))]`; zawężenie zależne od danych (np. ekspert tylko ze swoich obszarów) sprawdza handler. Rola jedzie w cookie, więc jej zmiana działa od następnego logowania. Gmina pracownika JST i obszary eksperta dochodzą razem z encjami `Municipality` i `ChallengeArea`.

**Nie instalujemy ASP.NET Core Identity jako frameworka** ani JWT. Reset hasła, potwierdzenie e-mail, 2FA i usunięcie konta są poza zakresem, nawet jeśli framework daje je gotowe.

## Dokumentacja API

Dokument OpenAPI pod `/openapi/v1.json`, UI Scalar pod `/scalar/v1`. Oba mapowane **tylko gdy `app.Environment.IsDevelopment()`**, z jawnym `AllowAnonymous()`.

**`dotnet build` zapisuje ten sam dokument do `backend/openapi/Castor.Api.json`** — plik jest commitowany, a frontend generuje z niego klienta (orval) bez działającego backendu. Po zmianie endpointu commitujesz go razem z kodem. Kody odpowiedzi inne niż 200 deklarujesz `[ProducesResponseType]` (201 przy `Created`, 204 przy `NoContent`), bo inaczej dokument i wygenerowany klient kłamią.

## Prefiks `/api`

`ApiRoutePrefixConvention` (`Infrastructure/Http/`) dokleja `api` do trasy każdego kontrolera. Kontroler deklaruje tylko zasób: `[Route("bookings")]` daje `/api/bookings`. Ścieżka w przeglądarce, w nginx, w proxy Vite i w dokumencie OpenAPI jest ta sama; nagłówek `Location` piszesz z prefiksem (`Created($"/api/bookings/{booking.Id}", booking)`).

## Błędy HTTP

| Sytuacja | Wyjątek | Odpowiedź |
|---|---|---|
| Żądanie łamie regułę produktu | `DomainException` (domyślnie 400) | `{ "error": "..." }` z kodem z wyjątku |
| Zasób nie istnieje albo użytkownik nie ma prawa go zobaczyć | `DomainException(..., 404)` | 404 — nie zdradzamy, że niedostępny wiersz istnieje |
| Konflikt z istniejącym stanem / naruszenie unikalności | `DomainException(..., 409)` | 409 |
| Błąd programisty (pusty identyfikator, brak transakcji) | `InvalidOperationException` | 500 |

Tłumaczenie robi `DomainExceptionFilter` w `Infrastructure/`. Komunikaty błędów po angielsku, zdaniem, które powie użytkownikowi, co poprawić.
