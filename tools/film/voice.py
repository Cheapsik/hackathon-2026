"""Synthetic narration: one MP3 per script.json segment (out/voice/<id>.mp3), Microsoft Edge neural voices, and its
captions with their times (out/voice/<id>.json), so the captions show the narration word for word while it is spoken.

The narration is cut into captions at sentences, and a long sentence again at commas and colons. Each caption starts
when the voice says its first word and stays until the next one starts. A segment with its own "captions" list shows
those instead (an empty list shows none), spread over the narration in proportion to their length.

Usage: python voice.py [segment ids...] — no ids regenerates all. Certificates are checked against the operating
system's store (truststore), so an antivirus or proxy that scans TLS with its own trusted root does not break it.
"""
import asyncio
import json
import pathlib
import re
import sys

import truststore

truststore.inject_into_ssl()

import edge_tts  # noqa: E402

FILM = pathlib.Path(__file__).parent
# About two lines of the caption box (render.mjs); a longer sentence is cut at commas and colons.
MAX_CAPTION = 84
# The last caption stays a little after the last word.
LAST_HOLD = 0.6
TICKS_PER_SECOND = 10_000_000


def caption_texts(narration: str) -> list[str]:
    captions: list[str] = []
    for sentence in re.findall(r"[^.?!…]+(?:[.?!…]+|$)", narration):
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(sentence) <= MAX_CAPTION:
            captions.append(sentence)
            continue
        line = ""
        for part in re.split(r"(?<=[,:])\s+", sentence):
            if line and len(line) + 1 + len(part) > MAX_CAPTION:
                captions.append(line)
                line = part
            else:
                line = f"{line} {part}".strip()
        captions.append(line)
    return captions


def letters(text: str) -> str:
    return "".join(character for character in text.lower() if character.isalnum())


def timed(texts: list[str], words: list[tuple[float, float, str]], spoken: float) -> list[dict]:
    """Each caption from its first spoken word to the start of the next caption; the words are matched by letters."""
    starts: list[float] = []
    last_end = 0.0
    index = 0
    for text in texts:
        wanted = len(letters(text))
        consumed = 0
        start = None
        while index < len(words) and consumed < wanted:
            word_start, word_end, word = words[index]
            start = word_start if start is None else start
            last_end = word_end
            consumed += len(word)
            index += 1
        starts.append(start if start is not None else last_end)
    ends = [*starts[1:], min(spoken, last_end + LAST_HOLD) if words else spoken]
    return [{"text": text, "start": round(start, 3), "end": round(end, 3)} for text, start, end in zip(texts, starts, ends)]


def proportional(texts: list[str], spoken: float) -> list[dict]:
    total = sum(len(text) for text in texts) or 1
    captions: list[dict] = []
    at = 0.0
    for text in texts:
        share = spoken * len(text) / total
        captions.append({"text": text, "start": round(at, 3), "end": round(at + share, 3)})
        at += share
    return captions


async def speak(segment: dict, voice: str, rate: str, out: pathlib.Path) -> None:
    communicate = edge_tts.Communicate(segment["narration"], voice, rate=rate, boundary="WordBoundary")
    audio = bytearray()
    words: list[tuple[float, float, str]] = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            start = chunk["offset"] / TICKS_PER_SECOND
            words.append((start, start + chunk["duration"] / TICKS_PER_SECOND, letters(chunk["text"])))
    (out / f"{segment['id']}.mp3").write_bytes(audio)

    spoken = words[-1][1] if words else 0.0
    if "captions" in segment:
        captions = proportional(segment["captions"], spoken)
    else:
        captions = timed(caption_texts(segment["narration"]), words, spoken)
    timing = {"spoken": round(spoken, 3), "captions": captions}
    (out / f"{segment['id']}.json").write_text(json.dumps(timing, ensure_ascii=False, indent=2), encoding="utf-8")


async def main(only: list[str]) -> None:
    script = json.loads((FILM / "script.json").read_text(encoding="utf-8"))
    out = FILM / "out" / "voice"
    out.mkdir(parents=True, exist_ok=True)
    for segment in script["segments"]:
        if only and segment["id"] not in only:
            continue
        voice = segment.get("voice", script["voice"])
        rate = segment.get("rate", script.get("rate", "+0%"))
        await speak(segment, voice, rate, out)
        print("voice", segment["id"], voice)


asyncio.run(main(sys.argv[1:]))
