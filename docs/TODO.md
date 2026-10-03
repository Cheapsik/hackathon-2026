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

## LLM — dostawca i pierwsze adaptery

SPEC §1 i §3 wymagają abstrakcji `ILlmClient` z adapterami wybieranymi przez `Llm__Provider`. Nie ustalono, którego dostawcę obsługujemy pierwszego ani do którego jest klucz na demo.

Propozycja z sesji projektowej: adapter `anthropic` i `openai-compatible` (obejmuje OpenAI, Ollama, vLLM) na `HttpClient`, bez SDK dostawców.

Blokuje: **każdą funkcję AI** — klasyfikację i ranking zgłoszeń (moduł I), genomy innowacji, kartę dopasowania (moduł VII), asystentów, szkice odpowiedzi i naborów (moduł VI), tryb „Prościej”. Przed demem musi istnieć co najmniej jeden działający adapter.
