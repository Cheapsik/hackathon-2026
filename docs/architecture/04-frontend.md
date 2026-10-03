# Frontend

Wymagania produktu dla UI (dostępność WCAG 2.1 AA, język, etykiety, mobile first) są w [`../SPEC.md`](../SPEC.md) §8. Ten dokument mówi, jak jest zbudowany kod w `frontend/`.

## Stack

| Warstwa | Wybór |
|---|---|
| Build | **Vite** + **React 19** + **TypeScript** (szablon `create-vite` `react-ts`) |
| UI | **shadcn/ui** (styl `new-york`, Radix pod spodem) + **Tailwind CSS 4** (`@tailwindcss/vite`) |
| Routing | **React Router** (`createBrowserRouter`) |
| Dane z API | **TanStack Query** + klient wygenerowany przez **orval** z `backend/openapi/Castor.Api.json` |
| Formularze | zwykłe kontrolowane formularze HTML z walidacją przeglądarki (`required`, `minLength`) — decyzja dla modułu I (SPEC D-26); React Hook Form + Zod dopiero, gdy formularz tego wymaga |
| Lint | **oxlint** z wtyczkami `react`, `typescript`, `oxc`, **`jsx-a11y`** |
| Testy | brak (SPEC §1) |
| Obraz | `node:22-alpine` (build) → `nginx:1.30-alpine`; nginx serwuje SPA i proxuje `/api` i `/hubs` do backendu |

## Układ kodu

```
frontend/
├── src/
│   ├── main.tsx                punkt wejścia: QueryClientProvider + RouterProvider
│   ├── index.css               Tailwind, tokeny kolorów shadcn (dostrojone pod AA), wysoki kontrast, rozmiar tekstu
│   ├── app/                    router.tsx (wszystkie trasy), query-client.ts
│   ├── api/
│   │   ├── castor-fetch.ts     fetch, przez który idzie każde wywołanie klienta; błąd → ApiError
│   │   └── generated/          klient orval — generowany, poza gitem
│   ├── components/
│   │   ├── ui/                 komponenty shadcn (dodawane CLI)
│   │   └── layout/             AppLayout, DisplayControls — wspólne dla wszystkich stron
│   ├── features/<moduł>/       strony i komponenty jednego modułu (np. problem-reports/, innovations/)
│   ├── hooks/                  hooki wspólne (usePageTitle)
│   └── lib/                    utils.ts (cn), display-preferences.ts
├── orval.config.ts, components.json, vite.config.ts, .oxlintrc.json
├── Dockerfile, nginx.conf
```

- **Folder w `features/` odpowiada modułowi albo zasobowi API**, nazwa po angielsku jak w [`../../GLOSSARY.md`](../../GLOSSARY.md), w `kebab-case` (`problem-reports/`, `fit-assessments/`). Kod potrzebny kilku modułom przenosisz do `components/`, `hooks/` albo `lib/`.
- **Trasy w jednym miejscu:** `src/app/router.tsx`. Ścieżki w URL po polsku, zwykłymi słowami (`/opisz-problem`, `/biblioteka`), bo to też jest tekst dla użytkownika.
- **Stan z serwera trzyma TanStack Query** przez wygenerowane hooki (`usePostApiAuthSignIn` itd.); nie kopiujesz go do `useState`. Stan lokalny to tylko interakcja (otwarty dialog, wpisywany tekst).

## Klient API

- `chop npm run generate:api` (orval) generuje `src/api/generated/castor.ts`. Uruchamia się sam przed `dev` i `build` (`predev`, `prebuild`). Parametry z nagłówka (`X-Tracking-Code`) są argumentem `headers` wygenerowanych funkcji (`headers: true` w `orval.config.ts`).
- Źródło to **commitowany** `backend/openapi/Castor.Api.json` — po zmianie API backend robi `dotnet build` i commituje dokument, a frontend tylko regeneruje klienta.
- Każde wywołanie idzie przez `castorFetch`: ten sam origin (cookie sesji jedzie samo), odpowiedź jako `{ data, status, headers }`, a kod spoza 2xx rzuca `ApiError` z komunikatem `{ "error": "..." }` z backendu. `QueryClient` nie ponawia odmów 4xx.

## Dostępność — co daje szkielet

- `AppLayout`: landmarki `header` / `nav` / `main` / `footer`, link „Przejdź do treści” (pierwszy element w kolejności Tab), po zmianie trasy focus przechodzi na `main`.
- `DisplayControls`: **A / A+ / A++** (atrybut `data-text-size` na `<html>`, cały layout w `rem`) i **Wysoki kontrast** (`data-contrast="high"`) — z `aria-pressed`, zapamiętane w `localStorage` (przy blokadzie storage działają do końca wizyty), nakładane przed pierwszym renderem.
- Tokeny kolorów: tekst pomocniczy, obramowania pól i obwódka focusu spełniają 4.5:1 / 3:1; globalny `:focus-visible` dla każdego elementu.
- `usePageTitle` — każda strona ustawia tytuł karty („… · Castor”); każda strona ma dokładnie jedno `h1`.
- `useSession` / `useRefreshSession` (`src/hooks/use-session.ts`) — kto jest zalogowany (`GET /api/auth/session`) i odświeżenie po logowaniu i wylogowaniu; `AccountLinks` w nagłówku.
- `errorMessage` (`src/lib/error-message.ts`) — polskie zdanie dla nieudanego żądania po kodzie HTTP (API odmawia po angielsku).
- `oxlint` z `jsx-a11y` wyłapuje braki w znacznikach; przed oddaniem modułu sprawdzasz go też axe/Lighthouse (SPEC §8).

## shadcn/ui

Komponenty dodajesz CLI: `chop npx shadcn@latest add <komponent>`. **Po dodaniu sprawdź importy** — CLI potrafi wpisać `import { cn } from "cn"` zamiast `"@/lib/utils"` i dopisać do `package.json` obcy pakiet `cn`; popraw import i usuń pakiet (`chop npm uninstall cn`).

## Komendy

Z katalogu `frontend/`:

```bash
chop npm install
chop npm run dev        # http://localhost:5173; proxy /api i /hubs → CASTOR_BACKEND_URL (domyślnie http://localhost:5256)
chop npm run build      # tsc + vite build
chop npm run lint       # oxlint
```
