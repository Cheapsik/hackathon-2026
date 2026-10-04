"""Cuts the recorded scenes to the narration, overlays the captions and joins everything into out/castor-film.mp4,
plus a lighter out/castor-film-podglad.mp4 for sharing. The captions are burnt into the picture only: a separate .srt
next to the film made players such as VLC show them twice.

Each segment lasts max(narration + PAD, video / MAX_SPEED): a longer recording is sped up (at most MAX_SPEED),
a shorter one holds its last frame. Narration starts VOICE_DELAY seconds into the segment; the captions are the narration
itself, shown at the times voice.py measured (out/voice/<id>.json). A file voice-own/<id>.<any audio extension> replaces the synthetic voice of that
segment, so a narrator can record some or all of them. A file music.<any audio extension> next to this script adds
its first MUSIC_SECONDS under the end of the film.
"""
import json
import pathlib
import subprocess

FILM = pathlib.Path(__file__).parent
OUT = FILM / "out"
FPS = 30
PAD = 1.4
VOICE_DELAY = 0.4
MAX_SPEED = 1.9
END_HOLD = 1.6
MUSIC_SECONDS = 15.0
MUSIC_VOLUME = 0.55


def run(args: list[str]) -> None:
    subprocess.run(["ffmpeg", "-y", "-v", "error", *args], check=True)


def duration(path: pathlib.Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(result.stdout.strip())


def marker(file: str, value) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    markers = json.loads((OUT / "raw" / f"{file}.json").read_text(encoding="utf-8"))
    return float(markers[value])


def voice_of(segment_id: str) -> pathlib.Path:
    own = sorted((FILM / "voice-own").glob(f"{segment_id}.*")) if (FILM / "voice-own").is_dir() else []
    return own[0] if own else OUT / "voice" / f"{segment_id}.mp3"


def build_segment(number: int, segment: dict, last: bool, work: pathlib.Path) -> tuple[pathlib.Path, float]:
    sid = segment["id"]
    voice = voice_of(sid)
    spoken = duration(voice)
    parts = segment["video"]
    still = "still" in parts[0]

    inputs: list[str] = []
    chains: list[str] = []
    if still:
        length = spoken + PAD + END_HOLD
        speed = 1.0
        image = OUT / "overlay" / f"{parts[0]['still']}.png"
        inputs += ["-loop", "1", "-t", f"{length:.3f}", "-i", str(image)]
        frames = int(length * FPS)
        # A slow push-in on the still.
        chains.append(
            f"[0:v]scale=3840:-1,zoompan=z='1+0.05*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            f":d={frames}:s=1920x1080:fps={FPS},format=yuv420p[pic]"
        )
    else:
        spans = [(p["file"], marker(p["file"], p["from"]), marker(p["file"], p["to"])) for p in parts]
        recorded = sum(end - start for _, start, end in spans)
        length = max(spoken + PAD, recorded / MAX_SPEED)
        speed = max(1.0, recorded / length)
        for index, (file, start, end) in enumerate(spans):
            inputs += ["-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(OUT / "raw" / f"{file}.webm")]
            chains.append(
                f"[{index}:v]setpts=(PTS-STARTPTS)/{speed:.4f},fps={FPS},scale=1920:1080:flags=lanczos,setsar=1[p{index}]"
            )
        joined = "".join(f"[p{index}]" for index in range(len(spans)))
        chains.append(
            f"{joined}concat=n={len(spans)}:v=1:a=0,tpad=stop_mode=clone:stop_duration={length:.3f},"
            f"trim=duration={length:.3f},format=yuv420p[pic]"
        )

    # Captions at the times voice.py measured on the synthetic voice; an own narrator's recording stretches them to its
    # length. Their inputs follow the picture inputs.
    picture_inputs = inputs.count("-i")
    captions = json.loads((OUT / "voice" / f"{sid}.json").read_text(encoding="utf-8"))["captions"]
    synthetic = OUT / "voice" / f"{sid}.mp3"
    stretch = spoken / duration(synthetic) if voice != synthetic else 1.0
    current = "[pic]"
    for index, caption in enumerate(captions):
        start = VOICE_DELAY + caption["start"] * stretch
        end = VOICE_DELAY + caption["end"] * stretch
        inputs += ["-i", str(OUT / "overlay" / f"{sid}_{index}.png")]
        chains.append(f"{current}[{picture_inputs + index}:v]overlay=0:0:enable='between(t,{start:.3f},{end:.3f})'[c{index}]")
        current = f"[c{index}]"

    if last:
        chains.append(f"{current}fade=t=out:st={length - 1.0:.3f}:d=1.0[out]")
    elif number == 0:
        chains.append(f"{current}fade=t=in:st=0:d=0.6[out]")
    else:
        chains.append(f"{current}null[out]")

    # Narration, delayed and padded to the segment.
    audio_index = inputs.count("-i")
    inputs += ["-i", str(voice)]
    delay = int(VOICE_DELAY * 1000)
    chains.append(
        f"[{audio_index}:a]adelay={delay}|{delay},apad,atrim=duration={length:.3f},"
        f"aformat=sample_rates=48000:channel_layouts=stereo[aud]"
    )

    piece = work / f"{number:02}_{sid}.mp4"
    run([
        *inputs,
        "-filter_complex", ";".join(chains),
        "-map", "[out]", "-map", "[aud]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "192k", "-t", f"{length:.3f}",
        str(piece),
    ])
    print(f"{sid}: {length:5.1f} s (speed x{speed:.2f}, voice {voice.name} {spoken:.1f} s)")
    return piece, length


def add_music(film: pathlib.Path, music: pathlib.Path, length: float, out: pathlib.Path) -> None:
    """The first MUSIC_SECONDS of music.* under the end of the film: faded in and out, quieter than the voice."""
    seconds = min(MUSIC_SECONDS, length)
    start_ms = int((length - seconds) * 1000)
    chain = (
        f"[1:a]atrim=0:{seconds:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.4,afade=t=out:st={seconds - 2:.3f}:d=2,"
        f"volume={MUSIC_VOLUME},adelay={start_ms}|{start_ms},aformat=sample_rates=48000:channel_layouts=stereo[music];"
        "[0:a][music]amix=inputs=2:duration=first:normalize=0[aud]"
    )
    run([
        "-i", str(film), "-i", str(music), "-filter_complex", chain,
        "-map", "0:v", "-map", "[aud]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out),
    ])
    print(f"music: {music.name}, first {seconds:.0f} s at the end")


def main() -> None:
    script = json.loads((FILM / "script.json").read_text(encoding="utf-8"))
    work = OUT / "work"
    work.mkdir(parents=True, exist_ok=True)
    pieces: list[pathlib.Path] = []
    clock = 0.0

    for number, segment in enumerate(script["segments"]):
        last = number == len(script["segments"]) - 1
        piece, length = build_segment(number, segment, last, work)
        pieces.append(piece)
        clock += length

    listing = work / "pieces.txt"
    listing.write_text("".join(f"file '{piece.as_posix()}'\n" for piece in pieces), encoding="utf-8")
    film = OUT / "castor-film.mp4"
    music = sorted(FILM.glob("music.*"))
    if music:
        joined = work / "joined.mp4"
        run(["-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", str(joined)])
        add_music(joined, music[0], clock, film)
    else:
        run(["-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", "-movflags", "+faststart", str(film)])
    run(["-i", str(film), "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-c:a", "aac", "-b:a", "128k",
         "-movflags", "+faststart", str(OUT / "castor-film-podglad.mp4")])
    print(f"film: {film} ({clock:.1f} s)")


main()
