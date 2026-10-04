# Castor

Platforma Małopolskiego Hubu Innowacji Społecznych (ROPS Kraków): kojarzy problemy zgłaszane przez mieszkańców, organizacje i gminy ze sprawdzonymi innowacjami społecznymi i wspiera ich rozwój, testowanie i upowszechnianie.

## Ludzie i role

**User** (konto):
Osoba zarejestrowana na platformie; ma dokładnie jedną rolę.
_Avoid_: account, profil

**Anonim**:
Osoba korzystająca z platformy bez konta. Nie jest rolą, tylko brakiem zalogowania.
_Avoid_: guest, rola `anon`

**RESIDENT** (mieszkaniec):
Rola mieszkańca albo organizacji pozarządowej; nadawana przy rejestracji.
_Avoid_: NGO (jako osobna rola), obywatel

**MUNICIPAL_OFFICER** (pracownik JST):
Rola pracownika samorządu przypisanego do jednej gminy; nadaje ją administrator.
_Avoid_: municipality (jako rola), gmina (jako osoba), urzędnik

**EXPERT** (ekspert, mentor):
Rola konsultanta przypisanego do jednego lub kilku obszarów wyzwań.
_Avoid_: mentor (jako osobna rola), doradca

**ADMIN** (pracownik ROPS):
Rola koordynatora platformy z dostępem do panelu, trendów i zatwierdzania treści.
_Avoid_: ogrodnik, moderator

**Plain text** (tekst „Prościej”):
Opis innowacji albo definicja obszaru przepisane prostymi zdaniami. Gość widzi tekst dopiero po zatwierdzeniu przez administratora.
_Avoid_: streszczenie, uproszczenie

**Persona** (persona):
Fikcyjna postać z Mapy Wyzwań; służy jako użytkownik demonstracyjny i przypadek do sprawdzania trafności.
_Avoid_: użytkownik testowy

## Wiedza

**Innovation** (innowacja):
Sprawdzone rozwiązanie społeczne z Biblioteki ROPS albo dodane z pomysłu użytkownika, opisane kartą o sześciu sekcjach.
_Avoid_: rozwiązanie, praktyka, projekt

**Library category** (kategoria Biblioteki):
Jedna z dziewięciu kategorii, w których ROPS porządkuje Bibliotekę innowacji. To nie to samo co obszar wyzwań.
_Avoid_: obszar, temat

**InnovationGenome** (genom innowacji):
Ustrukturyzowany opis innowacji: przyczyny problemu, mechanizmy działania, grupy docelowe, wymagane zasoby, skala i obszary wyzwań. Powstaje jako szkic, który administrator zatwierdza albo poprawia; do tego czasu dopasowanie korzysta ze szkicu.
_Avoid_: profil innowacji, metadane

**Required resources** (wymagane zasoby):
Instytucje, ludzie, budżet i infrastruktura, których innowacja potrzebuje w gminie, żeby się przyjąć.
_Avoid_: gleba, requiredSoil (w rozmowie)

**ChallengeArea** (obszar wyzwań):
Jeden z ośmiu obszarów Mapy Wyzwań Społecznych; jego dane są ogólnopolskie.
_Avoid_: kategoria, dziedzina

**Municipality** (gmina):
Gmina Małopolski identyfikowana kodem TERYT, z typem (miejska, wiejska, miejsko-wiejska) i powiatem.
_Avoid_: Gmina (w kodzie), JST (JST to instytucja, nie terytorium)

**Indicator** (wskaźnik):
Miara z Obserwatora Statystyk Społecznych, np. indeks starości.
_Avoid_: statystyka, metryka

**IndicatorValue** (wartość wskaźnika):
Wartość jednego wskaźnika dla jednej gminy w jednym roku.

**ResearchReport** (raport z badań):
Publikacja badawcza ROPS w PDF, z której platforma odpowiada na pytania z cytatem.
_Avoid_: Report, raport (bez dopowiedzenia) — myli się ze zgłoszeniem

**ResearchReportChunk** (fragment raportu):
Kawałek tekstu raportu z badań z numerem strony, na którym opiera się odpowiedź.

**Easy-read text** (tekst „Prościej”):
Przepisany na łatwy język opis innowacji albo obszaru, pokazywany dopiero po zatwierdzeniu przez administratora.
_Avoid_: uproszczenie, streszczenie

## Zgłoszenia i dopasowanie

**ProblemReport** (zgłoszenie):
Opis problemu podany przez mieszkańca, organizację albo gminę, z konta lub anonimowo.
_Avoid_: Report, problem, potrzeba, ticket

**Tracking code** (kod śledzenia):
Krótki kod zgłoszenia, który daje jego posiadaczowi dostęp do statusu, dopasowań i wątku bez logowania.
_Avoid_: numer zgłoszenia, token

**Main challenge area** (główny obszar zgłoszenia):
Pierwszy z obszarów wyzwań przypisanych zgłoszeniu; po nim liczymy podobne zgłoszenia.

**Clarifying question** (pytanie doprecyzowujące):
Jedno z najwyżej trzech pytań, które platforma zadaje, gdy opis zgłoszenia jest zbyt ogólny.

**MatchResult** (dopasowanie):
Innowacja albo krzyżówka zaproponowana dla zgłoszenia lub pomysłu, z pozycją, oceną i uzasadnieniem.
_Avoid_: rekomendacja, wynik wyszukiwania

**Verdict** (decyzja „nie / tak / prawie”):
Odpowiedź zgłaszającego na „Czy to spełnia Twoją potrzebę?” pod podobnym zgłoszeniem albo dopasowaną innowacją: `NO`, `YES` albo `ALMOST` (z dopiskiem, czego brakuje).
_Avoid_: ocena, feedback, reakcja

**SimilarReportVerdict** (decyzja przy podobnym zgłoszeniu):
Decyzja zgłaszającego o jednym podobnym zgłoszeniu pokazanym przy jego własnym.

**Joined case** (sprawa, do której dołączono):
Zgłoszenie, do którego inne zgłoszenie dołączyło przez „To moja sprawa”; dołączony śledzi jej status, a skrzynka liczy go przy niej.
_Avoid_: duplikat, scalenie

**Hybrid** (krzyżówka):
Propozycja łącząca dwie lub trzy innowacje, gdy żadna pojedyncza nie pasuje wystarczająco dobrze.
_Avoid_: hybryda, mix

**Blank spot** (biała plama):
Obszar wyzwań albo skupisko zgłoszeń, dla którego nie ma pasującej innowacji.
_Avoid_: luka, brak

**FitAssessment** (karta dopasowania do gminy):
Ocena, czy innowacja przyjmie się w konkretnej gminie, oparta na danych Obserwatora.
_Avoid_: karta szczepienia, fit

**Municipality portrait** (portret gminy):
Wskaźniki Obserwatora dla jednej gminy — albo jej powiatu, gdy wskaźnik nie ma danych gminnych — ze średnią regionu i rokiem danych.
_Avoid_: profil gminy (profil to strona Atlasu)

**Fit level** (ocena dopasowania):
Wysoka, średnia albo niska szansa, że innowacja przyjmie się w gminie.

**Service model** (model usługi):
Opis, kto realizuje innowację w gminie (OPS, CUS, NGO) i w jakiej formie (zadanie publiczne, usługa).

## Kreator, nabory, testy

**Idea** (pomysł, fiszka):
Pomysł na innowację opisany polami Canvasu innowacji społecznych.
_Avoid_: wniosek, propozycja

**Co-author** (współautor, `IdeaCoAuthor`):
Użytkownik, który dołączył do cudzego pomysłu zamiast zgłaszać podobny; ma te same prawa co autor.

**Idea similarity** (podobna innowacja lub pomysł):
Wynik sprawdzania duplikatów fiszki: innowacja z Biblioteki albo inny wysłany pomysł z oceną podobieństwa i uzasadnieniem.
_Avoid_: duplikat (dopóki autor sam tak nie uzna)

**Starting innovation** (punkt wyjścia):
Innowacja z Biblioteki, którą autor wskazał jako podstawę swojego pomysłu.

**IdeaReview** (ocena eksperta):
Rekomendacja eksperta dla wysłanego pomysłu — rozwijać, poprawić albo odrzucić — z komentarzem.
_Avoid_: recenzja, opinia (opinia to Feedback)

**GrantCall** (nabór):
Konkurs grantowy z terminami i kryteriami; generator wniosków działa tylko w czasie otwartego naboru.
_Avoid_: konkurs, grant

**GrantApplication** (wniosek):
Pomysł przekształcony pod kryteria jednego naboru.
_Avoid_: Application, zgłoszenie

**TestSignup** (zapis na test):
Deklaracja użytkownika, że chce testować konkretną innowację albo pomysł.

**Tester profile** (profil testera):
Wiek, gmina, potrzeby dostępności i sprzęt użytkownika, zapisane raz i używane przy każdym zapisie na test.

**Feedback** (opinia):
Ocena i uwagi użytkownika do innowacji, tekstem albo głosem.
_Avoid_: recenzja, komentarz

## Komunikacja

**Conversation** (wątek):
Rozmowa przypisana do zgłoszenia, pytania do eksperta albo propozycji partnerstwa.
_Avoid_: Thread, czat

**Message** (wiadomość):
Jedna wypowiedź w wątku.

**SenderRole** (rola w wątku):
W jakim charakterze ktoś pisze w wątku: inicjator (autor zgłoszenia, pytający, proponujący współpracę), zespół innowacji (`INNOVATION_TEAM`: autorzy pomysłu, z którego wyrosła innowacja), ekspert albo ROPS (admin). To nie rola konta: ekspert pytający innych ekspertów jest inicjatorem.
_Avoid_: rola (bez dopowiedzenia), author type
