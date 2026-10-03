# Szkielet

Szkielet **już istnieje** w `backend/`, `frontend/` i w korzeniu repo — ten dokument mówi, co w nim jest i gdzie tego szukać. Nowy wycinek nie zmienia szkieletu; dokłada pliki według [`02-code-patterns.md`](02-code-patterns.md) i [`04-frontend.md`](04-frontend.md). Zmiana czegoś z poniższej listy to decyzja zespołu, opisywana tutaj.

## Korzeń repo

| Plik | Po co |
|---|---|
| `docker-compose.yml` | całe demo: `db` (`pgvector/pgvector:pg17`, port 5432 tylko na `127.0.0.1`), `backend` (migruje bazę przy starcie, klucze cookie na wolumenie), `frontend` (nginx na porcie 8080, proxy `/api` i `/hubs`) |
| `.env.example` | wszystkie zmienne konfiguracji bez wartości; kopia jako `.env` (poza gitem) |
| `.dockerignore` | kontekst budowania obrazu frontendu (korzeń repo) |
| `GLOSSARY.md` | słownik pojęć — nazwy encji i enumów |

## Projekty i pliki w `backend/`

| Plik | Po co |
|---|---|
| `Castor.slnx` | rozwiązanie: `src/Castor.Api` |
| `global.json` | SDK .NET 10.0.x (`rollForward: latestFeature`) |
| `dotnet-tools.json` | lokalne `dotnet-ef` 10.0.11 — wołane jako `chop dotnet dotnet-ef` |
| `Directory.Build.props` | `EnforceCodeStyleInBuild` + StyleCop (tylko SA1402, SA1649) |
| `.editorconfig` | reguły stylu jako błędy builda; `Migrations/` jako kod generowany |
| `Dockerfile`, `.dockerignore` | obraz API (`sdk:10.0` → `aspnet:10.0`, port 8080, użytkownik `app`) |
| `openapi/Castor.Api.json` | dokument OpenAPI zapisywany przy każdym `dotnet build`; commitowany, wejście generatora klienta frontendu |
| `.gitignore` | z `dotnet new gitignore` |

Pakiety API: `Microsoft.AspNetCore.OpenApi`, `Microsoft.Extensions.ApiDescription.Server` (dokument przy buildzie), `Microsoft.EntityFrameworkCore` (+ `.Design`, `.Relational`), `Npgsql.EntityFrameworkCore.PostgreSQL`, `Pgvector.EntityFrameworkCore`, `Scalar.AspNetCore`. Wersje są w `.csproj`.

Konfiguracja (zmienne środowiskowe w konwencji `Sekcja__Klucz`):

| Klucz | Znaczenie |
|---|---|
| `ConnectionStrings:Castor` | połączenie z bazą; domyślnie `localhost:5432`, baza/użytkownik/hasło `castor` |
| `Database:MigrateOnStartup` | `true` — API wykonuje migracje przy starcie (w kontenerze); lokalnie domyślnie `false` |
| `DataProtection:KeysPath` | katalog kluczy podpisujących cookie; bez niego klucze żyją w pamięci i restart wylogowuje wszystkich |
| `Llm:*`, `Embeddings:*`, `Seed:*` | zarezerwowane dla adapterów AI i importu seedu — patrz [`../SPEC.md`](../SPEC.md) §3 |

## Co jest w `src/Castor.Api/`

| Miejsce | Zawartość |
|---|---|
| `Domain/` | `DomainException` (kod HTTP, domyślnie 400), `NamedEnum.TryParse` (enum tylko po nazwie), `Identity/User` (e-mail znormalizowany, hash hasła, rola), `Identity/UserRole`, `Identity/PasswordPolicy` (min. 8 znaków) |
| `Persistence/` | `CastorDbContext` (jedyny kontekst; rozszerzenia `vector`, `unaccent`, `pg_trgm`), `ModelConventions` (decimal `NUMERIC(19,4)`, `DateOnly` → `date`, `DateTimeOffset` → `timestamptz`, klucze `Guid` bez generowania, enumy jako tekst), `PostgresErrors.IsUniqueViolation`, `Identity/UserConfiguration` (unikalny e-mail) |
| `Shared/Ai/` | `ILlmClient`, `LlmPrompt`, `IEmbeddingClient` — same kontrakty; adaptery czekają na wybór dostawców ([`../TODO.md`](../TODO.md)) |
| `Infrastructure/` | `IClock`/`SystemClock`, `CurrentUser` (id użytkownika z cookie), `SignInCookie` (id, e-mail, rola), `DomainExceptionFilter` (`{ "error": "..." }` z kodem z wyjątku), `Http/ApiRoutePrefixConvention` (prefiks `/api`), `Realtime/LiveHub` (`/hubs/live`, grupy `user:{id}` i `admins`) |
| `Features/` | `Register`, `SignIn`, `SignOut` — `POST /api/auth/register` (201 + cookie, 409 dla zajętego e-maila), `POST /api/auth/sign-in` (200 + cookie, 401 jednakowe dla złego hasła i nieznanego e-maila), `POST /api/auth/sign-out` (204) |
| `Migrations/` | `Initial` — tabela `Users` z unikalnym indeksem na `Email`; `UserRoleAndSearchExtensions` — kolumna `Role` (istniejące konta dostają `RESIDENT`) i rozszerzenia `vector`, `unaccent`, `pg_trgm` |
| `Program.cs` | kontrolery z prefiksem `/api`, globalnym `AuthorizeFilter` i `DomainExceptionFilter`, enumy w JSON jako tekst, cookie `Castor.Auth` (`HttpOnly`, `SameSite=Lax`, 401/403 zamiast przekierowań), opcjonalnie trwałe klucze cookie, SignalR, Npgsql z pgvector, opcjonalna migracja przy starcie, jawna rejestracja handlerów, OpenAPI + Scalar tylko w `Development` |

`Queries/` jeszcze nie istnieje — powstaje z pierwszym `…Query`, razem z linią `global using Castor.Api.Queries;` w `GlobalUsings.cs`.

Workspace'ów i globalnego filtra izolacji **nie ma** — dane platformy są wspólne ([`00-stack.md`](00-stack.md) · Dostęp do danych).

## Co jest w `frontend/`

Opis struktury i zasad: [`04-frontend.md`](04-frontend.md). W skrócie: Vite + React + TS, Tailwind 4 + shadcn/ui (`Button`), React Router, TanStack Query, klient z orval, układ strony z landmarkami, linkiem „Przejdź do treści” i przełącznikami rozmiaru tekstu i wysokiego kontrastu, `Dockerfile` + `nginx.conf`.

## Uruchomienie

**Całe demo** (z korzenia repo) — `http://localhost:8080`:

```bash
chop docker compose up -d --build --wait
```

**Praca nad backendem** — baza z compose, API lokalnie (z katalogu `backend/`):

```bash
chop docker compose up -d --wait db                                # z korzenia repo
chop dotnet dotnet-ef database update --project src/Castor.Api
chop dotnet run --project src/Castor.Api                          # Scalar: http://localhost:5256/scalar/v1
```

**Praca nad frontendem** (z katalogu `frontend/`, przy działającym API na `localhost:5256`):

```bash
chop npm install
chop npm run dev        # http://localhost:5173 — proxy /api i /hubs do API
```

**Port 5432 zajęty:** `docker compose up` kończy się „port is already allocated”, gdy na 5432 działa inny PostgreSQL — lokalna usługa Windows albo kontener `castor-postgres` z dawnego `backend/docker-compose.yml`. Zatrzymaj go (`chop docker stop castor-postgres`). Ten stary kontener ma obraz `postgres:17` bez pgvector, więc migracja z rozszerzeniem `vector` się na nim nie wykona.

**Budowanie obrazów za firmowym proxy:** jeśli `docker compose build` kończy się `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (npm) albo `NU1301 … PartialChain` (NuGet), sieć przechwytuje TLS własnym certyfikatem, którego kontenery nie znają. Nie wyłączaj weryfikacji certyfikatów — dodaj firmowy certyfikat główny do budowania obrazów albo zbuduj je poza tą siecią.
