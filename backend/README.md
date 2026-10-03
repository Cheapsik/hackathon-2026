# Castor — backend

REST API for the HubMI platform (.NET 10, ASP.NET Core controllers, EF Core, PostgreSQL 17).

## Run locally

From `backend/` (the team runs every command through [`chop`](https://getchop.run/)):

```bash
chop docker compose up -d --wait                                 # PostgreSQL 17 on localhost:5432
chop dotnet dotnet-ef database update --project src/Castor.Api   # apply migrations
chop dotnet run --project src/Castor.Api                         # API on http://localhost:5256
chop dotnet test                                                 # needs Docker (Testcontainers)
```

API reference (Development only): http://localhost:5256/scalar/v1 · OpenAPI document: `/openapi/v1.json`.

Endpoints so far: `POST /auth/register`, `POST /auth/sign-in`, `POST /auth/sign-out` (cookie session `Castor.Auth`).

Configuration: the connection string is `ConnectionStrings:Castor` (environment variable `ConnectionStrings__Castor`).

Rules for working on this code: [`AGENTS.md`](AGENTS.md) and [`../docs/architecture/`](../docs/architecture/).
