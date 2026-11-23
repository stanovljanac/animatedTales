# TECH — tehnička specifikacija

> Reverse-engineered iz koda i ugovora, 2026-11-22 (grana `fix/gen-len-i-qa-greek-gods-1`, HEAD `8afd6e7`
> + nekomitovan `tools/compile.mjs`). **Izvor istine po sloju:** oblik podataka → [`reference/schemas.md`](reference/schemas.md);
> izvršni oblik ugovora → [`tools/contract.mjs`](../tools/contract.mjs); ponašanje → kod i testovi.
> Šta i zašto: [PRD.md](PRD.md). Polja i fajlovi: [DB.md](DB.md).

---

## 1. Arhitektura u jednoj slici

Lanac je **timeline-first** i **file-based**: svaka faza čita fajlove prethodne i piše svoje. Nema servera,
baze ni procesa u pozadini (Task Scheduler za Medium je ukinut 23. nov 2026; objava je ručna). Između faza stoji ugovor, ne API.

```
 ideja ─► research ─► script.md ──(ljudski: ElevenLabs)──► narration.mp3
 (01)      (03)         (04)                                    │
                                                                ▼
                                          align.mjs ──► timing.json          (05, merena činjenica)
                                                                │
              beats.json ──► beatplan.mjs (timeline.mjs) ──► storyboard.json  (06, skelet)
                                                                │  Claude piše promptove (at-storyboard)
                         lint.mjs ◄── at-qa ◄───────────────────┤  (07)
                         render.mjs / shotlist.mjs ─────────────┤  storyboard.md, čeklista, Flow tabla
                         flow-images.mjs ──► Flow (4 slike/shot) ─► (ljudski: izbor + animacija klipova)
                                                                │  shots/partNN.mp4 · shots/shotNN.jpeg
                         assemble.mjs ──► final.mp4 + qc-report.md  (08)
                                                                │
        publish.mjs ─► subtitles.srt · publish.md ✓ · medium.md ✓
        short.mjs / short-edit.mjs ─► short/            (09)
        medium.mjs ─► Medium (kad je video u YouTube feedu)   (10)
        compile.mjs ─► compile.json → assemble.mjs      (compilation iz delova serije)
```

**Tri principa koja se vide u svakom modulu:**

1. **Čisto jezgro, I/O na dnu.** Modul izvozi čiste funkcije (bez fajl-sistema) i ima tanak CLI na dnu
   (`main()` / `parseArgs()`), pa se testira bez ffmpeg-a i bez diska. Primeri: `timeline.mjs` (čist, bez CLI),
   `align.mjs` (`buildTiming` čist), `assemble.mjs` (`planCuts` čist, `build` radi I/O).
2. **Jedna definicija.** Helperi i rečnici (`countWords`, `normalize`, `q`, `GEN_TIERS`, `LIMITS`, `S2_BLOCKS`, …)
   žive samo u `contract.mjs`. Lint, timeline, beatplan i fixture-provera ih uvoze; niko ih ne piše ponovo.
3. **Izvedeno se ne menja ručno.** `storyboard.md`, `qa-report.md`, `qc-report.md`, `subtitles.srt` i
   `.cache/` su proizvodi alata (DO-NOT-EDIT, van gita).

## 2. Stek i okruženje

| Komponenta | Verzija / izvor | Uloga |
|---|---|---|
| **Node.js** | 22+ (razvijano na v24.21.0) | svi alati; ugrađeni `WebSocket` (CDP), `node:test` |
| **ffmpeg** | `imageio_ffmpeg` 7.1, putanja u `tools/config.json` → `ffmpegPath` | rezanje, enkodiranje, zvuk; **`ffprobe` ne postoji** |
| **Python 3.11** + `faster-whisper` | model `small.en` (rezerva `medium.en`) | `tools/whisper_words.py` — ASR sa vremenima po reči |
| **Google Chrome** | zaseban profil `%LOCALAPPDATA%\AnimatedTales\flow-chrome` | Flow (`flow-images.mjs`) i Medium (`medium.mjs`) kroz CDP |
| ~~Windows Task Scheduler~~ | `schtasks` | ukinut 23. nov 2026; `medium.mjs --post` pokreće se ručno |
| **Git** | `.gitignore` izbacuje sve medije | repo drži samo ugovore, alate, tekstove |

Nema `package.json`, `npm install`, bundlera ni CI-ja. Sve se pokreće sa `node tools/<alat>.mjs`.
OS je Windows (putanje u JSON-u su ipak uvek `/`, relativne na folder epizode).

## 3. Struktura repoa

```
CLAUDE.md     pokazivač: učitava docs/AGENTS.md u svaku Claude Code sesiju
tools/        alati (.mjs, tabela u §4) + whisper_words.py + config.json
tests/        po jedan <alat>.test.mjs + check-fixtures.mjs + fixtures/ (good, bad, linked, still, repetitive)
docs/
  reference/  UGOVORI: schemas.md (izvor istine), prompt-templates, style-string, camera-language,
              visual-devices, scoring-rubric, channel-bible, flow-filter, flow-images, flow-board,
              google-ai-plus, thumbnails
  prompts/    01-idea-discovery, 03-research, 04-script (promptovi za chat model)
  plan/       00-INDEX + C01…C15 (plan izgradnje i evidencija odstupanja)
  series/     greek-gods.md (registar zaključanih opisa, lanac outroa, plan compilationa)
  superpowers specs/plans: still-kadrovi, forma-image-prompta, medium-sweep-nedeljno
  ideas.md · publish.md · shorts.md · medium.md      (promptovi/pravila po fazama)
  PRD.md TECH.md DB.md AGENTS.md known_issues.md      (ovaj komplet)
episodes/<slug>/   po jedna epizoda (vidi DB.md)
assets/       banner, logo, audio (nije u gitu: medij)
.claude/      settings.json (dozvole) + skills/at-storyboard, at-qa, at-assemble
```

## 4. Alati (`tools/`)

Svi alati imaju `--help`. **Ulaz** je uvek folder epizode (`episodes/<slug>`, ili samo `<slug>` gde alat to ume).

| Alat | Ulaz → izlaz | Čist deo |
|---|---|---|
| `ffmpeg.mjs` | jedina tačka pristupa ffmpeg-u: `run`, `probe` (parsira stderr), `ffmpegPath` | — |
| `contract.mjs` | rečnici + helperi ugovora (`countWords`, `normalize`, `q`, `GEN_TIERS`, `LIMITS`, `GEN_COST`, …) | ceo |
| `audio-tags.mjs` | `[tag]` u skripti: skidanje, zabranjeni oblici (`sigh*`) | ceo |
| `align.mjs` | `narration.mp3` + `script.md` → `timing.json` | `parseScript`, `needlemanWunsch`, `buildTiming` |
| `timeline.mjs` | beat mapa → shotovi (`sliceBeat`, `planTimeline`) | ceo (bez CLI) |
| `beatplan.mjs` | `timing.json` + `beats.json` → checkpoint; `--write` skelet `storyboard.json` (`--still`) | da |
| `lint.mjs` | `storyboard.json` + `episode.json` → `qa-report.md`, exit 1 na BLOCKING | pravila |
| `render.mjs` | `storyboard.json` → `storyboard.md` (+ režijska tabla) | determinističan |
| `shotlist.mjs` | `storyboard.json` → čeklista za Flow, budžet kredita, `--board` | da |
| `flow-risk.mjs` | rizične reči za filter + „sredina scene" u image promptu | da |
| `cdp.mjs` | minimalan Chrome DevTools Protocol klijent (bez zavisnosti) | — |
| `flow-images.mjs` | `storyboard.json` → Flow → `flow/index.html`, `flow/flow.json` | `planShots`, hash prompta |
| `assemble.mjs` | storyboard + klipovi + narracija + end kartica → `final.mp4`, `qc-report.md` | `planCuts`, filteri, recepti |
| `compile.mjs` | `compile.json` (rečenice i kadrovi delova) → montažni storyboard/timing/titlovi | planiranje prozora |
| `publish.mjs` | `timing.json` → `subtitles.srt`; provera chaptera, naslova, `medium.md` | da |
| `short.mjs` / `short-edit.mjs` | `final.mp4` → Short 9:16 (rez ili montaža) | izrez, titlovi |
| `medium.mjs` | `medium.md` → Medium editor (CDP); feed kanala; sweep | provera, feed, stanje |
| `disk.mjs` | izveštaj o veličini; čišćenje `.cache` javnih epizoda | da |
| `whisper_words.py` | wav → JSON sa rečima; **na stdout samo jedna linija** | — |

### 4.1 Redosled komandi

```
node tools/align.mjs      episodes/<slug> [--model medium.en] [--force] [--asr-only] [--asr-script]
node tools/beatplan.mjs   episodes/<slug> --beats episodes/<slug>/beats.json [--still] [--write]
node tools/lint.mjs       episodes/<slug> [--no-media] [--no-write]
node tools/render.mjs     episodes/<slug> [--stdout]
node tools/shotlist.mjs   episodes/<slug> [--only 07,12] [--board]
node tools/flow-risk.mjs  episodes/<slug> [--only 23,26]
node tools/flow-images.mjs episodes/<slug> [--only 07,12] [--count 4] [--login] [--download]
node tools/assemble.mjs   episodes/<slug> [--dissolve 8] [--res 1080p] [--out f.mp4] [--force]
node tools/compile.mjs    episodes/<slug> [--dry-run] [--no-audio] [--no-link]
node tools/publish.mjs    episodes/<slug>
node tools/short.mjs      episodes/<slug> <id> [--sheet] [--srt-only] [--no-captions] [--out f.mp4]
node tools/medium.mjs     episodes/<slug> --check | --post | --watch      ·  --sweep | --login | --profile | --install-task
node tools/disk.mjs       --report | --clean [slug] [--yes]
node --test "tests/*.test.mjs"        node tests/check-fixtures.mjs
```

## 5. Ključni algoritmi

### 5.1 Alignment (`align.mjs`, C05)

`narration.mp3` → ffmpeg 16 kHz mono wav → `whisper_words.py` → reči sa vremenima (keš `.cache/asr-words.json`)
→ **Needleman–Wunsch** (match +1, mismatch −1, gap −1) između tokena skripte i ASR-a → `timing.json`.
Tekst u `timing.json` je **iz skripte, ne iz ASR-a** (ground truth); ASR daje samo vremena. Audio tagovi se skidaju
pre segmentacije. Upozorenja: pauza > 1.5 s, rečenica sa `confidence < 0.85` (preporuka `--model medium.en`),
rečenica koju whisper nije čuo (vreme interpolirano). **Nula tajmlajna je prvi dekodirani sempl** — nikad
`-copyts`, `-itsoffset` ni oduzimanje `probe().start` (schemas §5.4).

### 5.2 Sečenje beata (`timeline.mjs`, C04)

Rez pada na `start` **sledeće** rečenice (pauza pripada shotu koji se završava); beatovi popločavaju tajmlajn od `0.0`.
Broj shotova se ne zadaje: rešava se `min Σ(use_len − targetShot)²` uz `minShot ≤ use_len ≤ maxShot`
(`config.json`: 3 / 8 / 10). Četiri nivoa kandidata za rez (rečenica → reč → mreža 0.25 s → jednaka podela)
sa upozorenjima `intra-sentence-cut`, `blind-cut`, `forced-split`. Rep tišine se pripaja poslednjem shotu
(`tail-absorbed`). **`maxShot` ostaje 10** i posle Omni 1.2 (iznad 10 s sekunda košta duplo).

### 5.3 Montaža (`assemble.mjs`, C09–C10 + still)

1. **Validacija**: svaki shot ima izvor ≥ `use_out` (still: slika čitljiva); pada pre rendera.
2. **Segmenti na disku** (`.cache/seg/NN.mp4` + recept `NN.json`): `-ss` posle `-i`, `-frames:v round(len·fps)`,
   `scale`+`fps`, CRF 18; izmena jednog klipa regeneriše samo taj segment, a vraćanje originala daje **isti md5**.
3. **Konkatenacija**: hard cut svuda osim u `link_group` (cross-dissolve `--dissolve N`, podrazumevano 8 frejmova;
   kompenzacija po granici, ne po shotu).
4. **Zvuk**: narracija od `t=0`; zvuk klipova ispod nje na `CLIP_VOLUME = 0.105` (10,5%), odvojeni ambijentalni
   trag sempl-tačno uz frejmove; `INTRO_VOLUME 0.2`, `INTRO_FADE 0.3`.
5. **End kartica** je slika **nad** outro delom narracije + `TAIL = 1.5 s`; shotovi iza `outro_start` otpadaju,
   onaj koji granicu prelazi se krati (ispisuje se). Meri se **pokrivenost**, ne ukupno trajanje (schemas §5.8).
6. **Still**: `perspective` filter, ne `zoompan` (koji trza celim pikselima); zum `STILL_ZOOM = 1.06`, supersample ×2;
   `push · pull · pan-left · pan-right · hold`. End kartica dobija `format=yuv420p` (`recipe.v: 2`) da ne izlazi u punom opsegu boje.
7. **Zaštite**: `final.mp4` se prepisuje samo ako `.cache/assemble.json` ima pečat da ga je alat napravio
   (inače `--out`/`--force`); `episode.json` ključevi `freeze_tail` / `freeze_split` (samo uz odobrenje vlasnika),
   `clip_volume`, `intro_file`, `intro_volume`, `endcard_file`.
8. **`qc-report.md`**: prekratki izvori, zamrznuti repovi, shotovi odsečeni outro-m, iskorišćenost (`REGEN_SHARE 0.5`),
   drift protiv `DRIFT_TOL 0.2`.

### 5.4 Compilation (`compile.mjs`)

`compile.json` navodi `runs` (`episode`, `prefix`, `from`..`to` rečenice, opciono `visual`, `chapter`, `tail`).
Alat gradi montažni `storyboard.json`/`timing.json`/titlove iz delova (rez zvuka na stvarnoj tišini, ne na
alignmentu), povezuje medije (`linkOrCopy`), a **montažu radi običan `assemble.mjs`** — svi delovi dobijaju isti
template bez obzira kad su prvi put sklopljeni. Rekap nastavaka i outro/end kartica otpadaju.

### 5.5 Shortovi (`short.mjs`, `short-edit.mjs`)

Dva tipa u `short/shorts.json`: **rez** (neprekinut komad `final.mp4`, `from`/`to` na granici kadra, `crops` po `shot_id`
kao središte 9:16 prozora, smoothstep klizanje) i **montaža** (`"type": "edit"`: `lines` iz rečenica sa `from`/`before`,
`visuals` sa prozorima `[cx, cy, z]`). Samo montaža se renderuje; rez ostaje na vlasniku (YouTube editor). Izlaz 1080×1920, 24 fps,
ugrađeni titlovi, zvuk klipova 10,5%, rez slike 0.08 s pre glasa.

### 5.6 Medium (`medium.mjs`)

Medium više ne izdaje API tokene → članak se **piše u pravi editor** kroz CDP, u istom Chrome profilu kao Flow.
Javnost videa se čita iz **RSS feeda kanala** (poslednjih 15); epizoda se prepoznaje po naslovu jedne od 5 opcija iz
`publish.md`. Stanje je u `medium.json` (`drafting → publishing → published | failed`, `attempts`). `--sweep` je jedan prolaz
kroz sve neobjavljene epizode; `--install-task` registruje nedeljni zadatak (pon 21:00, bez prozora); neuspeo članak
se ne ponavlja u nedogled. Placeholderi `{{VIDEO_URL}}` i `{{THUMBNAIL}}` se popunjavaju u trenutku objave.

### 5.7 Flow slike (`flow-images.mjs`, `cdp.mjs`)

Pravi Chrome sa `--remote-debugging-port` i zasebnim profilom (Chrome 136+ ne dozvoljava debug port na podrazumevanom;
Google odbija prijavu u automatizovan pregledač). Klikovi i kucanje idu kroz `Input.*` (isTrusted događaji);
`Runtime.enable` se namerno ne zove. Stanje po shotu: `status`, `prompt_hash`, `images[]` (media ID, naslov, ime). Izmenjen
prompt → shot se ponovo generiše (`planShots`). Slike se ne skidaju (osim `--download`); skidaju se samo konačni videi.

## 6. Sistem provera

### 6.1 BLOCKING (obara exit code)

| ID | Šta proverava | Prag |
|---|---|---|
| **M1** | `render_mode` / `still_motion` / `ingredient_image` dosledni (izveštaj ga stavlja prvog) | — |
| **T1** | pokrivenost tajmlajna: gapovi, preklapanja, `Σuse_len` vs `narration_duration` | ±0.2 s |
| **T2** | `use_len` granice (+ `use_in = 0` na still) | clip 3.0–15.0 s · still 2.5–9.0 s |
| **T3** | `motion_budget` prisutan kad `use_len < 9.0`; null na still | — |
| **T4** | `gen_len` ∈ `GEN_TIERS`, ≥ `use_len`, ista brojka u promptu; null na still | cela sekunda 3–15 |
| **S1** | zabranjene prostorne fraze bez screen-position klauzule | — |
| **S2** | obavezni blokovi: `CAMERA`, `FRAME LAYOUT`, `FACING`, `SCREEN DIRECTION`, `NOT IN FRAME` (+ `SUBJECT`, `DETAIL` na shemi 2) | — |
| **S3** | reči koje impliciraju rez u klipu (`then`, `later`, `cuts to`, `meanwhile`…) | — |
| **S4** | blok `SCALE` kad shot nosi `scale_critical` entitet (shema 2) | — |
| **S5** | PRIMARY lock u `SUBJECT`, ≤ 3 locka, `visual_priority` 3–5 stavki | — |
| **P1** | dužina image prompta | shema 1: 90–160 · shema 2: 90–720 · end kartica 90–1200 |
| **P2** | dužina animation prompta | 60–220 · 60–330 kad `gen_len` > 10 s · null na still |
| **C1** | `locked_description` doslovno (`normalize`) u `image_prompt` svakog shota gde lik učestvuje | — |
| **F1** | izvor postoji i traje ≥ `use_out` (`probe()`); still: slika se čita | `--no-media` preskače |

### 6.2 ADVISORY (meri, ne obara)

`R1` pravilo razlike (6 osa) · `R2` miks tipova · `R3` uređaji · `R4` n-gram > 12 reči (uz tri izuzeća: `locked_description`,
style string, fiksne `PRESERVE`/`FORBID`) · `R5` meki opseg dužine (image 360–520, anim 150–210/200–320) · `R6` `SCREEN DIRECTION`
negacijom · `R7` `still_motion` ≠ `camera_motion` · `R8` **cena** (klip > 10 s, višak `gen_len`) · `C2` multi-visual klipovi
(danas uvek 0 — šablon nema multi-visual oblik).

## 7. Konfiguracija

`tools/config.json`:

| Ključ | Vrednost | Značenje |
|---|---|---|
| `ffmpegPath` | apsolutna putanja do `ffmpeg-win-x86_64-v7.1.exe` | vezano za mašinu (vidi known_issues) |
| `fps` | 24 | kvantizacija svih vremena shota |
| `minShot` / `targetShot` / `maxShot` | 3 / 8 / 10 | planer reza |
| `disk.published` | spisak slugova | epizode čiji se `.cache` sme čistiti |

Cene i dužine generisanja žive u kodu (`contract.mjs`: `GEN_TIERS` = 3…15 s, `GEN_COST` = 3 kr/s do 10 s, 6 kr/s iznad),
ne u konfigu — da bi ih lint i čeklista čitali iz iste definicije.

## 8. Test strategija

- **Jedinični testovi** (`node --test "tests/*.test.mjs"`): čiste funkcije bez ffmpeg-a; CLI sa pravim fajlovima samo gde mora.
- **Izvršni ugovor** (`node tests/check-fixtures.mjs`): svaka invarijanta iz `schemas.md` i svaka BLOCKING provera nad `tests/fixtures/`
  — `good-episode`, `bad-episode`, `linked-episode`, `repetitive-episode`, `still-episode` (+ `storyboard.sample.json`).
- **Fixture klipovi su u gitu** (16×16 testsrc, ~14 KB; slike 64×36) — izuzetak u `.gitignore`, jer F1 bez njih ne može da se pusti.
- **Audio tagovi**: `audio-tags.test.mjs` skenira sve `script.md` u `episodes/` (zabranjen `[sighs]`, i u HTML komentarima).
- **Fixture marathon** (`tests/make-marathon-storyboard.mjs`) deterministički gradi sintetički storyboard legacy epizode.
- Pravilo: svaka izmena ugovora menja `contract.mjs` + `schemas.md` + fixture u istoj izmeni.

## 9. Arhitekturne odluke (sažetak ADR-a)

Pun tekst je u `schemas.md` §5 i `plan/00-INDEX.md`; ovde samo odluka → razlog.

| Odluka | Razlog | Izvor |
|---|---|---|
| **Timeline-first** | nijedan kadar ne sme da „pojede" tuđe vreme; zbir = narracija ±0.2 s | README, C04 |
| **Skripta se zamrzava posle narracije** | izmena teksta poništava `narration.mp3` i `timing.json` i ruši sve nizvodno | `at-storyboard` |
| **`ffprobe` ne postoji → `probe()` parsira stderr** | `imageio_ffmpeg` isporučuje samo ffmpeg | INDEX #1 |
| **Git bez medija** | 1.7 GB, uglavnom mp4 | INDEX #3, `.gitignore` |
| **Dve ose vremena** (`t_in/t_out` vs `use_in/use_out`) | bez `t_in` se gap ne vidi | schemas §3.3 |
| **Shema 2** (plafon 160 → 280 → 360 → 720; PRIMARY/SECONDARY lock; `SCALE`; `visual_priority`) | plafon je brisao sadržaj; shema 1 ostaje validna | INDEX #24, §3.3.1 |
| **`render_mode: "still"`** | slika je besplatna, klip nije; zatvoren enum umesto izvođenja iz `camera_motion` | spec 2026-09-09, §5.13 |
| **`perspective`, nikad `zoompan`** | `zoompan` seče celim pikselima pa trza | `assemble.mjs` |
| **End kartica = rekapitulacija cele priče, poslednji shot** | CTA se vidi dok se čuje | §5.8, `prompt-templates.md` |
| **Prompt se piše prema `gen_len`, ne `use_len`** | prorezi do kraja generisanja; nikad „hold" | T4, `prompt-templates.md` „Pravila proreza" |
| **Pomera se plafon, ne proza** (P1/P2/R5) | preciznost pre kratkoće (12 prestola, `SCALE`) | §3.3.1 |
| **Hard reset klipova** | kontinuitet kroz `locked_description`, ne kroz `extend` | channel-bible §4 |
| **Omni 1.2 Flash: 3–15 s, 3/6 kr/s** (21. nov) | planer ostaje na 10 s; 11–15 s je izuzetak (R8) | §5.14 |
| **Medium kroz editor, ne API** | tokeni se više ne izdaju | `docs/medium.md` |
| **Compilation je rez, ne novo generisanje** | nula kredita; isti template kroz `assemble.mjs` | series §8 |
| **ADVISORY ne obara** | šumni linter se uči da se ignoriše; kvote tek posle 3 epizode podataka | C07 |

## 10. Kako se proširuje

| Zadatak | Koraci |
|---|---|
| **Nova provera lintera** | pravilo u `lint.mjs` + rečnik/prag u `contract.mjs` + red u `schemas.md` §4 + fixture u `tests/fixtures/` + test; BLOCKING samo ako je merljivo sa jednoznačnim da/ne |
| **Novo polje u storyboard-u** | `schemas.md` + `contract.mjs` + `check-fixtures.mjs`; opciono sa podrazumevanom vrednošću (stari fajlovi ostaju validni), `schema_version` raste samo kad se ugovor probija |
| **Novi alat** | čist modul + CLI na dnu, `--help`, test u `tests/<alat>.test.mjs`, red u README tabeli i ovde |
| **Nova epizoda** | folder `episodes/<slug>/` → `episode.json` (slug, title, protagonists, lockovi) → faze 03→08 → publish komplet → sajt |
| **Promena cenovnika/modela** | `GEN_TIERS`/`GEN_COST` u `contract.mjs`, `google-ai-plus.md` §2, `channel-bible.md` §2, `schemas.md` §5.14; nijedan alat ne hardkoduje cenu |
