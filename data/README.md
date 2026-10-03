# Dane

Skrypty w `scrapers/` pobierają dane źródłowe raz i zapisują wynik w `seed/` (commitowany). Backend importuje `seed/` przy starcie, gdy `Seed__OnStartup=true` ([ADR 0003](../docs/adr/0003-seed-import-without-overwriting-content.md)).

| Skrypt | Źródło | Wynik |
|---|---|---|
| `innovations.py` | 9 kategorii Biblioteki Innowacji Społecznych ROPS i karty innowacji | `seed/innovations.json` |
| `models.py` | strona „Innowacje w małopolskich modelach” | flaga `inServiceModel` w `seed/innovations.json` |
| `challenges.py` | PDF Mapy Wyzwań Społecznych (dane krajowe) | `seed/challenge_areas.json`, `seed/personas.json` |
| `municipalities.py` | API Banku Danych Lokalnych GUS (jednostki terytorialne) | `seed/municipalities.json` — gminy Małopolski z TERYT, typem i powiatem |
| `observer.py` | Internetowy Obserwator Statystyk Społecznych — 184 wskaźniki, ostatni rok każdego (po `municipalities.py`) | `seed/indicators.json` (z obszarami wyzwań i flagą „ogólny”), `seed/indicator_values.json` (gminy i powiaty) |

## Uruchomienie

Z katalogu `data/scrapers/`:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt     # Linux/macOS: .venv/bin/python
.venv/Scripts/python innovations.py
.venv/Scripts/python models.py          # po innovations.py — dopisuje flagę do jego wyniku
.venv/Scripts/python challenges.py
.venv/Scripts/python municipalities.py
.venv/Scripts/python observer.py      # po municipalities.py — mapuje nazwy gmin na TERYT
```

- Strony ROPS odpowiadają 403 bez nagłówka przeglądarki, więc każde żądanie ma `User-Agent` przeglądarki i odstęp 1 s.
- Odpowiedzi są zapamiętywane w `data/raw/` (poza gitem); ponowne uruchomienie nie pobiera ich drugi raz. Żeby pobrać świeże dane, usuń `data/raw/http/`.
- Certyfikaty TLS pochodzą z magazynu systemu (`truststore`), więc skrypty działają za firmowym proxy bez wyłączania weryfikacji.

Granice gmin dla mapy Atlasu leżą w `frontend/public/geo/gminy-malopolskie.geojson`: gminy Małopolski wycięte z publicznego pliku granic PRG i uproszczone (założenie A-36).

## Dane osobowe

Z sekcji „Autorzy” karty innowacji zapisujemy tylko nazwy instytucji (fundacja, stowarzyszenie, gmina, uczelnia…). Linia bez takiej nazwy jest traktowana jako imię i nazwisko i pomijana, a imię z nazwiskiem w linii instytucji jest wycinane. Persony z Mapy Wyzwań są fikcyjne.
