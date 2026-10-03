"""Reads the Social Challenges Map PDF into data/seed/challenge_areas.json and data/seed/personas.json.

The map covers eight areas; its data are national, not regional (SPEC 4.1). Every area has a definition page, a
key challenges page and one or two persona pages. A persona page lays out goals, challenges and motivations as
three columns under their labels, so those are read by position on the page, not in text order.
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass

from pypdf import PdfReader

from common import clean_text, fetch_bytes, write_seed

MAP_URL = "https://rops.krakow.pl/mpliki/IS/IWS_20/za._nr_2._Mapa_Wyzwa_Spoecznych.pdf"
SOURCE_NOTE = "Mapa Wyzwań Społecznych, ROPS w Krakowie — dane krajowe"


@dataclass(frozen=True)
class Area:
    code: str
    number: int
    name: str
    first_page: int
    last_page: int


# The PDF is one fixed document; its page ranges per area are part of reading it.
AREAS = [
    Area("FAMILY_AND_FOSTER_CARE", 1, "Rodzina i piecza zastępcza", 3, 7),
    Area("HOMELESSNESS", 2, "Bezdomność", 8, 11),
    Area("DISABILITY", 3, "Niepełnosprawność", 12, 16),
    Area("POVERTY", 4, "Ubóstwo", 17, 21),
    Area("MIGRANT_INTEGRATION", 5, "Integracja cudzoziemców", 22, 26),
    Area("HEALTH", 6, "Zdrowie", 27, 31),
    Area("MENTAL_HEALTH", 7, "Zdrowie psychiczne", 32, 38),
    Area("SENIORS", 8, "Seniorzy", 39, 43),
]

BULLET = "•"
COLUMN_LABELS = ("Cele i potrzeby", "Wyzwania", "Motywacje")


@dataclass(frozen=True)
class Fragment:
    x: float
    y: float
    text: str


def fragments_of(page) -> list[Fragment]:
    fragments: list[Fragment] = []

    def visit(text, cm, tm, font_dict, font_size):
        if text.strip():
            x = cm[4] + tm[4] * cm[0]
            y = cm[5] + tm[5] * cm[3]
            fragments.append(Fragment(x, y, text.strip()))

    page.extract_text(visitor_text=visit)
    return fragments


def bullets_of(fragments: list[Fragment]) -> list[str]:
    """Joins fragments into bullet points: top to bottom, left to right; a bullet sign starts a new point."""
    ordered = sorted(fragments, key=lambda fragment: (-round(fragment.y), fragment.x))
    points: list[str] = []
    for fragment in ordered:
        if fragment.text == BULLET or fragment.text.startswith(BULLET):
            points.append(fragment.text.lstrip(BULLET))
        elif points:
            points[-1] += " " + fragment.text
        else:
            points.append(fragment.text)

    return [clean_text(point).replace(" - ", " – ") for point in points if clean_text(point)]


def is_heading(text: str, area: Area) -> bool:
    stripped = clean_text(text)
    return stripped in (area.name, f"{area.number}. {area.name}", f"{area.number}.") or stripped.startswith("PERSON")


def persona_of(page, area: Area) -> dict:
    fragments = fragments_of(page)
    labels = {fragment.text: fragment for fragment in fragments if fragment.text in COLUMN_LABELS}
    if len(labels) != len(COLUMN_LABELS):
        raise RuntimeError(f"Persona page of {area.code} has no column labels")

    labels_y = labels["Cele i potrzeby"].y
    challenges_x = labels["Wyzwania"].x - 20
    motivations_x = labels["Motywacje"].x - 20
    persona_y = next(fragment.y for fragment in fragments if fragment.text.startswith("PERSON"))

    columns: dict[str, list[Fragment]] = {"goals": [], "challenges": [], "motivations": []}
    profile: list[Fragment] = []
    for fragment in fragments:
        if fragment.text in COLUMN_LABELS or is_heading(fragment.text, area):
            continue
        if fragment.y < labels_y - 5:
            if fragment.x >= motivations_x:
                columns["motivations"].append(fragment)
            elif fragment.x >= challenges_x:
                columns["challenges"].append(fragment)
            else:
                columns["goals"].append(fragment)
        elif fragment.y < persona_y:
            profile.append(fragment)

    name_fragment = max((fragment for fragment in profile if fragment.text != BULLET), key=lambda fragment: fragment.y)
    description = bullets_of([fragment for fragment in profile if fragment is not name_fragment])
    age_match = re.search(r"(\d+)\s*(?:lat|lata)\b", " ".join(description))

    return {
        "name": clean_text(name_fragment.text),
        "age": int(age_match.group(1)) if age_match else None,
        "description": description,
        "goals": bullets_of(columns["goals"]),
        "challenges": bullets_of(columns["challenges"]),
        "motivations": bullets_of(columns["motivations"]),
        "challengeArea": area.code,
    }


def text_after(text: str, marker: str, area: Area) -> str:
    body = text.split(marker, 1)[1]
    lines = [line for line in body.splitlines() if not is_heading(line, area)]
    return "\n".join(lines)


def key_challenges_of(text: str, area: Area) -> list[str]:
    body = text_after(text, "Kluczowe wyzwania", area)
    points = re.split(r"•|(?:^|\n)\s*\d+\.\s*(?=[A-ZŁŚŻŹĆ])", body)
    # The first chunk is a lead-in sentence before the first point, when the page has one.
    return [clean_text(point) for point in points[1:] if clean_text(point)]


def main() -> None:
    reader = PdfReader(io.BytesIO(fetch_bytes(MAP_URL)))
    areas = []
    personas = []

    for area in AREAS:
        definition = ""
        key_challenges: list[str] = []
        for page_number in range(area.first_page, area.last_page + 1):
            page = reader.pages[page_number - 1]
            text = page.extract_text() or ""
            if "Definicja obszaru" in text and not definition:
                definition = clean_text(text_after(text, "Definicja obszaru", area).replace(BULLET, " "))
            elif "Kluczowe wyzwania" in text:
                key_challenges = key_challenges_of(text, area)
            elif "PERSON" in text:
                personas.append(persona_of(page, area))

        if not definition or not key_challenges:
            raise RuntimeError(f"Area {area.code} is missing its definition or key challenges")

        areas.append(
            {
                "code": area.code,
                "number": area.number,
                "name": area.name,
                "definition": definition,
                "keyChallenges": key_challenges,
                "source": SOURCE_NOTE,
            }
        )

    write_seed("challenge_areas.json", areas)
    write_seed("personas.json", personas)
    print(f"{len(areas)} challenge areas, {len(personas)} personas")


if __name__ == "__main__":
    main()
