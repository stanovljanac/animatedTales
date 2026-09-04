# C01 — Skelet, migracija, data ugovori

**Faza:** 0 (temelji) · **Zavisi od:** — · **Procena:** ~80k tokena
**Izvorni plan, sekcije:** „Nova struktura foldera", „Migracija postojećih epizoda", „Faza 1 → align.mjs (timing.json)", „2d. Zaključavanje likova i lokacija", cela BLOCKING tabela (kao ulaz za shemu).

## Cilj

Postaviti fizičku strukturu projekta i **zaključati sve mašinske ugovore** — oblik `episode.json`,
`timing.json` i `storyboard.json`. Ništa nizvodno se ne piše dok ove tri sheme ne postoje, jer
`lint`, `render`, `shotlist`, `assemble` i oba skila čitaju isti JSON.

## Čita

Samo izvorni plan. Nijedan postojeći `docs/*.md` prompt nije potreban u ovoj celini.

## Isporučuje

### 1. `git init` + `.gitignore`

Folder je 1.7 GB, uglavnom `.mp4`. Bez ignore-a je repo neupotrebljiv.

- Ignoriši: `*.mp4`, `*.mp3`, `*.jpeg`, `*.jpg`, `*.png`, `*.wav`, `node_modules/`, `**/.cache/`, `**/temp/`
- Prati: `docs/`, `tools/`, `tests/`, `episodes/**/*.json`, `episodes/**/*.md`, `.claude/`
- Prvi commit: `chore: repo skeleton and data contracts`

### 2. Folderi

`tools/`, `episodes/`, `docs/reference/`, `docs/prompts/`, `tests/fixtures/`

### 3. Migracija 4 epizode

`mv` na istom disku je rename → trenutno. **Bez preimenovanja fajlova unutra.**

| Sada | Posle | fajlova |
|---|---|---|
| `NightWhenRomeAlmostFell/` | `episodes/night-when-rome-almost-fell/` | 36 |
| `Marathons Battle/` | `episodes/marathon/` | 43 |
| `The Last Lydian King Croseus/` | `episodes/croesus/` | 28 |
| `How Humans Learned to Cross Entire Oceans Without a Compass/` | `episodes/polynesian-navigation/` | 38 |

`assets/` ostaje u korenu. Ništa se ne briše.

### 4. `episodes/<slug>/episode.json` × 4

Minimalni manifest za gotove epizode:

```json
{ "slug": "...", "title": "...", "status": "done", "voice": "...",
  "narration_file": "narration.mp3", "final_file": "final.mp4",
  "characters": [], "locations": [], "key_props": [],
  "notes": "Legacy epizoda — nema script.md ni timing.json." }
```

### 5. `docs/reference/schemas.md` — glavni isporučeni artefakt

Puna specifikacija tri fajla; svako polje sa tipom, obaveznošću i primerom vrednosti.

**`episode.json`** — `characters[]` / `locations[]` / `key_props[]`, svaki sa `id` i
`locked_description` (25–40 reči, kopira se **doslovno** u svaki prompt; lint C1 to proverava).

**`timing.json`** — `duration`, `model`, `sentences[]` (`id`, `start`, `end`, `dur`, `text`,
`confidence`), `words[]`, `outro_start`. Oblik je dat u izvornom planu — prepiši ga verbatim i dopuni tipovima.

**`storyboard.json`** — izvorni plan ga nikad ne definiše, a čita ga pet potrošača. Mora da nosi barem:

```
episode, generated_at, narration_duration
beats[]:  beat_id, sentences[], start, end, dur, device,
          narration_says, viewer_sees, shots[]
shots[]:  shot_id, beat_id, link_group, use_in, use_out, use_len, motion_budget,
          source_file, ingredient_image, characters[],
          image_prompt, animation_prompt,
          tags: { subject_type, shot_size, angle, location, time_light, camera_motion }
```

`tags` su **tačno šest osa iz R1 pravila**. Dozvoljene vrednosti nabroj taksativno:

- `subject_type`: character / group / environment / object / map-diagram / crowd / architecture
- `shot_size`: XLS / LS / MS / CU / ECU / aerial
- `angle`: eye / low / high / overhead / profile
- `camera_motion`: locked / push / pull / pan / track / parallax / reveal
- `location`, `time_light`: slobodan string, ali **normalizovan slug** (`capitoline-hill`, `dawn-overcast`) — porede se na jednakost, pa slobodan tekst ubija R1

`link_group` je `null` za samostalan shot, inače `beat_id` čije shotove treba lepiti dissolve-om.

**Definiši i kako se broje reči** u `image_prompt` / `animation_prompt` (lint P1/P2): da li se
nazivi blokova (`CAMERA:`) broje u zbir. Odluči jednom i zapiši — inače P1/P2 nikad neće biti stabilni.

### 6. `tests/fixtures/storyboard.sample.json`

3 shota, 2 beata, jedan `link_group` par, potpuno usklađen sa shemom.
Referentni oblik koji C06–C09 koriste kao polazište.

### 7. `tools/config.json`

```json
{ "ffmpegPath": null, "fps": 24, "maxShot": 10.0, "minShot": 3.0, "targetShot": 8.0 }
```

## Zamke

- Migracija: proveri broj fajlova **pre i posle** (36 / 43 / 28 / 38).
- Ne diraj sadržaj postojećih epizoda — one su gotove.
- Shema mora da pokrije **svako polje koje BLOCKING tabela iz izvornog plana proverava** (T1–T3, S1–S3, P1–P2, C1, F1). Prođi tabelu red po red i potvrdi da polje postoji.

## Verifikacija — definicija gotovog

```bash
ls -d episodes/*/
for d in episodes/*/; do echo "$d $(ls "$d" | wc -l)"; done   # 37 44 29 39 (+1 za episode.json)
node -e "for (const f of process.argv.slice(1)) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('JSON OK')" episodes/*/episode.json tests/fixtures/storyboard.sample.json tools/config.json
git status --short | head            # nijedan .mp4 se ne pojavljuje
git log --oneline                    # jedan commit
```

Plus ručna provera: proći BLOCKING tabelu iz izvornog plana i za svaku proveru pokazati polje u `schemas.md`.

## Tačka preseka ako sesija pređe budžet

Isporuči 1–4 (skelet + migracija) i commituj. Sheme (5–7) idu u nastavak — nezavisne su od migracije.
