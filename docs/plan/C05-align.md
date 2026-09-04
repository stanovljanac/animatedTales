# C05 — `tools/align.mjs` (forced alignment)

**Faza:** 1 (deterministički alati) · **Zavisi od:** C04 · **Procena:** ~160k tokena
**Izvorni plan, sekcije:** „Faza 1 → align.mjs — srce rešenja", „Verifikacija 2".

Najrizičnija celina u planu. Ceo tajmlajn nizvodno visi o tačnosti ovog fajla.
Dobija punu sesiju za sebe.

## Cilj

`narration.mp3` + `script.md` → `timing.json` sa **merenim** granicama svake rečenice.

## ⚠ Najvažnije pravilo ove sesije

**Whisper izlaz se NIKAD ne štampa u konzolu.** Narracija od 3:37 daje ~600 reči sa
timestamp-ovima — to je 15–20k tokena po jednom ispisu, i pojede sesiju pre nego što alignment počne.

Python helper **uvek piše u fajl**; Node čita fajl i u konzolu ispisuje **samo agregate**
(broj reči, trajanje, prve 3 i poslednje 3 rečenice, broj upozorenja).

## Isporučuje

### 1. `tools/whisper_words.py`

- `faster-whisper` 1.2.1, model `small.en` (već skinut u HF kešu), `word_timestamps=True`, `vad_filter=False`
- ulaz: wav putanja + izlazna putanja; izlaz: JSON fajl sa listom reči `{ word, start, end, probability }`
- ništa na stdout osim jedne linije statusa

### 2. `tools/align.mjs`

```
node tools/align.mjs episodes/<slug> [--model medium.en] [--asr-only] [--force]
```

Koraci:

1. `ffmpeg` konvertuje `narration.mp3` → 16 kHz mono wav u temp
2. poziva `whisper_words.py`, rezultat kešira u `episodes/<slug>/.cache/asr-words.json`
   (`--force` preskače keš). **Keš je obavezan** — bez njega svaki debug ciklus znači novi whisper run.
3. **Forced alignment na poznati tekst:** ASR reči se poravnavaju sa rečenicama iz `script.md`
   kroz Needleman–Wunsch nad normalizovanim tokenima.
   Zadržava se **tekst iz skripte** (ground truth), a **vremena iz ASR-a**. Ovo eliminiše whisper greške.
4. Izlaz `timing.json` po shemi iz C01 (`duration`, `model`, `sentences[]`, `words[]`, `outro_start`)
5. Upozorenje na rečenice sa `confidence < 0.85` + predlog `medium.en` rerun-a

### 3. `tests/align.test.mjs`

Unit testovi za **čiste delove**, bez pokretanja whisper-a:
normalizacija tokena, Needleman–Wunsch nad sintetičkim nizovima, segmentacija rečenica.

## Odluke koje moraju biti donete i zapisane

- **Normalizacija tokena:** lowercase, skidanje interpunkcije, brojevi → reči (`480` vs „four eighty"),
  apostrofi (`don't` → `dont` ili `do nt`). Whisper i skripta se razilaze upravo ovde.
- **NW skorovi:** match / mismatch / gap penal. Dokumentuj izabrane vrednosti.
- **Segmentacija `script.md` na rečenice:** skraćenice (`B.C.`, `Mr.`), brojevi sa tačkom,
  navodnici, crtice. Piši testove za svaki slučaj.
- **`start: 0.025057`** — `narration.mp3` (Rome) ne počinje na nuli. Odluči da li se ofset oduzima
  i **zapiši odluku**; ista odluka mora važiti i u `assemble.mjs` (C09), inače nastaje drift.
- **`outro_start`** — nalazi se iz `## OUTRO` sekcije `script.md`. Ako je nema, `null`.
- **Šta je `confidence` rečenice** — prosek `probability` njenih reči, ili minimum? Odluči.

## Verifikacija — definicija gotovog (izvorna verifikacija 2)

Test epizoda: `episodes/night-when-rome-almost-fell/narration.mp3` (217.21s).

Ta epizoda **nema `script.md`** — zato: prvo whisper transkript, pa alignment na sopstveni izlaz
(sanity test — ako alignment na sopstveni transkript ne daje identična vremena, algoritam je pogrešan).

Kriterijumi prihvatanja:

- zbir trajanja rečenica = **217.2s ±0.3s**
- vremena **monotono rastuća**, `end[i] <= start[i+1]`
- **nijedan gap > 1.5s**
- alignment na sopstveni transkript: 100% match, nula gap-ova
- izmeri i zapiši trajanje whisper run-a (`small.en`, CPU) — ulazi u procenu za C13

Ispis u konzolu smе biti samo sažetak:

```
217.21s · 41 rečenica · 612 reči · model small.en · 0 gapova >1.5s · 2 rečenice ispod 0.85
```

## Zamke

- Ne pokretati whisper više puta „da se vidi" — keširaj odmah, u prvom prolazu.
- `medium.en` je takođe već skinut; koristi ga samo kad `small.en` padne ispod praga.
- Ako NW postane spor na 600×600 matrici — nije, ali ne piši optimizacije pre nego što izmeriš.

## Tačka preseka ako sesija pređe budžet

Prvo isporuči korake 1–2 (`whisper_words.py` + `--asr-only` do `asr-words.json`) i commituj —
tada sledeća sesija ima keširan ASR i ne troši ni sekund na whisper.
Forced alignment (3–5) je onda čist algoritamski posao nad postojećim fajlom.
