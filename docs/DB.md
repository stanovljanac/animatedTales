# DB — model podataka

> **Projekat nema bazu podataka.** „Baza" je skup JSON/Markdown fajlova u `episodes/<slug>/` plus nekoliko globalnih
> tabela u `docs/`. Svaki alat čita fajlove prethodne faze i piše svoje; **fajl je tabela, folder epizode je „šema"**,
> a ugovor je izvršan (`tools/contract.mjs`, `tests/check-fixtures.mjs`).
>
> Reverse-engineered 2026-11-22. **Izvor istine za polja i invarijante je [`reference/schemas.md`](reference/schemas.md)**;
> ovaj dokument je mapa: koji fajl, ko ga piše, ko ga čita, koje veze postoje i šta se sme komitovati.
> Kontekst: [PRD.md](PRD.md) · [TECH.md](TECH.md).

---

## 1. Principi skladištenja

| Princip | Pravilo |
|---|---|
| **Jedan izvor istine** | `storyboard.json`; sve ostalo (`storyboard.md`, `qa-report.md`, čeklista) je izvedeno |
| **Merena činjenica se ne ispravlja** | `timing.json` nastaje samo novim `align.mjs` run-om nad novim `narration.mp3` |
| **Putanje** | relativne na folder epizode, separator `/` čak i na Windowsu (`shots/part07.mp4`) |
| **Vreme** | sekunde kao `number` (nikad string, nikad `mm:ss`), 3 decimale; `storyboard` vremena su **frejm-poravnata** na 24 fps, `timing.json` nije |
| **`null` vs odsutno** | obavezno polje je uvek prisutno (`null` ako nepoznato); prazan niz je `[]`, nikad `null` |
| **Identifikatori** | slug/`id` kebab `^[a-z0-9]+(-[a-z0-9]+)*$` · `S01…` · `B01…` · `shot_id` string `"01"` (vodeća nula je deo imena fajla) |
| **Brojanje reči** | `countWords`: svaki niz između belina sa bar jednim slovom/cifrom; nazivi blokova se broje |
| **„Doslovno"** | `normalize`: sažeta belina, bez razlike u veličini slova, sve ostalo mora da se poklopi |
| **Verzionisanje** | `storyboard.schema_version` (1 \| 2); novo opciono polje sa podrazumevanom vrednošću ne diže verziju |
| **Git** | komituju se tekstovi i JSON; **nikad** medij, `.cache/`, `flow/`, `storyboard.md`, `qa-report.md`, `qc-report.md` |

## 2. Entiteti i veze

```
Series ─(docs/series/*.md)─ 1:N ─► Episode ◄─ 1:1 ─ Idea (docs/ideas.md, status)
                                      │
   ┌────────────┬───────────┬─────────┼──────────────┬──────────────┬───────────────┐
   │ 1:N        │ 1:1       │ 1:1     │ 1:1          │ 0..1         │ 0..N          │
 Entity       Script ─► Narration ─► Timing     Storyboard      MediumState     Short(s)
(character/   (.md)     (.mp3)      (rečenice,   (Beat 1:N Shot)  (medium.json)  (short/)
 location/                           reči)            │
 key_prop)                                            │ N:M  (shot.characters[] → Entity.id)
   ▲                                  Sentence N:1 Beat
   └──────────────────────────────────────────────────┘
                                      Shot 1:1 media (shots/partNN.mp4 | shots/shotNN.jpeg)
                                      Shot 1:N FlowImage (flow/flow.json)

Compilation ─(compile.json)─ 1:N Run ─► (Episode, from..to rečenice)
```

Ključne veze:

- `Shot.characters[]` → `Entity.id` iz **sva tri** niza `episode.json` (karakteri, lokacije, rekviziti); `id` je jedinstven
  preko sva tri zajedno. **PRIMARY lock je `characters[0]`.**
- `Beat.sentences[]` → `Sentence.id` iz `timing.json`: pokrivaju **sve** rečenice, svaku tačno jednom, redom.
- `Shot.beat_id` je redundantan (mora da odgovara roditelju); `Shot.link_group` je `null` ili jednak sopstvenom `beat_id`.
- `Idea.status` je nezavisan od `episode.status`; ideja sme da bude `done` samo ako epizoda postoji.
- `Run.episode` + `from`/`to` → rečenice jednog dela serije; kadrovi i mediji se vezuju iz tog dela.

## 3. Katalog fajlova

`episodes/<slug>/` — **Piše**: T alat, A Claude agent, L vlasnik. **Git**: da / ne.

| Fajl | Format | Piše | Čita | Git | Napomena |
|---|---|---|---|---|---|
| `episode.json` | JSON | A (+L) | svi alati | da | manifest + registar zaključanih opisa; imaju ga sve epizode |
| `research.md` | MD | A | A | da | faza 03; tvrdnje kategorisane |
| `script.md` | MD | A | `align`, `publish`, skilovi | da | sa `[tagovima]`; `## OUTRO`; zamrznut posle narracije |
| `narration.mp3` | audio | L | `align`, `assemble` | ne | ElevenLabs; počinje na t≠0 (npr. 0.025057 s) |
| `timing.json` | JSON | T (`align`) | `beatplan`, `lint` T1, `assemble`, `publish` | da | **nikad ručno** |
| `beats.json` | JSON | A | `beatplan` | da | beat mapa: rečenice, `device`, `viewer_sees`, `tags.location/time_light` |
| `storyboard.json` | JSON | T skelet + A promptovi | lint, render, shotlist, assemble, flow-*, short | da | **izvor istine** |
| `storyboard.md` | MD | T (`render`) | L | ne | DO-NOT-EDIT; ne sme biti stariji od JSON-a |
| `qa-report.md` | MD | T (`lint`) | A, L | ne | BLOCKING + ADVISORY |
| `qc-report.md` | MD | T (`assemble`) | A, L | ne | prekratki izvori, zamrznuti repovi, drift |
| `notes.md` | MD | A | L | da | brojke koje se moraju slagati sa zaglavljem `storyboard.md`; osa ekrana |
| `alternatives.md` | MD | A | L | da | Plan B/C za rizične shotove |
| `shots/partNN.mp4` · `shots/shotNN.jpeg` | medij | L | `assemble`, `lint` F1 | ne | klip iz Flow-a / still slika (+ `images/shotNN.jpeg` za ingredient) |
| `endcard.jpeg` (ili `endcard_file`) | medij | L | `assemble` | ne | poslednji shot: poster-rekapitulacija + SUBSCRIBE |
| `final.mp4` | medij | T | L (upload) | ne | `final_file` u manifestu |
| `publish.md` | MD | A | `publish`, `medium` | da | 5 naslova, description + chapteri, hashtagovi, pin komentar, plejliste |
| `subtitles.srt` | SRT | T (`publish`) | L (YouTube Studio) | da | izvedeno iz `timing.json` |
| `thumbnails.md` | MD | A | L | da | 5 koncepata |
| `medium.md` | MD | A | `medium`, `publish` | da | front matter `tags:` + placeholderi |
| `medium.json` | JSON | T (`medium`) | `medium`, `disk` | da | stanje objave |
| `compile.json` | JSON | A | `compile` | da | samo compilation epizode |
| `short/shorts.md`, `short/shorts.json` | MD, JSON | A | `short`, `short-edit` | da | starije epizode: `shorts.md` u korenu |
| `short/shortN.mp4` · `.srt` | medij, SRT | T | L | mp4 ne | samo „montaža" se renderuje |
| `flow/index.html`, `flow/flow.json` | HTML, JSON | T (`flow-images`) | L | **ne** | stanje jedne smene |
| `flow/thumbnails.html`, `flow/thumbnails.json`, `flow/thumb1A-k.jpeg` | HTML, JSON, slike | T (`flow-images --thumbnails`) | L | **ne** | thumbnail kandidati; isti oblik stanja kao `flow.json`, ključ je id prompta (`1A`) |
| `.cache/` | razno | T | T | ne | `asr-words.json`, `assemble.json`, `seg/`, `concat.txt`, `video.mp4`, `ambient.wav` |

Globalno:

| Fajl | Sadržaj |
|---|---|
| `tools/config.json` | `ffmpegPath`, `fps`, `minShot/targetShot/maxShot`, `disk.published[]` |
| `docs/ideas.md` | bodovana lista ideja + pokrivenost regiona/epoha |
| `docs/series/greek-gods.md` | registar `locked_description` serije, lanac outroa, plan compilationa |
| `docs/reference/*.md` | ugovori sadržaja (stil, kamera, uređaji, šabloni promptova) |
| `.claude/settings.json` | dozvole za Claude Code |

## 4. Šeme

Polja ispod su sažetak; pun opis, invarijante i primeri su u `schemas.md` (§1–§3).

### 4.1 `episode.json`

| Polje | Tip | Napomena |
|---|---|---|
| `slug` | string | poklapa se sa imenom foldera |
| `title` | string | |
| `status` | `draft` \| `in-progress` \| `done` | produkcija (ne ideja) |
| `protagonists` | `(string \| string[])[]` | **ceo** video; niz = ravnopravni oblici imena; obavezno pre `publish.md`; epizode objavljene pre te provere ga nemaju |
| `voice` | string \| null | ElevenLabs glas |
| `narration_file`, `final_file`, `endcard_file` | string \| null | |
| `characters`, `locations`, `key_props` | `Entity[]` | prazni za legacy epizode i za epizode samo sa skriptom (još bez storyboard-a) |
| `notes` | string | |
| `intro_file`, `intro_volume` | string, number | opciono: uvodni animirani klip i njegova jačina; `intro_file` je obično `null`, a legacy epizode nemaju ni ključ |
| `clip_volume` | number | opciono: jačina zvuka klipova (inače `CLIP_VOLUME` 0.105) |
| `freeze_tail`, `freeze_split` | string[] | shotovi kojima je vlasnik odobrio zamrznut frejm (retko); nikad bez odobrenja |

`Entity`: `id` (kebab, jedinstven preko sva tri niza), `name`, `locked_description` (**25–40 reči**, imenička fraza bez tačke,
nosi identitet — nikad pozu ni stanje), `scale_critical?` (boolean, shema 2).

### 4.2 `timing.json`

`duration` (izmereno nad fajlom), `model` (`small.en`/`medium.en`), `sentences[]` (`id` `S01…`, `start`, `end`, `dur`, `text` iz skripte,
`confidence`), `words[]` (`sentence_id`, `word`, `start`, `end`, `confidence`), `outro_start` (number \| null).
Invarijante: rečenice monotone; gap ≤ 1.5 s; `outro_start` se poklapa sa `start` neke rečenice.

### 4.3 `storyboard.json`

```
Storyboard { schema_version 1|2, episode, generated_at, narration_duration, fps, beats[] }
  Beat  { beat_id, sentences[], start, end, dur, device|null, narration_says, viewer_sees, shots[] }
    Shot { shot_id, beat_id, link_group|null,
           t_in, t_out, use_in, use_out, use_len,        // tajmlajn epizode vs. pozicija u klipu
           motion_budget|null, gen_len|null,              // sekunde; gen_len = cela sekunda 3–15
           source_file, ingredient_image|null,
           characters[], visual_priority[],               // shema 2: [0] = PRIMARY lock; 3–5 stavki
           image_prompt, animation_prompt|null,
           tags { subject_type, shot_size, angle, camera_motion, location, time_light },
           render_mode? "clip"|"still", still_motion? push|pull|pan-left|pan-right|hold }
```

Granice i enumeracije (iz `contract.mjs`):

| Polje | Dozvoljeno |
|---|---|
| `use_len` | clip **3.0–15.0** s (planer ≤ 10) · still **2.5–9.0** s |
| `gen_len` | cela sekunda 3–15, ≥ `use_len`; `null` na still |
| `image_prompt` | shema 1: 90–160 reči · shema 2: 90–720 (meki 360–520) · poslednji shot 90–1200 |
| `animation_prompt` | 60–220 reči (60–330 kad `gen_len` > 10); `null` na still |
| `tags.subject_type` | `character · group · environment · object · map-diagram · crowd · architecture` |
| `tags.shot_size` | `XLS · LS · MS · CU · ECU · aerial` |
| `tags.angle` | `eye · low · high · overhead · profile` |
| `tags.camera_motion` | `locked · push · pull · pan · track · parallax · reveal` |
| `tags.location`, `tags.time_light` | normalizovan slug (kebab), po mogućstvu `id` iz `episode.json.locations` |
| `beat.device` | `animated-map · ledger-accumulation · process-cutaway · before-after · timeline-seasons · macro-object · silhouette · crowd-as-texture · empty-aftermath` ili `null` |

Vremenske invarijante (EPS = 0.0011): beatovi popločavaju tajmlajn bez rupa; `t_out = t_in + use_len`; `use_out = use_in + use_len`;
`|Σuse_len − narration_duration| ≤ 0.2`; poslednji shot upija ostatak kvantizacije. Na **still** shotu: `animation_prompt`,
`motion_budget`, `ingredient_image` = `null`, `use_in = 0`, `source_file = shots/shot<id>.jpeg`.

**Struktura `image_prompt`-a** (šablon u `reference/prompt-templates.md`): `STYLE` (kanonski string, doslovno) · `SUBJECT` / `SUBJECT 2` ·
`SCALE` (ako `scale_critical`) · `DETAIL` · `ACTION` (poza *pre* radnje) · `CAMERA` · `FRAME LAYOUT` · `FACING` · `SCREEN DIRECTION` ·
`NOT IN FRAME`. Lint S2 zahteva obaveznu petorku `CAMERA · FRAME LAYOUT · FACING · SCREEN DIRECTION · NOT IN FRAME` (shema 2 uz nju
`SUBJECT` i `DETAIL`); end kartica nosi i `TITLE` i `BUTTON`. `animation_prompt` počinje `MOTION BUDGET:`, nosi `PRESERVE`/`FORBID`
linije i prorez po prorez do kraja `gen_len`.

### 4.4 `beats.json` (ulaz za `beatplan.mjs`)

Niz `{ beat_id, sentences[], device, viewer_sees, tags: { location, time_light } }`. Tekst narracije se **ne** upisuje —
`beatplan` ga uvek izvodi iz `timing.json`.

### 4.5 `flow/flow.json`

`{ version, project_url, project_name, shots: { "<shot_id>": { status, prompt_hash, updated_at, error, images: [{ k, media_id, title, name, renamed, file, prompt_hash }] } } }`.
Promena `prompt_hash` = shot se ponovo generiše; `file` je `null` dok se slika ne skine (`--download`).

### 4.6 `medium.json`

`{ video_id, video_url, draft_url, status, medium_url, published_at, … }`; `status` ∈ `drafting · publishing · published · failed`
(+ `attempts`, `error`, `at`, `updated_at`, `update_error`). `published` se nikad ne objavljuje ponovo (`--force`).
`medium.md` nosi `{{VIDEO_URL}}` i `{{THUMBNAIL}}`, koje alat popunjava pri objavi.

### 4.7 `compile.json`

`{ slug, title, protagonists, notes, runs: [{ episode, prefix, from: "S01", to: "S54", visual?, chapter?, tail? }] }` — neprekinut niz
rečenica jednog dela; `prefix` razdvaja kadrove delova u novom storyboard-u.

### 4.8 `short/shorts.json`

`{ "<id>": rez | montaža }`. **Rez:** `{ from, to, crops: { "<shot_id>": 0.5 | [a, b] } }`. **Montaža:** `{ type: "edit",
lines: [{ id, from?, to?, before? }], visuals: [{ shot, at, frame: [[cx, cy, z], …], in? }] }`.

### 4.9 `.cache/assemble.json`

`{ out, size, mtimeMs }` — pečat da je `final.mp4` napravio alat; bez njega se izlaz ne prepisuje bez `--force`/`--out`.
`.cache/seg/NN.json` je recept segmenta (izvor + veličina + vreme izmene, `use_in`, frejmovi, rezolucija, fps, CRF, preset, `recipe.v`).

### 4.10 Generisani/tekstualni „zapisi"

| Dokument | Strukturni kontrakt |
|---|---|
| `publish.md` | 5 naslova (rangirani), description sa chapterima `m:ss`, hashtagovi, pin komentar, `PLAYLISTS` (ime i ID iz `data.js` sajta; `(new)` za plejlistu koja još ne postoji; `added` kad je video u njoj); `publish.mjs` proverava chaptere i `protagonists` u naslovima, a za plejliste samo upozorava |
| `subtitles.srt` | ≤ 42 znaka po redu, ≤ 2 reda, 1–7 s po titlu |
| `medium.md` | front matter `tags:` (3–5, ≤ 25 znakova) → jedan `# Naslov` → prvo thumbnail-link → 1–2 linka ka videu |
| `docs/ideas.md` tabela | `# · naslov · M1…M10 (0–5) · ukupno /100 · pojas · status`; skor = `Σ(težina·ocena)/95·100` |
| `docs/series/greek-gods.md` §4 | registar `locked_description` po delu; mora znak-po-znak da odgovara `episode.json` (ručna provera) |

## 5. Identifikatori i konvencije imena

| Entitet | Konvencija | Primer |
|---|---|---|
| Epizoda | kebab slug = ime foldera | `substitute-king` |
| Deo serije | `<serija>-part-N` | `greek-gods-part-3` |
| Compilation | `<serija>-compilation` | `greek-gods-compilation` |
| Klip | `shots/part<shot_id>.mp4` | `shots/part07.mp4` |
| Still / ingredient | `shots/shot<id>.jpeg` · `images/shot<id>.jpeg` | `shots/shot07.jpeg` |
| Flow kandidat | `shot<id>-<k> <naslov>` | `shot10-2 Figures setting stones in basin` |
| Short | `short<N>` u `short/` | `short/short2.mp4` |
| Medijska isporuka (legacy) | `shotNN.mp4` u korenu epizode | `greek-gods-part-1/shot05.mp4` |

Legacy epizode (4 migrirane) imaju prazne nizove `characters/locations/key_props` i klipove u korenu foldera — to je tačno, ne rupa;
montaža zato uzima putanju iz `source_file`, a imena medija iz `episode.json`.

## 6. Životni ciklus podataka epizode

| Stadijum | Prisutni fajlovi | Prelaz uslovljen |
|---|---|---|
| **Ideja** | red u `ideas.md` (`scored`) | izbor vlasnika |
| **Skripta** | `episode.json`, `research.md`, `script.md` | zamrzavanje skripte |
| **Izmereno** | + `narration.mp3`, `timing.json` | `align.mjs` bez upozorenja koja blokiraju |
| **Skelet** | + `beats.json`, `storyboard.json` (prazni promptovi) | `beatplan --write` |
| **Storyboard** | + popunjeni promptovi, `storyboard.md`, `qa-report.md` | BLOCKING = 0 |
| **Mediji** | + `flow/`, `shots/` | svi klipovi/slike prisutni (nema montaže bez delova) |
| **Montirano** | + `final.mp4`, `qc-report.md`, `.cache/` | `assemble.mjs` |
| **Za objavu** | + `publish.md`, `subtitles.srt`, `thumbnails.md`, `medium.md` | `publish.mjs` prolazi |
| **Javno** | + `medium.json`, `short/` | video u feedu → Medium sam; `status: "done"`; `disk.published` |

## 7. Integritet i migracije

- **Provera integriteta**: `node tools/lint.mjs <epizoda>` (ugovor nad jednom epizodom) i `node tests/check-fixtures.mjs` (ugovor nad fixture-ima).
- **Migracija sheme**: shema 1 → 2 je **po epizodi** i opciona; linter bira pravila po `schema_version`. Nova opciona polja nose podrazumevanu
  vrednost koja opisuje zatečeno stanje (`render_mode` odsutno = `"clip"`).
- **Promena `timing.json`** (novi `align` run) poništava sve nizvodno: `subtitles.srt`, chapteri u `publish.md`, a često i `beats.json`.
- **JSON ↔ `.md` parnjaci** se osvežavaju u istoj sesiji: `storyboard.json` → `lint` + `render` (+ `notes.md` ručno); `timing.json` → `publish.mjs`.
- **Backup**: git čuva tekst; medij (~1.7 GB) nema rezervnu kopiju u repou. `tools/disk.mjs --clean` briše samo regenerabilni `.cache`
  javnih epizoda i ostavlja `asr-words.json` i `assemble.json`.
