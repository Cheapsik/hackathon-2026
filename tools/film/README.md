# Film o Castorze

Narzędzia, które same nagrywają film prezentujący Castora: przeglądarka przeklikuje sceny, syntetyczny głos czyta tekst lektora, a ffmpeg skleja wszystko z napisami w gotowe MP4. Scenariusz i jego uzasadnienie są w [docs/film.md](../../docs/film.md).

Wynik trafia do `out/` (poza gitem):

| Plik | Co to jest |
|---|---|
| `out/castor-film.mp4` | film w pełnej jakości (1080p, około 45 MB) |
| `out/castor-film-podglad.mp4` | lżejsza kopia do wysłania na czat (około 15 MB) |

## Jednorazowe przygotowanie

Potrzebne są Node, Python, ffmpeg (z `ffprobe`) w `PATH`, Docker i przeglądarka Microsoft Edge. Zamiast Edge może być Chrome: ustaw `FILM_BROWSER=chrome`.

```powershell
cd tools/film
npm install
npx playwright install ffmpeg
python -m pip install -r requirements.txt
```

Jeśli pobieranie się nie udaje z błędem certyfikatu (na przykład Norton skanuje HTTPS), uruchom `npx` z `$env:NODE_OPTIONS='--use-system-ca'`. `voice.py` sam korzysta z certyfikatów systemu.

## Nagranie od nowa (na przykład po zmianie wyglądu)

Potrzebne są trzy terminale, wszystkie uruchamiane z katalogu głównego repo.

1. Baza danych, a potem backend do filmu. Ma osobną bazę `castor_film`, port 5257, treści demo i LLM-placeholder. `-Fresh` czyści bazę, żeby w skrzynce nie zostały zgłoszenia z poprzednich nagrań.
   ```powershell
   docker compose up -d --wait db
   tools/film/run-backend.ps1 -Fresh
   ```
2. Frontend do filmu, na porcie 5174:
   ```powershell
   tools/film/run-frontend.ps1
   ```
3. Film, gdy oba serwery już działają. Za pierwszym razem odczekaj minutę po starcie backendu, aż wygenerują się genomy innowacji.
   ```powershell
   tools/film/film.ps1
   ```

Całość trwa kilka minut. Nagrywanie odbywa się w tle i nic nie trzeba klikać.

**Jeśli scena się wywali**, to zwykle dlatego, że zmienił się ekran: przycisk ma inną nazwę albo pole inną etykietę. Błąd mówi, na jaki element czekał. Popraw tę scenę w `scenes.mjs` i nagraj tylko ją, na przykład `node scenes.mjs s4_gmina`, a potem `tools/film/film.ps1 -SkipScenes`.

## Zmiana tekstu lektora albo napisów

Wszystko jest w [script.json](script.json). Każdy segment to jedna scena filmu:

- `narration` to tekst, który czyta głos. **Napisy to ten sam tekst, słowo w słowo.** `voice.py` tnie go na zdania (długie zdania także na przecinkach) i zapisuje, w której chwili głos mówi każde z nich (`out/voice/<id>.json`). Napis pojawia się razem z pierwszym słowem;
- `video` mówi, który kawałek nagrania pokazać;
- `captions` jest opcjonalne: własna lista napisów zamiast tekstu lektora, rozłożona równo po czasie głosu. `"captions": []` wyłącza napisy w segmencie, tak jak na planszy końcowej.

Po zmianie tekstu nie trzeba nagrywać scen od nowa:

```powershell
tools/film/film.ps1 -SkipScenes
```

Długość każdej sceny dopasowuje się do głosu. Nagranie przyspiesza się co najwyżej 1,9 raza, a jeśli jest za krótkie, ostatnia klatka trzyma się dłużej. Liczby pisz słowami („osiemdziesiąt dwa”), bo głos czyta je wtedy naturalniej, a napisy pokażą je tak samo.

## Zmiana głosu

W `script.json` zmień `"voice"`. Polskie głosy to `pl-PL-MarekNeural` (męski, ustawiony) i `pl-PL-ZofiaNeural` (kobiecy). Tempo zmienisz, dopisując na przykład `"rate": "+8%"` obok `"voice"`; da się to też ustawić dla pojedynczego segmentu. Potem uruchom `tools/film/film.ps1 -SkipScenes`.

## Własny lektor

1. Nagraj każdy segment osobno, czytając jego `narration` ze `script.json`. Wystarczy telefon w cichym, małym pomieszczeniu.
2. Zapisz pliki jako `tools/film/voice-own/A.m4a`, `B.m4a` i tak dalej. Działa każdy format audio, nazwa musi być identyfikatorem segmentu.
3. Uruchom `tools/film/film.ps1 -SkipScenes -SkipVoice`.

Brakujące segmenty zostaną z głosem syntetycznym, więc można podmieniać je po jednym. Sceny same wydłużą się pod dłuższe nagranie. Czasy napisów pochodzą z głosu syntetycznego i rozciągają się do długości Twojego nagrania, więc czytaj tekst dokładnie i w równym tempie.

## Zmiana scenariusza

- **Nowa albo inna scena:** dopisz funkcję w `scenes.mjs`. Narzędzia są w `stage.mjs`: `s.click`, `s.type`, `s.scrollTo`, `s.wait`, a `mark('nazwa')` zapisuje moment do cięcia.
- **Kolejność i teksty:** ustaw je w `script.json`. W `video` podaj `file` (nazwę sceny) oraz `from` i `to`. Mogą to być sekundy, znacznik z `mark()`, `"ready"` (pierwsza chwila, gdy strona jest narysowana: od niej zaczynaj, bo wcześniej nagranie jest białe) albo `"end"`. Segment może sklejać kilka nagrań.
- **Plansza końcowa:** tekst i wygląd są w `render.mjs`, a link do demo ustawisz zmienną `FILM_DEMO_URL`.
- Jeśli zmienia się historia, zaktualizuj też [docs/film.md](../../docs/film.md).

## Muzyka

Połóż plik jako `tools/film/music.mp3`. Działa każdy format audio, nazwa musi zaczynać się od `music.`. Potem uruchom `tools/film/film.ps1 -SkipScenes -SkipVoice`.

- Montaż bierze pierwsze 15 sekund utworu i kładzie je pod koniec filmu, z wyciszeniem na początku i na końcu, ciszej niż głos.
- Długość i głośność zmienisz w `montage.py`: `MUSIC_SECONDS`, `MUSIC_VOLUME`.

Używaj tylko muzyki, do której macie prawo w publicznym zgłoszeniu: z biblioteki bez opłat licencyjnych (YouTube Audio Library, Pixabay Music) albo kupionej z licencją. Utwór zgrany z teledysku na YouTube może zablokować film na platformie i narusza prawa autorskie. Plik `music.*` nie trafia do gita.
