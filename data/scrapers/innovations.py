"""Scrapes the ROPS Library of Social Innovations into data/seed/innovations.json.

Nine category pages list the innovations (title, short description, links to the materials, the "selected for
dissemination" mark); every innovation has its own card with six numbered sections. From section 6 (Authors) only
organization names are kept: names of people are personal data and never reach the seed (SPEC 4.1).
"""

from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from common import clean_text, fetch_text, write_seed

BASE_URL = "https://rops.krakow.pl"
LIBRARY_PATH = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych"

CATEGORIES = {
    "dla-cudzoziemcow": "Dla cudzoziemców",
    "dla-dzieci-mlodziezy-i-rodziny": "Dla dzieci, młodzieży i rodziny",
    "dla-osob-o-ograniczonej-mobilnosci": "Dla osób o ograniczonej mobilności",
    "dla-osob-w-kryzysie-bezdomnosci": "Dla osób w kryzysie bezdomności",
    "dla-osob-z-niepelnosprawnoscia-intelektualna": "Dla osób z niepełnosprawnością intelektualną",
    "dla-osob-z-niepelnosprawnoscia-sensoryczna": "Dla osób z niepełnosprawnością sensoryczną",
    "dla-rynku-pracy": "Dla rynku pracy",
    "dla-seniorow": "Dla seniorów",
    "dla-zdrowia-i-medycyny": "Dla zdrowia i medycyny",
}

SECTION_KEYS = {
    1: "solution",
    2: "problems",
    3: "targetGroup",
    4: "beneficiaries",
    5: "evidence",
    6: "authors",
}

FEATURED_MARK = "WYBRANA DO UPOWSZECHNIANIA"

# A line of the Authors section is kept only when it names an institution. Everything else is treated as a
# person's name and dropped, which errs on the side of privacy.
ORGANIZATION_WORDS = re.compile(
    r"\b(fundacj|fudacj|stowarzysz|szpital|spzoz|sp\.\s*z\s*o\.?\s*o|spółk|spółdziel|uniwersytet|akademi|politechnik|uczelni|"
    r"instytut|centrum|ośrod|osrod|gmin|miast|powiat|urząd|urzad|szkoł|szkol|przedszkol|zesp[oó]ł|dom\b|"
    r"klub|koło|kolo|towarzystw|związek|zwiazek|izba|caritas|parafi|organizacj|firma|grupa|team|lab\b|"
    r"przedsiębiorstw|s\.a\.|zakład|zaklad|kooperatyw|inkubator|warsztat|regionaln|miejski|gminn|"
    r"społeczn|spoleczn|o\.p\.p|kgw|ops\b|mops|gops|pcpr|rops|ngo|federacj|sieć|siec|biur)",
    re.IGNORECASE,
)

# A kept institution line can still carry a person, e.g. "Instytut HR Anna Kowalska": a common first name followed by
# a capitalized word is cut out of it.
FIRST_NAMES = (
    "Adam Agata Agnieszka Aleksandra Alicja Andrzej Anna Barbara Bartłomiej Beata Dariusz Dawid Dominika Dorota "
    "Elżbieta Ewa Gabriela Grzegorz Iwona Jacek Jakub Jan Joanna Justyna Kamil Karolina Katarzyna Klaudia "
    "Krzysztof Łukasz Maciej Magdalena Małgorzata Marcin Maria Marek Marta Michał Mikołaj Monika Natalia "
    "Paulina Paweł Piotr Renata Robert Sylwia Tomasz Urszula Wojciech Zofia"
).split()
PERSON = re.compile(r"\b(?:dr\s+)?(?:" + "|".join(FIRST_NAMES) + r")\s+[A-ZŁŚŻŹĆ][\w-]+")


def absolute(href: str) -> str:
    return urljoin(BASE_URL, href.strip())


def slug_of(url: str) -> str:
    return url.rstrip("/").rsplit(",", 1)[-1]


def links_of(container: Tag) -> dict[str, str | None]:
    """The material links of a listing item or a card: description PDF, film, materials ZIP, terms of use."""
    links: dict[str, str | None] = {"cardPdfUrl": None, "videoUrl": None, "materialsZipUrl": None, "termsUrl": None}

    for anchor in container.find_all("a", href=True):
        href = absolute(anchor["href"])
        lower = href.lower()
        if "youtube.com" in lower or "youtu.be" in lower:
            links["videoUrl"] = links["videoUrl"] or href
        elif lower.endswith(".zip"):
            links["materialsZipUrl"] = links["materialsZipUrl"] or href
        elif "creativecommons.org" in lower or "zasad" in lower:
            links["termsUrl"] = links["termsUrl"] or href
        elif lower.endswith(".pdf"):
            links["cardPdfUrl"] = links["cardPdfUrl"] or href

    return links


def parse_listing(category_slug: str) -> list[dict]:
    url = f"{BASE_URL}{LIBRARY_PATH}/{category_slug}"
    soup = BeautifulSoup(fetch_text(url), "html.parser")
    items = []

    for item in soup.select(".news-list__item"):
        title_link = item.select_one("a.news-list__title")
        if title_link is None:
            continue

        card_url = absolute(title_link["href"])
        description = item.select_one(".news-list__desc")
        short = ""
        if description is not None:
            first_paragraph = description.find("p")
            short = clean_text(first_paragraph.get_text(" ")) if first_paragraph else ""

        items.append(
            {
                "sourceKey": slug_of(card_url),
                "title": clean_text(title_link.get_text(" ")),
                "shortDescription": short,
                "cardUrl": card_url,
                "featured": FEATURED_MARK in item.get_text(" ").upper(),
                **links_of(item),
            }
        )

    return items


def section_number(heading: Tag) -> int | None:
    match = re.match(r"\s*(\d)\s*\.", heading.get_text(" "))
    return int(match.group(1)) if match else None


def parse_card(card_url: str) -> tuple[dict[str, str], dict[str, str | None]]:
    soup = BeautifulSoup(fetch_text(card_url), "html.parser")
    content = soup.select_one(".content__main .text-content")
    if content is None:
        raise RuntimeError(f"No card content at {card_url}")

    sections: dict[str, str] = {}
    for heading in content.find_all(["h3", "h4", "h5"]):
        number = section_number(heading)
        if number not in SECTION_KEYS:
            continue

        parts = []
        for sibling in heading.find_next_siblings():
            if sibling.name in ("h3", "h4", "h5") and section_number(sibling) is not None:
                break
            parts.append(sibling.get_text("\n"))

        sections[SECTION_KEYS[number]] = "\n".join(parts)

    return sections, links_of(content)


def organizations_of(authors: str) -> str | None:
    """Only the institutions from the Authors section; people's names are dropped (SPEC 4.1, brief point 9)."""
    kept = []
    for line in re.split(r"[\n;]|,(?=\s*[A-ZŁŚŻŹĆ])", authors):
        without_people = PERSON.sub("", line)
        candidate = clean_text(without_people).strip(" ,.:-–")
        if candidate and ORGANIZATION_WORDS.search(candidate) and candidate not in kept:
            kept.append(candidate)

    return "; ".join(kept) or None


def main() -> None:
    innovations: dict[str, dict] = {}

    for category_slug, category_name in CATEGORIES.items():
        for item in parse_listing(category_slug):
            existing = innovations.get(item["sourceKey"])
            if existing is not None:
                if category_name not in existing["categories"]:
                    existing["categories"].append(category_name)
                continue

            sections, card_links = parse_card(item["cardUrl"])
            for key, value in card_links.items():
                item[key] = item[key] or value

            authors = sections.pop("authors", "")
            item["sections"] = {key: clean_text(sections.get(key, "")) for key in SECTION_KEYS.values() if key != "authors"}
            item["organization"] = organizations_of(authors)
            item["categories"] = [category_name]
            item["inServiceModel"] = False
            innovations[item["sourceKey"]] = item
            print(f"{category_slug}: {item['title']}")

    ordered = sorted(innovations.values(), key=lambda innovation: innovation["sourceKey"])
    path = write_seed("innovations.json", ordered)
    print(f"{len(ordered)} innovations -> {path}")


if __name__ == "__main__":
    main()
