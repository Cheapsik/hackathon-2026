# AGENTS.md — frontend (Castor)

Zasady dla agenta AI pracującego w `frontend/`. **Uzupełniają [`../AGENTS.md`](../AGENTS.md)** — w szczególności każda komenda przez `chop`.

Przed pierwszą linijką przeczytaj:

1. [`../docs/architecture/04-frontend.md`](../docs/architecture/04-frontend.md) — stack, układ kodu, klient API, dostępność w szkielecie, komendy.
2. [`../docs/SPEC.md`](../docs/SPEC.md) §7 (moduł, nad którym pracujesz) i §8 (zasady UI, WCAG 2.1 AA — 20% oceny).
3. [`../GLOSSARY.md`](../GLOSSARY.md) — nazwy pojęć; w kodzie po angielsku, w UI zwykłymi polskimi słowami.

Najważniejsze:

- Teksty UI tylko po polsku, na sztywno (bez i18n), przyciski opisują akcję.
- Dane z API wyłącznie przez wygenerowanego klienta (`src/api/generated`, `chop npm run generate:api`) i TanStack Query — bez ręcznego `fetch`.
- Każda strona: jedno `h1`, `usePageTitle`, stany ładowania i błędu ogłaszane przez `aria-live`; każda mapa i wykres z tabelą tych samych danych.
- Testów nie piszemy (SPEC §1). Przed oddaniem: `chop npm run build` i `chop npm run lint` bez błędów, sprawdzenie axe/Lighthouse.
- Wygląd: źródłem prawdy jest [`design/DESIGN.md`](design/DESIGN.md) („Civic Product / Tactile Utility": interfejs produktu, zielone neutrale, Satoshi, bez gradientów, szkła i dekoracji) i referencje z `design/fintech-ui-kit/references/`. Jeśli decyzja wizualna nie wynika z referencji ani z funkcji, nie dodawaj jej. Ekran składasz z `@/design-system`; własnych kolorów, rozmiarów i promieni poza tokenami nie wprowadzasz. Brakujący element dodajesz najpierw do systemu i do podglądu `/design-system`.
- Nowy ekran jest gotowy po screenshotach Playwright (390 × 844, 1440 × 900, 375 × 667, 200% zoom, wysoki kontrast z A++, reduced motion) porównanych z referencjami: główna akcja w pierwszym viewporcie, brak poziomego scrolla.
