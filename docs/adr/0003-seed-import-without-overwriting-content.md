# Import seedu przy starcie, bez nadpisywania treści

Dane z `data/seed/` (115 innowacji, raporty, obszary, persony, dziesiątki tysięcy wartości wskaźników) są za duże na seed w migracji, więc importuje je przy starcie backendu importer w `Persistence/Seeding/`, gdy `Seed__OnStartup=true`. Import jest idempotentny, ale nie jest zwykłym upsertem (decyzja zespołu z 2026-10-03):

- **treści** — innowacje, raporty z badań, obszary wyzwań, persony — importer tylko **dopisuje brakujące** po kluczu źródłowym (np. slug karty ROPS) i nigdy ich nie nadpisuje, bo administrator poprawia je w panelu, a restart nie może cofnąć jego zmian;
- **statystyki** — gminy, wskaźniki, wartości wskaźników — dostają **pełny upsert**, bo nikt ich nie edytuje, a nowy seed niesie nowsze dane.

Genomy innowacji nie powstają w imporcie: dla innowacji bez genomu import zleca zadanie w tle.
