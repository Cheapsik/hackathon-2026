# Castor

Platforma Małopolskiego Hubu Innowacji Społecznych (ROPS Kraków). Łączy zgłoszone potrzeby mieszkańców, organizacji i gmin ze sprawdzonymi innowacjami społecznymi oraz wspiera ich rozwój, testowanie i upowszechnianie w województwie.

Krótki opis produktu: [`docs/opis-aplikacji.md`](docs/opis-aplikacji.md).

## Stack

| Warstwa | Technologia |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Backend | .NET 10, ASP.NET Core, EF Core |
| Baza | PostgreSQL 17 + pgvector |
| Demo lokalne | Docker Compose (`db` + `backend` + `frontend` za nginx) |

## Wymagania

Do uruchomienia całego demo wystarczy:

- [Docker Engine](https://docs.docker.com/engine/install/) z Docker Compose v2

Do pracy deweloperskiej dodatkowo:

- [.NET SDK 10](https://dotnet.microsoft.com/download) (wersja z `backend/global.json`)
- [Node.js 22+](https://nodejs.org/) (frontend)

## Szybki start (demo)

Z korzenia repozytorium:

```bash
docker compose up -d --build --wait
```

Aplikacja: [http://localhost:8080](http://localhost:8080)

Compose stawia bazę, API (migracje + import seedu) oraz frontend za nginx z proxy `/api` i `/hubs`.

Zatrzymanie:

```bash
docker compose down
```

### Konta demo

Po starcie compose dostępne są konta z `data/seed/demo_content.json`. Hasło domyślne: `castor-demo` (zmienna `DEMO_PASSWORD`).

| E-mail | Rola |
| --- | --- |
| `rops.demo@example.com` | administrator (ROPS) |
| `ekspert.demo@example.com` | ekspert |
| `gmina.demo@example.com` | pracownik gminy |
| `mieszkanka.demo@example.com` | mieszkaniec / tester |
| `fundacja.demo@example.com` | mieszkaniec |
| `student.demo@example.com` | mieszkaniec / tester |

### Konfiguracja (opcjonalnie)

```bash
cp .env.example .env
```

Dla lokalnego demo plik `.env` nie jest wymagany — compose ma sensowne wartości domyślne (`POSTGRES_PASSWORD=castor`, `DEMO_PASSWORD=castor-demo`, LLM w trybie `placeholder`). Opis zmiennych: [`.env.example`](.env.example).

## Rozwój lokalny

### Backend

Z korzenia — tylko baza:

```bash
docker compose up -d --wait db
```

Z katalogu `backend/`:

```bash
dotnet tool restore
dotnet dotnet-ef database update --project src/Castor.Api
dotnet run --project src/Castor.Api
```

- API: [http://localhost:5256](http://localhost:5256)
- Scalar (Development): [http://localhost:5256/scalar/v1](http://localhost:5256/scalar/v1)
- OpenAPI: `/openapi/v1.json` oraz commitowany `backend/openapi/Castor.Api.json`

Szczegóły API: [`backend/README.md`](backend/README.md).

### Frontend

Przy działającym API na `localhost:5256`, z katalogu `frontend/`:

```bash
npm install
npm run dev
```

UI: [http://localhost:5173](http://localhost:5173) — Vite proxuje `/api` i `/hubs` do backendu (`CASTOR_BACKEND_URL`, domyślnie `http://localhost:5256`).

## Przydatne linki

| Dokument | Treść |
| --- | --- |
| [`docs/opis-aplikacji.md`](docs/opis-aplikacji.md) | Do czego jest Castor |
| [`docs/SPEC.md`](docs/SPEC.md) | Zakres i reguły MVP |
| [`docs/architecture/`](docs/architecture/) | Stack, konwencje, uruchomienie szkieletu |
| [`docs/deployment.md`](docs/deployment.md) | Wdrożenie produkcyjne (GitHub Actions → SSH) |
| [`docs/RELEASE.md`](docs/RELEASE.md) | Notatki do wersji konkursowej |
| [`GLOSSARY.md`](GLOSSARY.md) | Słownik pojęć |

## Uwagi

- Port **5432** musi być wolny na `127.0.0.1`. Jeśli compose zgłasza „port is already allocated”, zatrzymaj lokalny PostgreSQL albo stary kontener zajmujący ten port.
- Bez klucza LLM aplikacja działa z `Llm__Provider=placeholder` (deterministyczne odpowiedzi demo). Prawdziwy model: ustaw w `.env` `Llm__Provider=openai` oraz `Llm__ApiKey` / `Llm__Model`.
