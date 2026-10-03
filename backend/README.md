# Castor — backend

REST API for the Castor platform of the Małopolska Social Innovation Hub (.NET 10, ASP.NET Core controllers, EF Core, PostgreSQL 17 + pgvector, SignalR).

## Run locally

The database comes from the compose file in the repository root; the API runs from `backend/` (the team runs every command through [`chop`](https://getchop.run/)):

```bash
chop docker compose up -d --wait db                              # from the repository root: PostgreSQL 17 + pgvector on 127.0.0.1:5432
chop dotnet dotnet-ef database update --project src/Castor.Api   # apply migrations
chop dotnet run --project src/Castor.Api                         # API on http://localhost:5256
```

The whole demo (database, API, frontend behind nginx) starts from the repository root with `chop docker compose up -d --build --wait` on http://localhost:8080.

API reference (Development only): http://localhost:5256/scalar/v1 · OpenAPI document: `/openapi/v1.json`. Every `dotnet build` also writes it to `openapi/Castor.Api.json`, which is committed — the frontend generates its client from it.

Every route is under `/api`. Endpoints so far:

- account: `POST /api/auth/register`, `POST /api/auth/sign-in`, `POST /api/auth/sign-out`, `GET /api/auth/session` (cookie session `Castor.Auth`);
- problem reports (module I): `POST /api/problem-reports`, `GET /api/problem-reports/{id}`, `POST /api/problem-reports/{id}/answers`, `GET /api/problem-reports/track/{code}`, `POST /api/problem-reports/claim`, `GET /api/problem-reports/mine` — without an account, `/{id}` needs the `X-Tracking-Code` header;
- `GET /api/municipalities?search=`;
- innovations and fit assessments (module VII): `GET /api/innovations/{id}`, `POST /api/innovations/{id}/fit` (signed in; 201 new, 200 stored), `GET /api/innovations/{id}/fit?teryt=`, `GET /api/innovations/{id}/fit/{fitId}`, `GET`/`POST /api/innovations/{id}/fit/{fitId}/assistant` (signed in);
- the SignalR hub `/hubs/live` (`ProblemReportCreated` to the `admins` group).

In `Development` the API imports `../../data/seed` at start-up and generates innovation genomes in the background with the `placeholder` language model — no API key needed.

Configuration: the connection string is `ConnectionStrings:Castor` (environment variable `ConnectionStrings__Castor`); the other keys are listed in [`../docs/architecture/03-skeleton.md`](../docs/architecture/03-skeleton.md) and [`../.env.example`](../.env.example).

Rules for working on this code: [`AGENTS.md`](AGENTS.md) and [`../docs/architecture/`](../docs/architecture/).
