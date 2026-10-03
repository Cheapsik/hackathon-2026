# Założenia

Luki w [`SPEC.md`](SPEC.md), które agent zamknął rozsądnym założeniem, żeby nie blokować pracy. Każde jest do weryfikacji przez zespół. Zaakceptowane przenosimy do `SPEC.md` jako regułę i zmieniamy status; odrzucone poprawiamy w kodzie.

Status: ⬜ do weryfikacji · ✅ przyjęte (przeniesione do `SPEC.md`) · ✏️ odrzucone, kod poprawiony

| # | Założenie | Dlaczego | Gdzie w kodzie | Status |
|---|---|---|---|---|
| A-1 | Lista gmin pochodzi z API BDL GUS: jednostki rodzaju 1–3 istniejące w najnowszym roku BDL. Wychodzi 183 gminy | Obserwator podaje gminy bez TERYT; BDL jest oficjalnym rejestrem z kodem w identyfikatorze | `data/scrapers/municipalities.py` | ⬜ |
| A-2 | Innowacje z Biblioteki ROPS mają etap `TESTED` | Biblioteka publikuje rozwiązania przetestowane; karta nie podaje etapu | `Innovation.ImportFromLibrary` | ⬜ |
| A-3 | Z sekcji „Autorzy” zostaje linia z nazwą instytucji (fundacja, stowarzyszenie, gmina, uczelnia…); każda inna jest traktowana jak imię i nazwisko i pomijana, a imię z nazwiskiem w linii instytucji jest wycinane | Brief pkt 9 — bez danych osobowych; lepiej zgubić nazwę organizacji niż zostawić osobę | `data/scrapers/innovations.py` | ⬜ |
| A-4 | Klasyfikacja (obszary, słowa kluczowe) liczy się raz, z samego opisu; odpowiedzi na pytania trafiają tylko do rankingu | Jedna runda pytań (D-23) i jedno wywołanie klasyfikacji na zgłoszenie | `CreateProblemReportHandler`, `ProblemReport.DescribeForMatching` | ⬜ |
| A-5 | Zdarzenie `ProblemReportCreated` niesie id, kanał, gminę i czas — wysyłane przed klasyfikacją, żeby zgłoszenie trafiło do skrzynki od razu | SPEC §7 I: „od razu trafia do skrzynki admina” | `ProblemReportCreatedEvent` | ⬜ |
| A-6 | Krzyżówka powstaje, gdy ranking nic nie zwrócił albo najlepszy wynik jest poniżej progu; ranking może zwrócić mniej niż 3 wyniki | „Lepiej mniej niż niepasujące” | `Matchmaker` | ⬜ |
| A-7 | Kolizja dwóch losowych kodów śledzenia (32⁸ możliwości) nie jest ponawiana — indeks unikalny odrzuca ją jako 500 | Prawdopodobieństwo pomijalne w skali demo | `CreateProblemReportHandler` | ⬜ |
| A-8 | `GET /api/auth/session` mówi frontendowi, kto jest zalogowany (`signedIn: false` dla gościa) | Bez tego frontend po odświeżeniu nie wie o sesji; cookie jest `HttpOnly` | `Features/Session/` | ⬜ |
| A-9 | API odmawia po angielsku (`backend/AGENTS.md`), a UI jest po polsku (SPEC §8): frontend zamienia odmowy na polskie zdania po kodzie HTTP | Dwie reguły mówią różne rzeczy o języku komunikatów — do rozstrzygnięcia przez zespół | `frontend/src/lib/error-message.ts` | ⬜ |
| A-10 | Wiek persony „Ania i Staś” to wiek pierwszej osoby (7) | Persona to rodzeństwo; pole ma jedną liczbę | `data/scrapers/challenges.py` | ⬜ |
