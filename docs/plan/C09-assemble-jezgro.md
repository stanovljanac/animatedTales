# C09 — `tools/assemble.mjs`, jezgro

**Faza:** 1 (deterministički alati) · **Zavisi od:** C04 (`probe`, `run`), C06 (fixture-i) · **Procena:** ~150k tokena
**Izvorni plan, sekcije:** „assemble.mjs" (koraci 1, 2, 3-hard-cut, 4, 5), „Verifikacija 5".

## Cilj

`storyboard.json` + `shots/*.mp4` + `narration.mp3` + `endcard.jpeg` → `final.mp4`.
Bez dissolve-a i bez `qc-report.md` — to je C10. Ovde se dokazuje da **matematika tajmlajna drži u stvarnom renderu**.

```
node tools/assemble.mjs episodes/<slug> [--res 1080p]
```

## Koraci

1. **Validacija** — svaki shot ima svoj `shots/partNN.mp4` i izvor je ≥ `use_out`.
   Pada rano i jasno; ne startuj render ako fali ijedan part.
2. **Po shotu:** `-ss use_in -t use_len`, **`-an`** (izbacuje Veo audio),
   `scale=1920:1080:flags=lanczos`, `fps=24`.
3. **Konkatenacija** — hard cut između svih shotova (dissolve dolazi u C10).
4. **Narracija** kao jedini audio stream, od `t=0`.
5. **End card** — `endcard.jpeg` se drži koliko traje outro deo narracije
   (`outro_start` iz `timing.json`) **+ 1.5s repa**.

Izlaz: `final.mp4` — h264, yuv420p, CRF 18, 1920×1080 @ 24fps.

**Idempotentnost je zahtev, ne bonus:** posle zamene jednog `partNN.mp4` ponovno pokretanje mora
dati ispravan `final.mp4` bez ručnog čišćenja.

## Odluke koje moraju biti donete

- **`-ss` pre ili posle `-i`?** Pre `-i` je brzo ali seče na keyframe; posle `-i` je tačno ali sporo.
  Pošto se ionako re-enkodira zbog `scale`+`fps`, **koristi `-ss` posle `-i`** (tačno sečenje).
  Izmeri vreme na 33 shota i zapiši.
- **Ofset narracije.** `narration.mp3` (Rome) ima `start: 0.025057`. Odluka mora biti **identična**
  onoj iz C05 — inače video i audio nose različit nulti trenutak i drift je zagarantovan.
- **Međukorak na disku ili filter_complex u jednom prolazu?** Preporuka: pojedinačni trimovani
  segmenti u `episodes/<slug>/.cache/seg/NN.mp4`, pa concat demuxer. Sporije, ali debug-abilno
  i idempotentno po shotu.
- **Ulazni klipovi su 1280×720** (proveren `part1.mp4`), izlaz je 1920×1080 → upscale.
  Potvrdi da `lanczos` daje prihvatljiv rezultat pre nego što se zakuca.

## Isporučuje

- `tools/assemble.mjs` (koraci 1–5)
- `tests/assemble.test.mjs` — validacioni sloj i konstrukcija ffmpeg argumenata (bez pravog rendera)
- Sintetički `storyboard.json` za Marathon epizodu (33 shota) — koristi se u V5

## Verifikacija — definicija gotovog (izvorna verifikacija 5)

End-to-end na **Marathon** epizodi: 33 postojeća `partNN.mp4` klipa, sintetički `storyboard.json`
sa `use_len` izračunatim tako da zbir = **293.7s**.

```bash
node tools/assemble.mjs episodes/marathon
node -e "import('./tools/ffmpeg.mjs').then(async m => console.log(await m.probe('episodes/marathon/final-new.mp4')))"
```

Kriterijumi prihvatanja:

- trajanje **293.7s ±0.2s**
- **tačno jedan** audio stream, i to narracija (ne Veo audio)
- 1920×1080 @ 24fps, yuv420p
- uporediti sa postojećim `final.mp4` iz stare ručne montaže → potvrditi da nema drifta

**Ne prepisuj postojeći `episodes/marathon/final.mp4`.** Piši u `final-new.mp4` dok se ne potvrdi.

## Zamke

- Render 33 klipa traje minutima → pokreni ga sa `run_in_background`, ne blokiraj sesiju.
- ffmpeg piše progress na stderr; **ne prosleđuj ga u konzolu u celini** — filtriraj na poslednju liniju.
- Marathon narracija: proveri stvarno trajanje `probe()`-om pre nego što zakucaš 293.7s.
- Epizoda nema `timing.json` (legacy) → `outro_start` za end card postavi ručno u sintetičkom storyboardu.

## Tačka preseka ako sesija pređe budžet

Koraci 1–3 (validacija + trim + concat, bez audia i end carda) su zaokružena isporuka koja se može
verifikovati na trajanje. Audio (4) i end card (5) idu u nastavak.
