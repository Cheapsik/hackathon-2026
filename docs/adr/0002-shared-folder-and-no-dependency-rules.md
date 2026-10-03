# Katalog `Shared/` i brak reguł zależności między katalogami

Ten sam potok AI (klasyfikacja zgłoszenia → kandydaci → ranking → krzyżówka) potrzebny jest kilku funkcjom: zgłoszeniom, pomysłom, a generowanie genomu jest potrzebne też importowi seedu i panelowi admina. Poprzednie reguły (foldery funkcji nie współdzielą kodu, `Domain/` bez infrastruktury, `Queries/` bez `Infrastructure/`) nie zostawiały na niego miejsca. Zespół zdecydował 2026-10-03, że:

- usługi wykonujące czynność używaną przez kilka funkcji (warstwa AI, zadania w tle) leżą w nowym katalogu głównym `Shared/` (namespace `Castor.Api.Shared`);
- **katalogi nie mają zakazów zależności** — każdy może używać każdego. Katalogi porządkują kod według roli, nie są granicami; test architektury (NetArchTest) usunięto razem z projektem testów.

Konsekwencja: o tym, gdzie leży kod, decyduje opis ról katalogów w `docs/architecture/01-structure-conventions.md`, a nie kompilator ani test — pilnuje tego przegląd kodu.
