"""Writes data/seed/municipalities.json: every gmina of Małopolska with its TERYT code, type and powiat.

The source is the public API of GUS Bank Danych Lokalnych (no key needed). A BDL unit id carries the TERYT code:
for 011212001011 the voivodeship is 12, the powiat 01, the gmina 01 and its type 1, which gives TERYT 1201011.
Parts of an urban-rural gmina (BDL kinds 4 and 5) are not gminy and are left out.
"""

from __future__ import annotations

import json

from common import fetch_text, write_seed

API = "https://bdl.stat.gov.pl/api/v1/units"

MALOPOLSKA_VOIVODESHIP = "011200000000"

TYPES = {"1": "URBAN", "2": "RURAL", "3": "URBAN_RURAL"}


def units(level: int) -> list[dict]:
    collected: list[dict] = []
    page = 0
    while True:
        url = f"{API}?level={level}&parent-id={MALOPOLSKA_VOIVODESHIP}&page-size=100&page={page}&format=json"
        payload = json.loads(fetch_text(url))
        collected.extend(payload["results"])
        if len(collected) >= payload["totalRecords"]:
            return collected
        page += 1


def teryt_of(unit_id: str) -> str:
    voivodeship = unit_id[2:4]
    powiat = unit_id[7:9]
    gmina = unit_id[9:11]
    kind = unit_id[11]
    return f"{voivodeship}{powiat}{gmina}{kind}"


def powiat_name(name: str) -> str:
    """'Powiat bocheński' → 'bocheński'; 'Powiat m. Kraków' → 'm. Kraków', the way GUS names a city with powiat rights."""
    return name.removeprefix("Powiat ").strip()


def last_year(unit_id: str) -> int:
    """The last year a unit existed. A gmina that changed type (a village got town rights) keeps its old unit with
    the old type, so only units alive in the newest year are current gminy."""
    detail = json.loads(fetch_text(f"{API}/{unit_id}?format=json"))
    return max(detail["years"])


def main() -> None:
    powiats = {unit["id"]: powiat_name(unit["name"]) for unit in units(5)}
    gminy = [unit for unit in units(6) if unit.get("kind") in TYPES]
    years = {unit["id"]: last_year(unit["id"]) for unit in gminy}
    newest_year = max(years.values())
    municipalities = []

    for unit in gminy:
        kind = unit["kind"]
        if years[unit["id"]] != newest_year:
            continue

        municipalities.append(
            {
                "teryt": teryt_of(unit["id"]),
                "name": unit["name"],
                "type": TYPES[kind],
                "powiat": powiats[unit["parentId"]],
            }
        )

    municipalities.sort(key=lambda municipality: municipality["teryt"])
    if not all(municipality["teryt"].startswith("12") for municipality in municipalities):
        raise RuntimeError("A municipality outside Małopolska came back from BDL")
    if len({municipality["teryt"][:6] for municipality in municipalities}) != len(municipalities):
        raise RuntimeError("Two current units share one gmina code")

    path = write_seed("municipalities.json", municipalities)
    print(f"{len(municipalities)} municipalities -> {path}")


if __name__ == "__main__":
    main()
