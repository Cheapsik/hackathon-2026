"""Marks the innovations that became part of the Małopolska Models of Social Services (inServiceModel).

Runs after innovations.py: it reads data/seed/innovations.json, sets the flag for the innovations linked from
the ROPS page and writes the file back.
"""

from __future__ import annotations

import json

from bs4 import BeautifulSoup

from common import SEED_DIR, fetch_text, write_seed
from innovations import absolute, slug_of

MODELS_URL = "https://rops.krakow.pl/innowacje-spoleczne/innowacje-w-malopolskich-modelach"


def main() -> None:
    soup = BeautifulSoup(fetch_text(MODELS_URL), "html.parser")
    content = soup.select_one(".content__main .text-content")
    if content is None:
        raise RuntimeError(f"No content at {MODELS_URL}")

    in_models = {
        slug_of(absolute(anchor["href"]))
        for anchor in content.select("li a[href]")
        if "biblioteka-innowacji-spolecznych" in anchor["href"]
    }

    innovations = json.loads((SEED_DIR / "innovations.json").read_text(encoding="utf-8"))
    known = {innovation["sourceKey"] for innovation in innovations}
    missing = in_models - known
    if missing:
        raise RuntimeError(f"Innovations from the models page are not in the library: {sorted(missing)}")

    for innovation in innovations:
        innovation["inServiceModel"] = innovation["sourceKey"] in in_models

    write_seed("innovations.json", innovations)
    print(f"{len(in_models)} innovations in service models")


if __name__ == "__main__":
    main()
