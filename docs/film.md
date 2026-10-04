# Film o Castorze

Film prezentujący projekt, maksymalnie 3 minuty ([REQUIREMENTS.md](REQUIREMENTS.md) §4). Juror ma kilka minut. W tym czasie ma zrozumieć, po co jest Castor, i chcieć otworzyć demo.

## Pomysł: jedno zgłoszenie, trzy osoby

Nie robimy wycieczki po funkcjach. Pokazujemy jedną historię, która przechodzi przez całą platformę:

- **Mieszkanka** opisuje problem.
- **Urzędniczka z gminy** sprawdza, czy rozwiązanie zadziała u niej.
- **ROPS** widzi to na radarze potrzeb regionu.
- Na końcu pętla się zamyka: pomysł, nabór, testerzy.

Dzięki temu juror widzi w działaniu dopasowywanie problemów do rozwiązań (obowiązkowe, 10% oceny) i kolejne moduły (+5% za każdy), zamiast słyszeć o nich z listy.

**Forma:** nagranie ekranu, krótkie napisy i głos. Nikt nie występuje przed kamerą. Głos jest syntetyczny. Prawdziwego lektora można podłożyć w każdej chwili, bez ponownego nagrywania obrazu. Napisy pomagają też w ocenie dostępności (WCAG).

## Scenariusz

Lektor mówi około 330 słów, co z pauzami daje 3 minuty.

| Czas | Ekran | Lektor |
|---|---|---|
| **0:00–0:20** Hak | Pusta strona główna, kursor miga w polu „Opisz, co nie działa” | „Anna mieszka w Krakowie. Jej mama ma 82 lata i mieszka sama pod Gorlicami. Autobus jeździ dwa razy dziennie, do przychodni jest kilka kilometrów. Anna boi się, że jak coś stanie się w nocy, nikt się nie dowie. Gdzie z tym pójść? Do gminy? Do MOPS-u? Do internetu?” |
| **0:20–0:50** Opisz problem | Anna klika mikrofon i mówi problem. Pojawiają się 2–3 pytania doprecyzowujące | „W Castorze wystarczy powiedzieć, co nie działa. Bez konta i bez formularzy, nawet głosem. Castor dopyta o dwie, trzy rzeczy i po chwili…” |
| **0:50–1:20** Dopasowanie | Lista innowacji z Biblioteki ROPS z wyjaśnieniem, dlaczego pasują. Na końcu kod zgłoszenia | „…pokazuje sprawdzone rozwiązania z Biblioteki Innowacji ROPS: prawie 200 pomysłów, które już zadziałały w Małopolsce. Mówi też wprost, dlaczego pasują. Anna dostaje kod, którym sprawdzi, co dzieje się z jej zgłoszeniem.” |
| **1:20–1:35** Nie / tak / prawie | Pod podobnym zgłoszeniem (inna osoba o samotnej mamie) Anna klika „To moja sprawa”: pojawia się „Dołączono do sprawy” ze statusem. Pod pierwszą innowacją klika „To mi pomogło” | „Ktoś zgłosił już podobną sprawę? Anna dołącza do niej jednym kliknięciem, zamiast zakładać kolejną, i widzi jej status. Pod każdym rozwiązaniem mówi też, czy jej pomaga.” |
| **1:35–1:55** Gmina | Zalogowana urzędniczka z Bobowej otwiera innowację, potem kartę dopasowania. Gmina podświetla się na mapie, obok tabela „wymaganie a stan gminy” i lista „bez zmian / dostosować / brakuje”. Jedno pytanie do asystenta | „Urzędniczka z Bobowej nie musi wierzyć na słowo. Castor zestawia wymagania innowacji z danymi statystycznymi jej gminy. Mówi, co zostaje bez zmian, co trzeba dostosować, czego brakuje i kto mógłby to prowadzić. O resztę zapyta asystenta.” |
| **1:55–2:25** ROPS | Panel admina: skrzynka zgłoszeń ze sprawą, do której dołączyła Anna, na górze („dołączyło: 1 osoba”), potem Radar: mapa zgłoszeń, trend i białe plamy | „A Regionalny Ośrodek Polityki Społecznej? Widzi zgłoszenia na bieżąco, a sprawy, do których dołączyło więcej osób, są na samej górze. Ma też radar potrzeb regionu: gdzie problemów przybywa i, co najważniejsze, gdzie są białe plamy. To problemy, na które w Bibliotece nie ma jeszcze rozwiązania.” |
| **2:25–2:45** Pętla | Szybki montaż: nowy pomysł w Szkółce („Czy to już istnieje?”), wniosek do otwartego naboru, Poletko z testerami, wątek z ekspertem | „Tu koło się zamyka. Białą plamę może wypełnić pomysł mieszkańca albo organizacji. Castor sprawdzi, czy podobny już istnieje, pomoże napisać wniosek do naboru, znajdzie testerów i eksperta.” |
| **2:45–3:00** Zamknięcie | Logo, link do demo, loginy do kont demo | „Castor. Od problemu do rozwiązania, które już działa, w kilka minut, a nie miesięcy. Sprawdźcie sami.” |

Na mapie gminy w karcie dopasowania zostawiamy około 3 sekund ciszy. To ma być moment „wow”.

### Napisy

Pełny tekst lektora jest za długi do czytania, kiedy widz patrzy na ekran. Napisy to krótka wersja, około 150 słów, czyli 1–2 linijki na raz przez około 4–5 sekund. Trzymają się czasów scen, więc pasują i do głosu syntetycznego, i do lektora nagranego później.

| Czas | Napisy, po kolei |
|---|---|
| **0:00–0:20** | Mama Anny ma 82 lata. / Mieszka sama na wsi pod Gorlicami. / Autobus dwa razy dziennie. Do przychodni kilka kilometrów. / Gdzie z tym pójść? |
| **0:20–0:50** | Opisz problem własnymi słowami. / Bez konta. Bez formularzy. Nawet głosem. / Castor dopyta o 2–3 rzeczy. |
| **0:50–1:20** | Sprawdzone rozwiązania z Biblioteki Innowacji ROPS. / Prawie 200 innowacji, które działają w Małopolsce. / Z wyjaśnieniem, dlaczego pasują. / Kod zgłoszenia, żeby śledzić, co się dzieje. |
| **1:20–1:35** | Ktoś zgłosił już podobną sprawę? / Dołącz jednym kliknięciem, zamiast zakładać kolejną. / Pod każdym wynikiem: to nie to, pomogło albo prawie. |
| **1:35–1:55** | Gmina sprawdza na swoich danych, czy to zadziała. / Co zostaje bez zmian. Co dostosować. Czego brakuje. / Asystent AI odpowie na resztę pytań. |
| **1:55–2:25** | ROPS widzi zgłoszenia na bieżąco. / Sprawy, do których dołączyło więcej osób, są na górze. / Radar potrzeb regionu. / Białe plamy: problemy bez gotowego rozwiązania. |
| **2:25–2:45** | Pomysł mieszkańca może wypełnić białą plamę. / Castor sprawdzi, czy podobny już istnieje. / Pomoże napisać wniosek do naboru. / Znajdzie testerów i eksperta. |
| **2:45–3:00** | Castor / Od problemu do rozwiązania. W minuty, nie miesiące. / link do demo |

Sam obraz musi mówić więcej niż przy lektorze:
- zbliżenia i podświetlenia na tym, o czym jest napis;
- wolniejsze tempo;
- cicha muzyka w tle, żeby film nie był niemy.

### Ekrany i konta

Konta pochodzą z treści demo ([data/seed/demo_content.json](../data/seed/demo_content.json)). Do filmu loguje się lokalnie hasłem `castor-demo` (albo `FILM_PASSWORD`). Hasło do kont na produkcji to `Seed__DemoPassword` z `.env` na serwerze i nie trafia do repozytorium.

| Scena | Adres | Konto |
|---|---|---|
| Opisz problem, dopasowanie | `/`, potem `/opisz-problem` | bez logowania |
| Gmina | `/innowacje/:id`, sekcja karty dopasowania | `gmina.demo@example.com` (Bobowa) |
| ROPS | `/admin/zgloszenia`, `/admin/radar` | `rops.demo@example.com` |
| Pętla | `/pomysly`, `/testy`, `/watki/:id` | `fundacja.demo@example.com`, `mieszkanka.demo@example.com`, `ekspert.demo@example.com` |

## Jak powstaje

Film nagrywa się sam, bez ręcznego klikania. Wszystko jest w [tools/film](../tools/film/README.md):

1. **Obraz:** Playwright przeklikuje sceny w przeglądarce na lokalnej kopii aplikacji z treściami demo.
2. **Głos:** syntetyczny polski głos neuronowy (Marek) czyta tekst lektora.
3. **Montaż:** ffmpeg przycina i przyspiesza sceny pod długość głosu, nakłada napisy, dodaje planszę końcową i robi plik `.srt`.

Nagrywamy lokalnie z LLM-placeholderem. Film ma pokazać, jak aplikacja wygląda i działa, a nie jakość odpowiedzi modelu, więc sztuczne teksty AI nam nie przeszkadzają. Dzięki temu nagranie nie zależy od produkcji ani od klucza OpenAI.

Po zmianie wyglądu, tekstu albo głosu wystarczy uruchomić narzędzia jeszcze raz. W README jest opisane, jak:
- nagrać ponownie;
- zmienić tekst lub głos;
- podłożyć własnego lektora;
- dodać scenę.

Muzykę dokładamy na końcu, w Clipchampie.
