"""Scrapes the Internetowy Obserwator Statystyk Społecznych into data/seed/indicators.json and
data/seed/indicator_values.json.

The index lists 184 indicators in groups. Each indicator page shows its latest year: values per gmina in the table
"Dane w układzie gminnym" and per powiat in the main table. Gminy are named, not coded, so names are mapped to TERYT
through data/seed/municipalities.json (run municipalities.py first): "Gorlice (miasto)" is the urban gmina,
"Gorlice (wieś)" the rural one; the three cities with powiat rights appear only in the powiat table.

Which challenge areas an indicator belongs to is decided here, by its group and words in its name, so a fit
assessment can pick the indicators of an innovation's areas (SPEC 6.5). General indicators go to every assessment.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict

from bs4 import BeautifulSoup

from common import SEED_DIR, clean_text, fetch_text, write_seed

BASE_URL = "https://obserwator.rops.krakow.pl"

ALL_AREAS = [
    "FAMILY_AND_FOSTER_CARE",
    "HOMELESSNESS",
    "DISABILITY",
    "POVERTY",
    "MIGRANT_INTEGRATION",
    "HEALTH",
    "MENTAL_HEALTH",
    "SENIORS",
]

GROUP_AREAS = {
    "LUDNOŚĆ": [],
    "GOSPODARSTWA DOMOWE": ["POVERTY"],
    "RODZINA": ["FAMILY_AND_FOSTER_CARE"],
    "POMOC SPOŁECZNA - KADRA": [],
    "POMOC SPOŁECZNA - POWODY KORZYSTANIA": ["POVERTY"],
    "POMOC SPOŁECZNA - BENEFICJENCI": ["POVERTY"],
    "POMOC SPOŁECZNA - ŚWIADCZENIA": ["POVERTY"],
    "POMOC SPOŁECZNA I OTOCZENIE - INFRASTRUKTURA": [],
    "PIECZA ZASTĘPCZA": ["FAMILY_AND_FOSTER_CARE"],
    "ZDROWIE": ["HEALTH"],
    "NIEPEŁNOSPRAWNOŚĆ": ["DISABILITY"],
    "WYNAGRODZENIA, EMERYTURY I RENTY": ["POVERTY"],
    "KULTURA": [],
    "EDUKACJA": ["FAMILY_AND_FOSTER_CARE"],
    "RYNEK PRACY": ["POVERTY"],
    "MOBILNOŚĆ": ["MIGRANT_INTEGRATION"],
    "BUDŻETY GMIN": [],
}

# Words in an indicator's name that tie it to an area regardless of its group.
NAME_AREAS = [
    (r"starzeni|60\+|poprodukcyjn|pielęgnacyjn|najstarszych|emeryt|dps|domy pomocy|dzienne domy|całodobow|opiekuńcz", "SENIORS"),
    (r"bezdomn|noclegown|schronisk", "HOMELESSNESS"),
    (r"niepełnospraw|wspomagane|treningowe|środowiskowe domy", "DISABILITY"),
    (r"psychiczn|alkohol|narkoman|uzależni|środowiskowe domy", "MENTAL_HEALTH"),
    (r"choroba|chorob|szpital|aptek|zachorowani|zgony", "HEALTH"),
    (r"rodzin|dzieci|dziec|wielodziet|macierzyństw|sieroctw|przemoc|opiekuńczo-wychowawcz|wsparcia dziennego|interwencji kryzysowej|przedszkol", "FAMILY_AND_FOSTER_CARE"),
    (r"ubóstw|bezroboci|dożywiani|świadczeni|integracji społecznej|kontrakt", "POVERTY"),
    (r"migracj|cudzoziem", "MIGRANT_INTEGRATION"),
]

# The context of every fit assessment: size, density, budget and social-work staff of the gmina.
GENERAL_INDICATORS = re.compile(
    r"^(Ludność ogółem|Wskaźnik gęstości zaludnienia|Wskaźnik urbanizacji|Liczba mieszkańców na 1 pracownika socjalnego|"
    r"Wydatki budżetów gmin ogółem|Wydatki budżetów gmin - pomoc społeczna)$"
)

CITY_POWIATS = {"powiat m. Kraków": "1261011", "powiat m. Nowy Sącz": "1262011", "powiat m. Tarnów": "1263011"}


def index() -> list[dict]:
    soup = BeautifulSoup(fetch_text(f"{BASE_URL}/"), "html.parser")
    indicators = []
    for item in soup.select("li.side-menu__nav-item"):
        heading = item.select_one(".side-menu__nav-link")
        links = item.select('a[href^="/differenceanalysis/"]')
        if heading is None or not links:
            continue
        group = clean_text(heading.get_text())
        for link in links:
            indicator_id = int(link["href"].rsplit("/", 1)[-1])
            indicators.append({"id": indicator_id, "name": clean_text(link.get_text()), "group": group})

    return indicators


def areas_of(name: str, group: str) -> list[str]:
    areas = list(GROUP_AREAS.get(group, []))
    lowered = name.lower()
    for pattern, area in NAME_AREAS:
        if re.search(pattern, lowered) and area not in areas:
            areas.append(area)

    return [area for area in ALL_AREAS if area in areas]


def number(text: str) -> float | None:
    cleaned = text.replace("\xa0", "").replace(" ", "").replace(",", ".").replace("%", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def unit_of(soup: BeautifulSoup) -> str | None:
    """The page writes a percentage with its sign ("23.33%"); other units are not stated."""
    table = soup.find("table", id="myChart0sorttable")
    cell = table.select_one("tbody td.text-right") if table is not None else None
    return "%" if cell is not None and "%" in cell.get_text() else None


def table_rows(soup: BeautifulSoup, table_id: str) -> list[tuple[str, float | None]]:
    table = soup.find("table", id=table_id)
    if table is None:
        return []

    rows = []
    for row in table.select("tbody tr"):
        cells = row.find_all("td")
        if len(cells) >= 2:
            rows.append((clean_text(cells[0].get_text()), number(cells[1].get_text())))

    return rows


class TerytResolver:
    """Gmina names of the Obserwator to TERYT codes. Rows come grouped by powiat in alphabetical order, which settles
    the two names that exist in two powiats (Bolesław, Spytkowice)."""

    def __init__(self, municipalities: list[dict]):
        self.by_name: dict[str, list[dict]] = defaultdict(list)
        for municipality in municipalities:
            self.by_name[municipality["name"]].append(municipality)
        self.powiat_order = sorted({municipality["powiat"] for municipality in municipalities})

    def resolve_all(self, names: list[str]) -> dict[str, str]:
        resolved: dict[str, str] = {}
        current_powiat = 0
        for name in names:
            candidates = self.candidates(name)
            if len(candidates) > 1:
                later = [c for c in candidates if self.powiat_order.index(c["powiat"]) >= current_powiat]
                candidates = sorted(later, key=lambda c: self.powiat_order.index(c["powiat"]))[:1]
            if len(candidates) != 1:
                raise RuntimeError(f"Gmina '{name}' does not map to one TERYT code: {candidates}")
            municipality = candidates[0]
            current_powiat = self.powiat_order.index(municipality["powiat"])
            resolved[name] = municipality["teryt"]

        return resolved

    def candidates(self, name: str) -> list[dict]:
        base = re.sub(r"\s*\((miasto|wieś)\)$", "", name)
        candidates = self.by_name.get(base, [])
        if name.endswith("(miasto)"):
            return [c for c in candidates if c["type"] == "URBAN"] or [c for c in candidates if c["type"] == "URBAN_RURAL"]
        if name.endswith("(wieś)"):
            return [c for c in candidates if c["type"] == "RURAL"]
        return candidates


def details(page: BeautifulSoup) -> dict:
    content = page.select_one(".analysisContent")
    sections: dict[str, str] = {}
    if content is not None:
        for heading in content.find_all(["h2", "h3"]):
            paragraph = heading.find_next_sibling("p")
            if paragraph is not None:
                sections[clean_text(heading.get_text())] = clean_text(paragraph.get_text(" "))

    caption = page.find("p", class_="small")
    year_match = re.search(r"(\d{4})\s*$", clean_text(caption.get_text())) if caption else None

    return {
        "description": sections.get("Opis"),
        "source": sections.get("Źródło"),
        "year": int(year_match.group(1)) if year_match else None,
    }


def main() -> None:
    municipalities = json.loads((SEED_DIR / "municipalities.json").read_text(encoding="utf-8"))
    resolver = TerytResolver(municipalities)
    # "powiat bocheński" → "1201": a powiat is the first four digits of its gminy's TERYT codes.
    powiat_codes = {f"powiat {m['powiat']}": m["teryt"][:4] for m in municipalities}
    indicators = []
    values = []

    for indicator in index():
        page = BeautifulSoup(fetch_text(f"{BASE_URL}/differenceanalysis/{indicator['id']}"), "html.parser")
        info = details(page)
        if info["year"] is None:
            print(f"skipped {indicator['id']} {indicator['name']}: no year on the page")
            continue

        gmina_rows = table_rows(page, "myChart02sorttable")
        powiat_rows = table_rows(page, "myChart0sorttable")
        teryts = resolver.resolve_all([name for name, _ in gmina_rows])
        rows = [("GMINA", teryts[name], value) for name, value in gmina_rows]
        rows += [("GMINA", CITY_POWIATS[name], value) for name, value in powiat_rows if name in CITY_POWIATS]
        # Many indicators exist only per powiat; a fit assessment falls back to the gmina's powiat.
        rows += [("POWIAT", powiat_codes[name], value) for name, value in powiat_rows if name in powiat_codes]

        written = 0
        for level, teryt, value in rows:
            if value is not None:
                values.append(
                    {"indicatorId": indicator["id"], "level": level, "teryt": teryt, "year": info["year"], "value": value}
                )
                written += 1

        indicators.append(
            {
                **indicator,
                "description": info["description"],
                "source": info["source"],
                "unit": unit_of(page),
                "challengeAreas": areas_of(indicator["name"], indicator["group"]),
                "general": bool(GENERAL_INDICATORS.match(indicator["name"])),
            }
        )
        print(f"{indicator['id']:>4} {info['year']} {written:>3} values  {indicator['name']}")

    indicators.sort(key=lambda item: item["id"])
    values.sort(key=lambda item: (item["indicatorId"], item["level"], item["teryt"], item["year"]))
    write_seed("indicators.json", indicators)
    write_seed("indicator_values.json", values)
    print(f"{len(indicators)} indicators, {len(values)} values")


if __name__ == "__main__":
    main()
