# Szkielet

Szkielet **już istnieje** w `backend/` — ten dokument mówi, co w nim jest i gdzie tego szukać. Nowy wycinek nie zmienia szkieletu; dokłada pliki według [`02-code-patterns.md`](02-code-patterns.md). Zmiana czegoś z poniższej listy to decyzja zespołu, opisywana tutaj.

## Projekty i pliki w `backend/`

| Plik | Po co |
|---|---|
| `Castor.slnx` | rozwiązanie: `src/Castor.Api` + `tests/Castor.Tests` |
| `global.json` | SDK .NET 10.0.x (`rollForward: latestFeature`) |
| `dotnet-tools.json` | lokalne `dotnet-ef` 10.0.11 — wołane jako `chop dotnet dotnet-ef` |
| `Directory.Build.props` | `EnforceCodeStyleInBuild` + StyleCop (tylko SA1402, SA1649) |
| `.editorconfig` | reguły stylu jako błędy builda; `Migrations/` jako kod generowany |
| `docker-compose.yml` | PostgreSQL 17 (`castor-postgres`, baza/użytkownik/hasło `castor`, port 5432) |
| `.gitignore` | z `dotnet new gitignore` |

Pakiety API: `Microsoft.AspNetCore.OpenApi`, `Microsoft.EntityFrameworkCore` (+ `.Design`, `.Relational`), `Npgsql.EntityFrameworkCore.PostgreSQL`, `Scalar.AspNetCore`. Testy: xUnit, `Microsoft.AspNetCore.Mvc.Testing`, `Testcontainers.PostgreSql`, `NetArchTest.Rules`. Wersje są w plikach `.csproj`.

Connection string: `ConnectionStrings:Castor` w `appsettings.json`, w środowisku jako zmienna `ConnectionStrings__Castor`.

## Co jest w `src/Castor.Api/`

| Miejsce | Zawartość |
|---|---|
| `Domain/` | `DomainException` (kod HTTP, domyślnie 400), `NamedEnum.TryParse` (enum tylko po nazwie), `Identity/User` (e-mail znormalizowany, hash hasła), `Identity/PasswordPolicy` (min. 8 znaków) |
| `Persistence/` | `CastorDbContext` (jedyny kontekst), `ModelConventions` (decimal `NUMERIC(19,4)`, `DateOnly` → `date`, `DateTimeOffset` → `timestamptz`, klucze `Guid` bez generowania, enumy jako tekst), `PostgresErrors.IsUniqueViolation`, `Identity/UserConfiguration` (unikalny e-mail) |
| `Infrastructure/` | `IClock`/`SystemClock`, `CurrentUser` (id użytkownika z cookie), `SignInCookie`, `DomainExceptionFilter` (`{ "error": "..." }` z kodem z wyjątku) |
| `Features/` | `Register`, `SignIn`, `SignOut` — `POST /auth/register` (201 + cookie, 409 dla zajętego e-maila), `POST /auth/sign-in` (200 + cookie, 401 jednakowe dla złego hasła i nieznanego e-maila), `POST /auth/sign-out` (204) |
| `Migrations/` | `Initial` — tabela `Users` z unikalnym indeksem na `Email` |
| `Program.cs` | kontrolery z globalnym `AuthorizeFilter` i `DomainExceptionFilter`, enumy w JSON jako tekst, cookie `Castor.Auth` (`HttpOnly`, `SameSite=Lax`, 401/403 zamiast przekierowań), jawna rejestracja handlerów, OpenAPI + Scalar tylko w `Development` |

`Queries/` jeszcze nie istnieje — powstaje z pierwszym `…Query`, razem z linią `global using Castor.Api.Queries;` w `GlobalUsings.cs` (API i testy).

Workspace'ów i globalnego filtra izolacji **nie ma** — dane platformy są wspólne ([`00-stack.md`](00-stack.md) · Dostęp do danych). Ról jeszcze nie ma — dochodzą z pierwszą funkcją, która ich wymaga.

## Co jest w `tests/Castor.Tests/`

| Miejsce | Zawartość |
|---|---|
| `Persistence/PostgresFixture` | jeden kontener `postgres:17` na przebieg; `CreateMigratedDatabaseAsync()` daje każdemu testowi własną, zmigrowaną bazę |
| `Persistence/PostgresCollection` | kolekcja xUnit `postgres` dla testów na bazie |
| `Persistence/TestDbContexts` | `CastorDbContext` dla testu; `ProductionModel()` buduje model bez serwera |
| `Features/ApiFactory`, `Features/TestApi` | `WebApplicationFactory<Program>` na bazie testu; `SignedInAsync(postgres, email)` daje zalogowanego klienta z własną bazą; `TestApi.Cookies` — opcje klienta z obsługą cookie |
| `Architecture/DependencyRulesTests` | granice z [`01-structure-conventions.md`](01-structure-conventions.md) sprawdzane na IL |
| `Features/Register`, `SignIn`, `SignOut` | testy API konta i sesji |

## Uruchomienie

Z katalogu `backend/`:

```bash
chop docker compose up -d --wait
chop dotnet dotnet-ef database update --project src/Castor.Api
chop dotnet run --project src/Castor.Api     # Scalar: http://localhost:5256/scalar/v1
chop dotnet test
```

**Port 5432 zajęty:** `docker compose up` kończy się „port is already allocated”, gdy na 5432 działa inny PostgreSQL (lokalna usługa Windows albo kontener innego projektu). Zatrzymaj go; jeśli kontener `castor-postgres` powstał przy nieudanej próbie bez przypiętego portu, odtwórz go: `chop docker compose up -d --force-recreate --wait`.

**Docker i Testcontainers:** jeśli `dotnet test` kończy się błędem „client version 1.44 is too new”, lokalny Docker Engine jest starszy niż wymaga Testcontainers — zaktualizuj Docker Desktop albo ustaw zmienną środowiskową `DOCKER_API_VERSION=1.43` dla testów.
