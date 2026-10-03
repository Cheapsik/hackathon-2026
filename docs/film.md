# Film o Castorze

Film prezentujący projekt, maksymalnie 3 minuty ([REQUIREMENTS.md](REQUIREMENTS.md) §4). Juror ma kilka minut. W tym czasie ma zrozumieć, po co jest Castor, i chcieć otworzyć demo.

## Pomysł: jedno zgłoszenie, trzy osoby

Nie robimy wycieczki po funkcjach. Pokazujemy jedną historię, która przechodzi przez całą platformę:

- **Mieszkanka** opisuje problem.
- **Urzędniczka z gminy** sprawdza, czy rozwiązanie zadziała u niej.
- **ROPS** widzi to na radarze potrzeb regionu.
- Na końcu pętla się zamyka: pomysł, nabór, testerzy.

Dzięki temu juror widzi w działaniu dopasowywanie problemów do rozwiązań (obowiązkowe, 10% oceny) i kolejne moduły (+5% za każdy), zamiast słyszeć o nich z listy.

**Forma:** nagranie ekranu, krótkie napisy i głos. Nikt nie występuje przed kamerą. Film ma się sam bronić na każdym etapie. Najpierw powstaje z napisami i głosem syntetycznym, a jeśli zdążymy, podmieniamy głos na prawdziwego lektora. Napisy pomagają też w ocenie dostępności (WCAG).

## Scenariusz

Lektor mówi około 330 słów, co z pauzami daje 3 minuty.

| Czas | Ekran | Lektor |
|---|---|---|
| **0:00–0:20** Hak | Pusta strona główna, kursor miga w polu „Opisz, co nie działa” | „Anna mieszka w Krakowie. Jej mama ma 82 lata i mieszka sama pod Gorlicami. Autobus jeździ dwa razy dziennie, do przychodni jest kilka kilometrów. Anna boi się, że jak coś stanie się w nocy, nikt się nie dowie. Gdzie z tym pójść? Do gminy? Do MOPS-u? Do internetu?” |
| **0:20–0:50** Opisz problem | Anna klika mikrofon i mówi problem. Pojawiają się 2–3 pytania doprecyzowujące | „W Castorze wystarczy powiedzieć, co nie działa. Bez konta i bez formularzy, nawet głosem. Castor dopyta o dwie, trzy rzeczy i po chwili…” |
| **0:50–1:20** Dopasowanie | Lista innowacji z Biblioteki ROPS z wyjaśnieniem, dlaczego pasują. Na końcu kod zgłoszenia | „…pokazuje sprawdzone rozwiązania z Biblioteki Innowacji ROPS: prawie 200 pomysłów, które już zadziałały w Małopolsce. Mówi też wprost, dlaczego pasują. Anna dostaje kod, którym sprawdzi, co dzieje się z jej zgłoszeniem.” |
| **1:20–1:55** Gmina | Zalogowana urzędniczka z Bobowej otwiera innowację, potem kartę dopasowania. Gmina podświetla się na mapie, obok tabela „wymaganie a stan gminy” i lista „bez zmian / dostosować / brakuje”. Jedno pytanie do asystenta | „Urzędniczka z Bobowej nie musi wierzyć na słowo. Castor zestawia wymagania innowacji z danymi statystycznymi jej gminy. Mówi, co zostaje bez zmian, co trzeba dostosować, czego brakuje i kto mógłby to prowadzić. O resztę dopyta asystenta AI.” |
| **1:55–2:25** ROPS | Panel admina: skrzynka zgłoszeń, potem Radar: mapa zgłoszeń, trend i białe plamy | „ROPS widzi zgłoszenia na bieżąco i ma radar potrzeb regionu: gdzie problemów przybywa i, co najważniejsze, gdzie są białe plamy. To problemy, na które w Bibliotece nie ma jeszcze rozwiązania.” |
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
| **1:20–1:55** | Gmina sprawdza na swoich danych, czy to zadziała. / Co zostaje bez zmian. Co dostosować. Czego brakuje. / Asystent AI odpowie na resztę pytań. |
| **1:55–2:25** | ROPS widzi zgłoszenia na bieżąco. / Radar potrzeb regionu. / Białe plamy: problemy bez gotowego rozwiązania. |
| **2:25–2:45** | Pomysł mieszkańca może wypełnić białą plamę. / Castor sprawdzi, czy podobny już istnieje. / Pomoże napisać wniosek do naboru. / Znajdzie testerów i eksperta. |
| **2:45–3:00** | Castor / Od problemu do rozwiązania. W minuty, nie miesiące. / link do demo |

Sam obraz musi mówić więcej niż przy lektorze:
- zbliżenia i podświetlenia na tym, o czym jest napis;
- wolniejsze tempo;
- cicha muzyka w tle, żeby film nie był niemy.

### Ekrany i konta

Konta pochodzą z treści demo ([data/seed/demo_content.json](../data/seed/demo_content.json)). Hasło to `Seed__DemoPassword` z `.env` na serwerze; nie wpisujemy go do repozytorium.

| Scena | Adres | Konto |
|---|---|---|
| Opisz problem, dopasowanie | `/`, potem `/opisz-problem` | bez logowania |
| Gmina | `/innowacje/:id`, sekcja karty dopasowania | `gmina.demo@example.com` (Bobowa) |
| ROPS | `/admin/zgloszenia`, `/admin/radar` | `rops.demo@example.com` |
| Pętla | `/pomysly/nowy`, `/wnioski/:id`, `/testy`, `/watki/:id` | `fundacja.demo@example.com`, `ekspert.demo@example.com` |

## Jak nagrać

**Montaż (darmowy Clipchamp, wbudowany w Windows).** Robimy go w trzech krokach. Po każdym mamy film, który można wysłać.

1. **Obraz i napisy.**
   - Nagrywamy każdą scenę osobno (sposób poniżej).
   - Układamy sceny według czasów ze scenariusza, z 1–2 sekundami zapasu na scenę na późniejszy głos.
   - Wycinamy czekanie na LLM i dodajemy zbliżenia na liczby i na „dlaczego pasuje”.
   - Wstawiamy napisy z tabeli wyżej i cichą muzykę.
2. **Głos syntetyczny.**
   - W Clipchamp funkcja zamiany tekstu na mowę ma darmowe polskie głosy. Wklejamy do niej tekst lektora, scena po scenie, każdą scenę jako osobny klip.
   - Muzykę ściszamy pod głosem.
   - Jeśli głos nie mieści się w scenie, skracamy jego tekst, a nie obraz.
3. **Prawdziwy lektor, jeśli zdążymy.**
   - Jedna osoba nagrywa scena po scenie, oglądając gotowy film, żeby trafić w czasy. Nagrywa telefonem w cichym, małym pomieszczeniu; szafa z ubraniami tłumi pogłos lepiej niż pokój.
   - Podmieniamy tylko ścieżkę głosu. Obraz i napisy zostają.
   - Jeśli zdanie się nie mieści, przesuwamy cięcie o sekundę albo dwie.

Na koniec eksportujemy MP4 w 1080p i sprawdzamy, czy film trwa najwyżej 3:00.

**Obraz: automatycznie w Playwright, bez ręcznego klikania.**

- Skrypty przechodzą każdą scenę same:
  - rozdzielczość 1920×1080, powiększenie przeglądarki 125–150%, żeby tekst był czytelny na filmie;
  - spokojne tempo i tekst pisany znak po znaku;
  - bez paska zakładek i rozszerzeń.
- Po każdej zmianie wyglądu wystarczy uruchomić je jeszcze raz.
- Dyktowania głosem nie da się zautomatyzować. W scenie 2 tekst wpisuje się jak pisany ręcznie, a przycisk mikrofonu pokazujemy jako zbliżenie.

## Co musi być gotowe przed nagraniem

1. **Wygląd karty dopasowania (Łukasz).** [FitAssessmentCard.tsx](../frontend/src/features/fit-assessments/FitAssessmentCard.tsx) to dziś gołe nagłówki i tabela bez stylów z design systemu. To kluczowa scena filmu, więc ma pierwszeństwo przed resztą wyglądu.
2. **Treści demo w środowisku, które nagrywamy.**
   - Produkcja potrzebuje seedu (Mariusz).
   - Lokalnie wystarczy `Seed__DemoContent=true`, ale wtedy film nie pokazuje produkcji.
3. **Sprawdzone dopasowanie.** Tekst ze sceny 2 puszczamy wcześniej przez prawdziwy LLM i sprawdzamy, czy wraca coś trafnego, np. teleopieka albo kody QR dla seniorów. Jeśli nie, zmieniamy tekst.
4. **Genomy innowacji wygenerowane, zanim ktokolwiek otworzy zgłoszenia demo.** Zgłoszenie otwarte przed wygenerowaniem genomów zostaje bez dopasowań na stałe.

## Do zrobienia

- [ ] Zatwierdzić scenariusz, tekst lektora i napisy.
- [ ] Ustalić, czy nagrywamy produkcję, czy wersję lokalną.
- [ ] Ostylować kartę dopasowania.
- [ ] Napisać skrypty Playwright dla scen 2–6.
- [ ] Przygotować plik napisów `.srt` z krótkiej wersji napisów.
- [ ] Krok 1 montażu: obraz i napisy.
- [ ] Krok 2 montażu: głos syntetyczny.
- [ ] Krok 3 montażu (opcjonalnie): nagrać lektora i podmienić głos.
- [ ] Wyeksportować MP4.
