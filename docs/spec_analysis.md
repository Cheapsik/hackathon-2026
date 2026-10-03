# HubMI.pl — analiza specyfikacji

## 1. Kontekst wyzwania

HubMI.pl ma być regionalnym ekosystemem innowacji społecznych dla Małopolski, integrującym działania związane z projektowaniem, testowaniem, akceleracją i wdrażaniem nowych rozwiązań społecznych.

Główny problem opisany w materiale nie polega na braku wiedzy, lecz na jej rozproszeniu: istnieją raporty, diagnozy, bazy danych, publikacje, ustawy, strony internetowe i eksperci, ale źródła te nie są ze sobą połączone w sposób pozwalający szybko przejść od problemu społecznego do możliwego rozwiązania.

Platforma ma wspierać:

- automatyzację procesów,
- dopasowywanie potrzeb do rozwiązań,
- budowanie współpracy między mieszkańcami, samorządami i organizacjami.

## 2. Cele produktu

Cele biznesowe i społeczne wynikające ze specyfikacji:

1. Ułatwienie dostępu do nowoczesnych i skutecznych usług społecznych.
2. Personalizacja i lepsze dopasowanie wsparcia do potrzeb mieszkańców.
3. Umożliwienie współtworzenia rozwiązań społecznych.
4. Rozwój aktywności i kompetencji społecznych użytkowników.
5. Poprawa jakości życia oraz dostępności usług społecznych.
6. Integracja wiedzy, danych i istniejących innowacji społecznych w jednym miejscu.
7. Skrócenie ścieżki od zgłoszenia problemu lub pomysłu do odpowiedzi, rekomendacji, testu lub wdrożenia.

## 3. Grupy użytkowników

Platforma powinna obsługiwać co najmniej następujące grupy:

- mieszkańcy,
- organizacje pozarządowe,
- Jednostki Samorządu Terytorialnego,
- pracownicy Regionalnego Ośrodka Polityki Społecznej w Krakowie,
- eksperci branżowi.

Wymagania UX muszą uwzględniać użytkowników w różnym wieku, o różnym poziomie kompetencji cyfrowych i bez przygotowania technicznego.

## 4. Zakres funkcjonalny platformy

Specyfikacja wskazuje 7 komponentów platformy:

1. Matchmaking społeczny — funkcjonalność obligatoryjna.
2. Zasobnik wiedzy.
3. Kreator pomysłów.
4. Tester innowacji.
5. Middleman innowacji.
6. Platforma aktywnej komunikacji.
7. Panel administratora.

### 4.1. Matchmaking społeczny — MUST HAVE

Najważniejszy i obowiązkowy komponent MVP.

#### Wymagania funkcjonalne

System powinien:

- przyjmować opis problemu lub potrzeby społecznej,
- analizować treść zgłoszenia,
- dopasowywać zgłoszoną potrzebę do istniejących innowacji społecznych,
- przedstawiać użytkownikowi rekomendowane rozwiązania,
- wyjaśniać, dlaczego dane rozwiązanie zostało dopasowane,
- umożliwiać dalsze przejście do szczegółów innowacji lub kolejnych działań.

#### Wymagania jakościowe

Dopasowanie powinno być oceniane przede wszystkim pod kątem trafności na podstawie słów kluczowych zawartych w opisie potrzeby użytkownika.

#### Sugerowany przepływ MVP

1. Użytkownik wybiera opcję „Mam problem / potrzebę”.
2. Wpisuje opis w języku naturalnym.
3. System identyfikuje istotne pojęcia, tematykę i kontekst.
4. System przeszukuje katalog innowacji.
5. System zwraca listę najlepiej dopasowanych rozwiązań.
6. Każda rekomendacja zawiera krótkie uzasadnienie dopasowania.
7. Użytkownik może otworzyć szczegóły lub przejść do kontaktu / dalszej ścieżki.

### 4.2. Zasobnik wiedzy

System powinien:

- udostępniać zasoby i wiedzę ROPS Kraków w sprofilowany sposób,
- gromadzić dane o zgłaszanych potrzebach,
- analizować trendy.

#### Możliwe typy treści

Na podstawie materiału źródłowego zasobnik może agregować m.in.:

- raporty,
- diagnozy,
- publikacje,
- materiały urzędowe,
- ustawy i dokumenty prawne,
- strony WWW,
- dane i wiedzę ekspercką,
- materiały ROPS Kraków.

#### Oczekiwane zachowanie

Treści powinny być prezentowane w sposób dopasowany do profilu lub problemu użytkownika, a nie wyłącznie jako surowe repozytorium dokumentów.

### 4.3. Kreator pomysłów

System powinien:

- umożliwiać zgłaszanie nowych pomysłów na innowacje,
- prowadzić użytkownika przez proces tworzenia innowacji,
- prezentować dobre praktyki,
- wspierać tworzenie wniosku w trakcie naborów.

#### Potencjalny proces

1. Zdefiniowanie problemu.
2. Określenie grupy docelowej.
3. Opis proponowanego rozwiązania.
4. Wskazanie oczekiwanego wpływu.
5. Dobór dobrych praktyk lub podobnych istniejących rozwiązań.
6. Weryfikacja kompletności.
7. Generowanie formularza / wniosku.

### 4.4. Tester innowacji

System powinien:

- umożliwiać zgłoszenie chęci udziału w testach,
- pozwalać oceniać istniejące rozwiązania,
- umożliwiać przekazywanie informacji zwrotnej,
- umożliwiać proponowanie usprawnień.

#### Minimalny model danych

Dla testu innowacji warto przewidzieć:

- innowację,
- uczestnika testu,
- status zgłoszenia,
- ocenę,
- komentarz / feedback,
- propozycje usprawnień,
- datę zgłoszenia i aktualizacji.

### 4.5. Middleman innowacji

Komponent ma pełnić rolę towarzysza i doradcy w procesie dostosowania innowacji do potrzeb użytkownika.

System powinien:

- wspierać użytkownika w adaptacji innowacji,
- uwzględniać możliwości i zasoby użytkownika,
- pomagać rekonstruować / modyfikować rozwiązanie na potrzeby konkretnego kontekstu.

Może to być realizowane jako interaktywny kreator, asystent konwersacyjny lub sekwencja pytań i rekomendacji.

### 4.6. Platforma aktywnej komunikacji

Materiał nie definiuje szczegółowych funkcji tego modułu, ale kryteria oceny wskazują wymóg szybkiej komunikacji pomiędzy autorem zgłoszenia a administratorem.

Minimalnie należy przewidzieć:

- powiadomienie administratora o nowym pomyśle lub zgłoszeniu,
- możliwość odpowiedzi administratora,
- przekazanie odpowiedzi autorowi,
- historię komunikacji lub status obsługi zgłoszenia.

### 4.7. Panel administratora

Szczegółowe funkcje nie są opisane w źródle, ale z pozostałych wymagań wynika potrzeba obsługi co najmniej:

- zgłoszeń problemów i potrzeb,
- zgłoszeń nowych pomysłów,
- katalogu innowacji,
- materiałów wiedzy,
- komunikacji z użytkownikami,
- testów innowacji,
- danych analitycznych dotyczących zgłaszanych potrzeb.

## 5. Kluczowe scenariusze użytkownika

### SC-01: Znalezienie rozwiązania dla problemu społecznego

**Aktor:** mieszkaniec / NGO / JST

1. Użytkownik opisuje problem społeczny.
2. System interpretuje treść.
3. System wyszukuje istniejące innowacje.
4. System prezentuje rekomendacje.
5. System uzasadnia dopasowanie.
6. Użytkownik przechodzi do szczegółów wybranego rozwiązania.

### SC-02: Brak trafnego rozwiązania — utworzenie nowego pomysłu

1. Użytkownik nie znajduje odpowiedniej innowacji.
2. System proponuje przejście do Kreatora Pomysłów.
3. Użytkownik opisuje nowe rozwiązanie krok po kroku.
4. System przedstawia dobre praktyki.
5. Użytkownik zapisuje lub przesyła pomysł.
6. Administrator zostaje powiadomiony.

### SC-03: Testowanie innowacji

1. Użytkownik otwiera istniejącą innowację.
2. Zgłasza chęć udziału w testach.
3. Po udziale przekazuje ocenę i komentarz.
4. Informacja trafia do właściciela / administratora.

### SC-04: Adaptacja innowacji

1. Użytkownik wybiera innowację.
2. Uruchamia Middlemana.
3. System zbiera informacje o kontekście, zasobach i ograniczeniach.
4. System proponuje sposób dostosowania rozwiązania.

### SC-05: Obsługa zgłoszenia przez administratora

1. Administrator otrzymuje powiadomienie o nowym zgłoszeniu.
2. Otwiera jego szczegóły.
3. Analizuje zgłoszenie lub rekomendacje systemu.
4. Odpowiada autorowi.
5. Użytkownik otrzymuje odpowiedź i aktualizację statusu.

## 6. Minimalne wymagania dla MVP

### Obowiązkowe

- funkcjonalny prototyp,
- działający Matchmaking społeczny,
- minimum makiety UX/UI,
- responsywny i intuicyjny interfejs,
- rozwiązanie zaprojektowane z myślą o WCAG 2.1 AA,
- architektura umożliwiająca skalowanie i dalszą rozbudowę,
- gotowość do integracji z innymi systemami,
- uwzględnienie bezpieczeństwa danych.

### Silnie rekomendowane w MVP

Aby zwiększyć kompletność rozwiązania, warto zrealizować dodatkowo:

- podstawowy Zasobnik Wiedzy,
- prosty Kreator Pomysłów,
- panel administratora,
- mechanizm powiadomień,
- podstawowy moduł feedbacku / testowania.

Każdy dodatkowo zrealizowany moduł poza obligatoryjnym matchmakingiem jest dodatkowo punktowany.

## 7. Wymagania UX/UI

Projekt powinien zapewniać:

- prosty język,
- minimalną liczbę kroków,
- czytelną hierarchię informacji,
- obsługę osób o niskich kompetencjach cyfrowych,
- duże i jednoznaczne elementy interaktywne,
- brak konieczności rozumienia terminologii technicznej,
- wyjaśnianie rekomendacji i kolejnych kroków,
- projektowanie dostępne zgodnie z WCAG 2.1 AA.

Kryterium intuicyjności wprost sprawdza, czy osoba w różnym wieku i o różnym poziomie umiejętności cyfrowych potrafi bez przygotowania technicznego wypełnić moduły i odnaleźć informacje.

## 8. Wymagania dotyczące komunikacji

System powinien posiadać czytelną i szybką ścieżkę komunikacji:

- nowe zgłoszenie → powiadomienie administratora,
- administrator → odpowiedź,
- odpowiedź → powiadomienie użytkownika,
- status zgłoszenia widoczny dla użytkownika.

To wymaganie wynika bezpośrednio z kryterium „Szybkość komunikacji”.

## 9. Wymagania dotyczące dopasowania

Matchmaking powinien:

- analizować opis potrzeby użytkownika,
- identyfikować słowa kluczowe lub semantykę zgłoszenia,
- porównywać zgłoszenie z bazą istniejących innowacji,
- zwracać uporządkowane rekomendacje,
- generować uzasadnienie dopasowania.

Minimalne MVP może bazować na słowach kluczowych, ponieważ właśnie taki mechanizm jest wprost wskazany w kryteriach oceny. Architektura powinna jednak pozwalać później rozszerzyć dopasowanie o wyszukiwanie semantyczne, embeddingi lub model językowy.

## 10. Wymagania dotyczące danych

### Dane wejściowe

Źródła wskazane w materiale:

- Mapa Wyzwań Społecznych Małopolski,
- raporty,
- biblioteka innowacji społecznych,
- materiały ROPS Kraków,
- plansze Canvy Innowacji Społecznych,
- przykładowe dane do prezentacji MVP.

### Przykładowe encje domenowe

#### SocialNeed

- id
- title
- description
- keywords
- category
- location / area
- submitted_by
- created_at
- status

#### Innovation

- id
- name
- description
- target_groups
- problems_addressed
- keywords
- category
- source
- resources_required
- implementation_notes
- status

#### Match

- id
- need_id
- innovation_id
- score
- explanation
- created_at

#### Idea

- id
- author_id
- problem_description
- target_group
- proposed_solution
- expected_impact
- status
- created_at

#### TestParticipation

- id
- innovation_id
- user_id
- status
- rating
- feedback
- improvement_proposal

#### KnowledgeResource

- id
- title
- type
- description
- source_url
- tags
- target_groups

#### Message / Notification

- id
- sender_id
- recipient_id
- subject / related_entity
- body
- status
- created_at

## 11. Architektura — wymagania wynikające ze specyfikacji

Rozwiązanie powinno być:

- skalowalne,
- modułowe,
- możliwe do dalszej rozbudowy,
- przygotowane do integracji z innymi systemami,
- bezpieczne pod względem przetwarzania danych.

### Proponowany logiczny podział

- frontend webowy,
- API backendowe,
- warstwa uwierzytelniania / autoryzacji,
- katalog innowacji,
- repozytorium wiedzy,
- silnik matchmakingu,
- workflow pomysłów i testowania,
- komunikacja / powiadomienia,
- panel administracyjny,
- warstwa integracyjna,
- analityka potrzeb i trendów.

## 12. Bezpieczeństwo

Materiał nie definiuje konkretnych mechanizmów, ale wymaga uwzględnienia bezpieczeństwa danych.

Minimalny zakres projektowy powinien obejmować:

- kontrolę dostępu zależną od roli,
- rozdzielenie funkcji użytkownika i administratora,
- bezpieczne przechowywanie danych,
- walidację danych wejściowych,
- ochronę API,
- rejestrowanie istotnych zmian i operacji administracyjnych,
- przygotowanie do obsługi danych osobowych zgodnie z wymogami organizacji publicznej.

## 13. Dostępność

Docelowe narzędzie musi spełniać WCAG 2.1 na poziomie AA.

W praktyce prototyp powinien uwzględniać co najmniej:

- obsługę klawiaturą,
- prawidłowe etykiety formularzy,
- odpowiedni kontrast,
- semantyczną strukturę nagłówków,
- tekstowe komunikaty błędów,
- fokus elementów interaktywnych,
- brak informacji przekazywanych wyłącznie kolorem,
- responsywność,
- czytelny i prosty język.

## 14. Integracje

Specyfikacja wymaga przygotowania systemu do integracji z innymi systemami, ale nie wskazuje konkretnych API.

Dlatego architektura powinna zakładać:

- API-first,
- możliwość importu danych z zewnętrznych katalogów i raportów,
- możliwość synchronizacji biblioteki innowacji,
- możliwość podłączenia systemów powiadomień,
- łatwe dodawanie kolejnych źródeł wiedzy.

## 15. Analityka i trendy

Zasobnik Wiedzy ma gromadzić dane o zgłaszanych potrzebach i analizować trendy.

Minimalny panel analityczny może obejmować:

- liczbę zgłoszeń w czasie,
- kategorie problemów,
- najczęściej występujące słowa kluczowe,
- lokalizacje / obszary występowania potrzeb,
- najczęściej rekomendowane innowacje,
- liczbę zgłoszeń bez trafnego dopasowania,
- liczbę nowych pomysłów wynikających z braków w katalogu.

## 16. Kryteria oceny rozwiązania

### 16.1. Stopień spełnienia wyzwania — 40%

Ocena obejmuje:

- jakość działania kluczowych elementów,
- liczbę dostarczonych dodatkowych funkcjonalności.

Najwyższy priorytet należy więc nadać działającemu end-to-end flow matchmakingu, a następnie dodatkowym modułom.

### 16.2. Potencjał wdrożeniowy — 20%

Należy pokazać, że rozwiązanie nie jest wyłącznie makietą, lecz posiada realną ścieżkę wdrożenia.

W prezentacji warto pokazać:

- architekturę,
- model danych,
- możliwość podłączenia rzeczywistych źródeł,
- mechanizm rozszerzania katalogu,
- sposób wdrożenia,
- bezpieczeństwo,
- skalowanie.

### 16.3. Dostępność i intuicyjność prototypu — 20%

Szczególnie ważne są:

- prostota formularzy,
- brak zbędnych kroków,
- dostępność,
- czytelność rekomendacji,
- zrozumiały interfejs dla osób o niskich kompetencjach cyfrowych.

### 16.4. Kryteria premiujące — 20%

- atrakcyjność, pomysłowość i jakość interfejsu — 10%,
- jakość dostarczonych materiałów oraz MVP — 10%.

## 17. Priorytety implementacyjne

### P0 — konieczne

- formularz opisu potrzeby,
- katalog innowacji,
- mechanizm matchmakingu,
- uzasadnienie rekomendacji,
- ekran wyników,
- podstawowy responsywny UX,
- demonstracyjne dane.

### P1 — bardzo wartościowe

- logowanie / profile użytkowników,
- panel administratora,
- zgłoszenia nowych pomysłów,
- powiadomienia administratora,
- ścieżka odpowiedzi administrator → użytkownik,
- zasobnik wiedzy,
- podstawowa analityka.

### P2 — rozszerzenia

- Tester Innowacji,
- Middleman Innowacji,
- rozbudowany generator wniosków,
- semantyczny matchmaking oparty o embeddingi / AI,
- personalizacja rekomendacji,
- automatyczna analiza trendów.

## 18. Proponowany zakres hackathonowego MVP

Najbezpieczniejszy zakres demo:

### Ekran 1 — strona główna

Dwie główne ścieżki:

- „Mam problem / potrzebę”
- „Mam pomysł na rozwiązanie”

### Ekran 2 — opis potrzeby

Krótki formularz:

- opis problemu,
- opcjonalna grupa docelowa,
- opcjonalna lokalizacja,
- opcjonalny wybór kategorii.

### Ekran 3 — wyniki matchmakingu

Dla każdej innowacji:

- nazwa,
- skrócony opis,
- poziom dopasowania,
- „Dlaczego to pasuje?”,
- przycisk „Zobacz szczegóły”.

### Ekran 4 — szczegóły innowacji

- opis,
- problem, który rozwiązuje,
- grupa docelowa,
- potrzebne zasoby,
- źródło / materiały,
- możliwość uruchomienia Middlemana,
- możliwość zgłoszenia się do testu.

### Ekran 5 — zgłoszenie nowego pomysłu

Guided flow prowadzący użytkownika od problemu do propozycji rozwiązania.

### Ekran 6 — panel administratora

- nowe potrzeby,
- nowe pomysły,
- zgłoszenia wymagające odpowiedzi,
- lista innowacji,
- podstawowe trendy.

## 19. Proponowana logika matchmakingu MVP

Źródło wymaga przede wszystkim skutecznego sugerowania istniejących innowacji na podstawie słów kluczowych wpisanych przez użytkownika.

Minimalny algorytm:

1. Normalizacja tekstu.
2. Ekstrakcja słów kluczowych.
3. Porównanie z tagami i opisami innowacji.
4. Wyliczenie wyniku podobieństwa.
5. Posortowanie wyników.
6. Wygenerowanie uzasadnienia na podstawie pokrywających się tematów.

Przykładowy scoring:

```text
score =
  keyword_overlap * 0.40 +
  category_match  * 0.25 +
  target_group    * 0.20 +
  semantic_match  * 0.15
```

Dla hackathonowego MVP można zacząć od prostszego mechanizmu keyword/tag matching i opcjonalnie dołożyć semantyczne podobieństwo.

## 20. Definition of Done dla MVP

MVP można uznać za gotowe, jeśli:

- użytkownik może wpisać realny problem społeczny,
- system zwraca co najmniej kilka uporządkowanych rekomendacji,
- każda rekomendacja posiada czytelne uzasadnienie,
- można otworzyć szczegóły innowacji,
- administrator może zobaczyć nowe zgłoszenie,
- przynajmniej jedna dodatkowa funkcjonalność poza matchmakingiem działa end-to-end,
- interfejs jest responsywny,
- podstawowe elementy WCAG są uwzględnione,
- demo działa na rzeczywistych lub przykładowych danych dostarczonych przez organizatora.

## 21. Otwarte kwestie / braki w specyfikacji

Materiał nie określa jednoznacznie:

- sposobu uwierzytelniania użytkowników,
- czy dostęp anonimowy jest dopuszczalny,
- docelowego modelu ról i uprawnień,
- formatu danych wejściowych organizatora,
- dostępnych API,
- sposobu aktualizacji katalogu innowacji,
- kanałów powiadomień,
- szczegółowego zakresu Platformy Aktywnej Komunikacji,
- szczegółowego zakresu Panelu Administratora,
- zasad moderacji treści,
- sposobu obsługi danych osobowych,
- reguł scoringu matchmakingu,
- czy model AI / LLM jest wymagany lub dozwolony.

Te elementy należy traktować jako decyzje projektowe zespołu, a nie wymagania narzucone przez materiał.

## 22. Najważniejszy wniosek implementacyjny

Rdzeniem rozwiązania powinien być bardzo prosty, intuicyjny przepływ:

**problem użytkownika → analiza → dopasowane innowacje → uzasadnienie → następny krok**.

Pozostałe komponenty powinny rozwijać ten sam cykl:

**potrzeba → istniejące rozwiązanie → adaptacja / test → feedback → nowa wiedza → nowe lub ulepszone rozwiązanie**.

Dzięki temu platforma nie jest wyłącznie katalogiem treści, ale systemem prowadzącym użytkownika od problemu do konkretnego działania.

---

## 23. Źródło

Analiza przygotowana na podstawie materiału konkursowego „HubMI.pl”, HackYeah 2026, Regionalny Ośrodek Polityki Społecznej w Krakowie.
