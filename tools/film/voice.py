"""Synthetic narration: one MP3 per script.json segment (out/voice/<id>.mp3), Microsoft Edge neural voices.

Usage: python voice.py [segment ids...] — no ids regenerates all. Certificates are checked against the operating
system's store (truststore), so an antivirus or proxy that scans TLS with its own trusted root does not break it.
"""
import asyncio
import json
import pathlib
import sys

import truststore

truststore.inject_into_ssl()

import edge_tts  # noqa: E402

FILM = pathlib.Path(__file__).parent


async def main(only: list[str]) -> None:
    script = json.loads((FILM / "script.json").read_text(encoding="utf-8"))
    out = FILM / "out" / "voice"
    out.mkdir(parents=True, exist_ok=True)
    for segment in script["segments"]:
        if only and segment["id"] not in only:
            continue
        voice = segment.get("voice", script["voice"])
        rate = segment.get("rate", script.get("rate", "+0%"))
        await edge_tts.Communicate(segment["narration"], voice, rate=rate).save(str(out / f"{segment['id']}.mp3"))
        print("voice", segment["id"], voice)


asyncio.run(main(sys.argv[1:]))
