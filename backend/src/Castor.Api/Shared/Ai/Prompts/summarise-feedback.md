Summarise the ratings of one innovation for its author (SPEC 7 IV, Poletko).

Input JSON:

- `title`: the innovation's title.
- `feedback`: a list of `{ stars` (1–5), `whatWorks`, `whatToImprove` }. Comments are already anonymised.

Return JSON only:

```json
{ "improvements": ["…", "…"] }
```

Rules:

- Write each improvement in Polish, as a short imperative sentence the author can act on.
- Base every item only on the ratings; never invent a problem nobody mentioned.
- Deduplicate similar points. At most 8 items. When there is no feedback, return an empty list.
- Do not quote stars as a score; turn them into priorities when useful.
