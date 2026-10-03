# TODO

Decyzje odłożone na później. Każda pozycja mówi, co blokuje, dopóki nie zostanie rozstrzygnięta.

## Embeddingi — dostawca, model, wymiar wektora

SPEC §1 i §3 („do ustalenia”). Uwaga: Anthropic nie udostępnia API embeddingów, więc potrzebny jest inny dostawca albo model lokalny.

Kandydaci rozważeni w sesji projektowej:

- OpenAI `text-embedding-3-small` (1536 wymiarów, wymaga klucza),
- lokalny model wielojęzyczny, np. `bge-m3`, w kontenerze Ollama/TEI (bez klucza, dobry polski, cięższy VPS).

Do czasu decyzji działa wariant awaryjny z SPEC §6.4: wyszukiwanie pełnotekstowe + genomy wszystkich innowacji w prompcie rankingu.

Blokuje:

- część wektorową wyszukiwania kandydatów (SPEC §6.4 krok 2),
- podobieństwo wektorowe zgłoszeń (§6.4 krok 5) i fiszek (§6.6),
- pytania do raportów — RAG (§6.7, moduł II).

Kolumna `embedding vector(N)` genomu jeszcze nie istnieje — dojdzie migracją razem z wymiarem z `Embeddings:Dimensions`.

## Moduł VI — co zostało

- **Wykres radaru** (SPEC §7 VI): liczby są w tabelach, a zgłoszenia widać też na mapie gmin. Wykresu słupkowego nie ma.
- **Dodanie innowacji z linku do karty ROPS albo z PDF** (AI wypełnia pola) — teraz tylko ręczny formularz.
- **Import raportów do RAG i przeliczanie embeddingów** — czeka na decyzję o embeddingach.
- **Fiszki w skrzynce zgłoszeń**: pomysły mają osobną listę „Pomysły z Kreatora” (odświeżaną przez `IdeaSubmitted`), bez klasyfikacji AI i pilności jak zgłoszenia.

## Moduł V — co zostało

- **Nieprzeczytane wiadomości**: brak licznika i znacznika przeczytania; „Moje wątki” sortują po ostatniej wiadomości.

## Moduł VII — co zostało

- **Gminy, które już wdrożyły innowację**: brak danych źródłowych; pole karty czeka na nie.
- **Wiele lat danych**: skrypt bierze ostatni rok każdego wskaźnika; trendy (moduł VI, II) potrzebują wcześniejszych lat z formularza Obserwatora.

## Moduł II — co zostało

- **Pytania do raportów** (SPEC §6.7): brak tekstów raportów w seedzie i brak embeddingów. Strona materiałów linkuje bazę raportów ROPS.
- **Dodanie innowacji z linku do karty ROPS albo z PDF** — nadal tylko ręczny formularz.
- **Wykres radaru** — jest mapa i tabele, nie ma wykresu.

## Moduł III — co zostało

- **Generowanie obrazu wizualizacji** (SPEC §7 III, opcjonalne): asystent opisuje wizualizację tekstem; obraz za tą samą abstrakcją dojdzie z dostawcą.
- **Podobieństwo wektorowe fiszek** (SPEC §6.6): kandydatów do sprawdzania duplikatów wybieramy po wspólnym obszarze (do 20 innowacji i 20 pomysłów) — czeka na embeddingi.
- **Wycofanie się współautora** i usunięcie szkicu: brak; pomysł i współautorstwo zostają.
- **Formularze bez React Hook Form i Zod** — jak w module I (D-26).

## Moduł IV — co zostało

- **Lista zapisanych testerów dla zespołu** (poza samym `signedUp` na liście publicznej): brak osobnego widoku zgłoszeń testerów z profilami.
- **Powiadomienie SignalR** o nowym zapisie albo opinii: brak; zespół odświeża podsumowanie ręcznie.

## LLM — kolejne adaptery

SPEC §1 i §3 wymagają abstrakcji `ILlmClient` z adapterami wybieranymi przez `Llm__Provider`. Zaimplementowane są `placeholder` oraz `openai` korzystający z OpenAI Responses API. Model i klucz dla demo pozostają konfiguracją środowiska, nie częścią repozytorium.

Do ewentualnego dodania pozostają adaptery `anthropic` i `openai-compatible` dla Ollama lub vLLM.

`placeholder` (`Shared/Ai/Placeholder/`, SPEC D-19) pozostaje domyślny, bez usługi zewnętrznej i z deterministycznymi odpowiedziami z pokrycia słów. Dzięki niemu przepływy działają bez klucza, ale wyniki są tylko wiarygodne, nie trafne.

Kolejny adapter dokłada się w `Shared/Ai/` jako następna implementacja `ILlmClient` i kolejny `case` w `Program.cs` (`Llm:Provider`); prompty i potoki zostają bez zmian. Każdy adapter musi zachować wymagania z SPEC §9: timeout, ponowienie przy 429/5xx, log czasu i tokenów bez treści.

Po włączeniu `openai` genomy policzone placeholderem trzeba przeliczyć (usunąć wiersze `InnovationGenomes`; zadanie po imporcie policzy brakujące).
