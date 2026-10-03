"""Shared helpers for the scrapers: a polite HTTP client with a browser User-Agent and an on-disk cache.

rops.krakow.pl and obserwator.rops.krakow.pl answer 403 without a browser User-Agent (SPEC 4.1). Every page is
fetched once and cached under data/raw/ (outside git), so re-running a script does not hit the sites again.
"""

from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any

import requests
import truststore

# Certificates come from the operating system's trust store, not certifi's bundle, so the scripts work behind a
# corporate TLS proxy without switching verification off.
truststore.inject_into_ssl()

DATA_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = DATA_DIR / "raw"
SEED_DIR = DATA_DIR / "seed"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/130.0 Safari/537.36"
)
DELAY_SECONDS = 1.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "pl-PL,pl;q=0.9"})
_last_request_at = 0.0


def fetch_bytes(url: str) -> bytes:
    """The body of url, from the cache when it was fetched before."""
    global _last_request_at

    key = hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
    cached = RAW_DIR / "http" / key
    if cached.exists():
        return cached.read_bytes()

    wait = DELAY_SECONDS - (time.monotonic() - _last_request_at)
    if wait > 0:
        time.sleep(wait)

    response = _session.get(url, timeout=60)
    _last_request_at = time.monotonic()
    response.raise_for_status()

    cached.parent.mkdir(parents=True, exist_ok=True)
    cached.write_bytes(response.content)
    return response.content


def fetch_text(url: str) -> str:
    return fetch_bytes(url).decode("utf-8")


def write_seed(name: str, payload: Any) -> Path:
    """Writes data/seed/<name> as indented UTF-8 JSON, so a diff of the seed stays readable."""
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    path = SEED_DIR / name
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def clean_text(text: str) -> str:
    """Collapses whitespace and non-breaking spaces the CMS leaves in the text."""
    return " ".join(text.replace("\xa0", " ").split())
