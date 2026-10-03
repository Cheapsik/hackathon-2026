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

- **Wykres i mapa radaru** (SPEC §7 VI): dane są w tabelach; mapa czeka na GeoJSON gmin (jak mini-mapa w VII).
- **„Prościej”** — zatwierdzanie tekstów łatwych do czytania dojdzie z trybem „Prościej” w module II.
- **Dodanie innowacji z linku do karty ROPS albo z PDF** (AI wypełnia pola) — teraz tylko ręczny formularz.
- **Import raportów do RAG i przeliczanie embeddingów** — czeka na decyzję o embeddingach.
- **Skrzynka: fiszki (pomysły)** dojdą z modułem III.

## Moduł V — co zostało

- **Drugi użytkownik w partnerstwie** (SPEC §7 V): przy innowacji z pomysłu użytkownika wątek ma trafiać do autora — dojdzie z pomysłami w module III. Teraz pośredniczą zawsze admini.
- **Zdarzenie `IdeaSubmitted`** — z modułem III.
- **Nieprzeczytane wiadomości**: brak licznika i znacznika przeczytania; „Moje wątki” sortują po ostatniej wiadomości.

## Moduł VII — co zostało

- **Mini-mapa karty dopasowania** (SPEC §7 VII): potrzebny GeoJSON gmin Małopolski w `data/geo/` (np. z PRG GUGiK) i Leaflet — dojdzie z mapą w module II. Karta ma już tabelę z tymi samymi danymi.
- **Gminy, które już wdrożyły innowację**: brak danych źródłowych; pole karty czeka na nie.
- **Wiele lat danych**: skrypt bierze ostatni rok każdego wskaźnika; trendy (moduł VI, II) potrzebują wcześniejszych lat z formularza Obserwatora.

## LLM — dostawca i pierwsze adaptery

SPEC §1 i §3 wymagają abstrakcji `ILlmClient` z adapterami wybieranymi przez `Llm__Provider`. Nie ustalono, którego dostawcę obsługujemy pierwszego ani do którego jest klucz na demo.

Propozycja z sesji projektowej: adapter `anthropic` i `openai-compatible` (obejmuje OpenAI, Ollama, vLLM) na `HttpClient`, bez SDK dostawców.

Stan: działa dostawca `placeholder` (`Shared/Ai/Placeholder/`, SPEC D-19) — bez usługi zewnętrznej, z deterministycznymi odpowiedziami z pokrycia słów. Dzięki niemu przepływy modułu I działają od końca do końca, ale wyniki są tylko wiarygodne, nie trafne.

Prawdziwy adapter dokłada się w `Shared/Ai/` jako kolejna implementacja `ILlmClient` i kolejny `case` w `Program.cs` (`Llm:Provider`); prompty i potoki (`ProblemClassifier`, `Matchmaker`, `GenomeGenerator`) zostają bez zmian. Wymagania z SPEC §9: timeout, ponowienie przy 429/5xx, log czasu i tokenów bez treści.

Blokuje: **trafność** każdej funkcji AI — klasyfikacji i rankingu zgłoszeń (moduł I), genomów innowacji, karty dopasowania (moduł VII), asystentów, szkiców odpowiedzi i naborów (moduł VI), trybu „Prościej”. Po podłączeniu adaptera genomy policzone placeholderem trzeba przeliczyć (usunąć wiersze `InnovationGenomes`; zadanie po imporcie policzy brakujące).
