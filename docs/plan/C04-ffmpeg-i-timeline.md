# C04 — `tools/ffmpeg.mjs` + `tools/timeline.mjs`

**Faza:** 1 (deterministički alati) · **Zavisi od:** C01 · **Procena:** ~140k tokena
**Izvorni plan, sekcije:** „Faza 1 → ffmpeg.mjs", „timeline.mjs", „Algoritam sečenja beata", „Verifikacija 1 i 3".

## Cilj

Dva nezavisna modula: pristup ffmpeg-u i **čist algoritam sečenja beata na shotove**.
Nema ASR-a, nema I/O u jezgru — sve je unit-testabilno. Node ESM, **bez npm install-a**,
testovi kroz ugrađeni `node:test` (Node 20.17 ga ima).

## ⚠ Provereno u okruženju — `ffprobe` NE POSTOJI

`imageio_ffmpeg` isporučuje isključivo:

```
C:\Python311\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe
```

Na PATH-u nema ni `ffmpeg` ni `ffprobe`. Izvorni plan pretpostavlja `ffprobe` — **ta pretpostavka je netačna.**

`probe()` mora da parsira **stderr** od `ffmpeg -hide_banner -i <file>`. Provereni izlaz:

```
  Duration: 00:00:10.01, start: 0.000000, bitrate: 2114 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1280x720, 1962 kb/s, 24 fps, 24 tbr, 12288 tbn (default)
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 128 kb/s (default)
```

**`ffmpeg -i` bez izlaznog fajla vraća exit code 1.** To je normalno ponašanje, ne greška — ne tretiraj ga kao pad.

## Isporučuje

### `tools/ffmpeg.mjs`

- `ffmpegPath()` — vraća putanju; ako `tools/config.json` ima `ffmpegPath`, koristi keš, inače
  `python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"` i **upiše u keš**
- `probe(file)` → `{ duration, width, height, fps, hasAudio, hasVideo, start }`
- `run(args, opts)` → `{ code, stdout, stderr }`, sa čitljivom greškom kad ffmpeg stvarno padne

### `tools/timeline.mjs`

Čista funkcija, bez fajl I/O u jezgru:

```
sliceBeat(sentences, opts) -> { shots: [{ use_in, use_out, use_len, motion_budget, sentences: [...] }], warnings: [] }
```

Algoritam verbatim iz izvornog plana:

```
D = trajanje beata
ako D <= 10.0            -> 1 shot, use = D
inače:
  n = ceil(D / 9.0)                      # 9s cilj, 1s rezerve od Flow limita
  podeli rečenice beata u n grupa čije su sume najbliže jednake
  ako je bilo koja grupa < 3.0s -> smanji n i ponovi
  zaokruži na 1 frejm (0.0417s @ 24fps), poslednji shot upija ostatak
```

Tvrde granice: **min 3.0s, max 10.0s** po shotu.
Sekundarni cilj: `use_len` u opsegu **7–9s**; splitter bira `n` koje daje najmanje odstupanje od 8s.
Rezovi **uvek padaju na granice rečenica**.
`motion_budget` se popunjava kad `use_len < 9.0`.

### `tests/timeline.test.mjs`, `tests/ffmpeg.test.mjs`

## ⚠ Nepokrivena ivica koju izvorni plan nema — mora se rešiti ovde

Beat od npr. **30.5s sa svega 2 rečenice** (14s + 16.5s) ne može istovremeno da poštuje
„max 10s po shotu" i „rez pada na granicu rečenice". Algoritam gore bi ušao u beskonačnu redukciju `n`.

Definiši ponašanje i zapiši ga u kod i u `docs/reference/schemas.md`. Preporuka:
kad nijedna podela po granicama rečenica ne staje u [3.0, 10.0], **seci unutar rečenice**
na granici reči najbližoj ciljnom trajanju i podigni `warning` koji `at-storyboard` prikazuje korisniku.
Sličan slučaj: **jedna rečenica duža od 10s** — ista logika.

## Verifikacija — definicija gotovog

### V1 — ffmpeg wrapper (izvorna verifikacija 1)

```bash
node -e "import('./tools/ffmpeg.mjs').then(async m => console.log(await m.probe('episodes/marathon/part1.mp4')))"
```

Očekivano: `duration ≈ 10.01`, `1280x720`, `fps 24`, `hasAudio true`.

```bash
node -e "import('./tools/ffmpeg.mjs').then(async m => console.log(await m.probe('episodes/night-when-rome-almost-fell/narration.mp3')))"
```

Očekivano: `duration ≈ 217.21`, `start ≈ 0.025057`, `hasVideo false`.

### V3 — timeline unit testovi (izvorna verifikacija 3)

```bash
node --test tests/
```

Obavezni slučajevi:

| Ulaz | Očekivano |
|---|---|
| beat 4.6s | 1 shot, `use = 4.6` |
| beat 23.4s | 3 shota, svi u [3, 10], zbir = 23.4 ±0.05 |
| beat 11.5s | 2 shota ≈ 5.75 — **nikad 10 + 1.5** |
| bilo koji | svaki rez pada na granicu rečenice |
| grupa < 3.0s | `n` se smanjuje i ponavlja |
| `use_len < 9.0` | `motion_budget` postavljen |
| 2 rečenice / 30.5s | ne pada; seče unutar rečenice + `warning` |
| jedna rečenica 12s | ne pada; seče unutar rečenice + `warning` |

Svi rezultati zaokruženi na frejm (0.0417s @ 24fps), poslednji shot upija ostatak.

## Tačka preseka ako sesija pređe budžet

`ffmpeg.mjs` + V1 je zaokružena isporuka. `timeline.mjs` + V3 mogu u zasebnu sesiju —
ne dele nijednu liniju koda.
