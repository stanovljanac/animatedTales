# Animated Tales — razbijen plan izvođenja

Izvorni plan: `C:\Users\Mihailo\.claude\plans\dakle-goal-je-da-keen-pillow.md` (402 linije).
Ovaj folder ga deli na **15 celina**, svaka projektovana da stane u jednu sesiju od 150k–200k tokena.

## Kako se pokreće jedna celina

Svaka sesija počinje sa:

```
Implementiraj celinu CNN iz docs/plan/CNN-<ime>.md.
Izvorni plan je C:\Users\Mihailo\.claude\plans\dakle-goal-je-da-keen-pillow.md — pročitaj sekcije koje celina navodi.
```

Fajl celine je ugovor: šta ulazi, šta izlazi, kako se verifikuje. Ako sesija pređe ~150k tokena
pre nego što stigne do verifikacije, staje na najbližoj tački preseka koju fajl navodi
i predaje ostatak sledećoj sesiji.

## Redosled i zavisnosti

| # | Celina | Faza | Zavisi od | Procena |
|---|---|---|---|---|
| C01 | [Skelet, migracija, data ugovori](C01-skelet-migracija-sheme.md) | 0 — temelji | — | ~80k |
| C02 | [Kreativni ugovori (reference/)](C02-kreativni-ugovori.md) | 0 — temelji | C01 | ~100k |
| C03 | [Rubrika + bodovanje ideja](C03-rubrika-i-ideje.md) | 0 — temelji | C01 | ~85k |
| C04 | [ffmpeg.mjs + timeline.mjs](C04-ffmpeg-i-timeline.md) | 1 — alati | C01 | ~140k |
| C05 | [align.mjs (forced alignment)](C05-align.md) | 1 — alati | C04 | ~160k |
| C06 | [lint.mjs — BLOCKING sloj](C06-lint-blocking.md) | 1 — alati | C01, C02, C04 | ~130k |
| C07 | [lint.mjs — ADVISORY sloj](C07-lint-advisory.md) | 1 — alati | C06 | ~100k |
| C08 | [render.mjs + shotlist.mjs](C08-render-i-shotlist.md) | 1 — alati | C01, C06 | ~100k |
| C09 | [assemble.mjs — jezgro](C09-assemble-jezgro.md) | 1 — alati | C04, C06 | ~150k |
| C10 | [assemble.mjs — dissolve + qc-report](C10-assemble-dissolve-qc.md) | 1 — alati | C09 | ~90k |
| C11 | [Prepisivanje promptova 01/03/04](C11-promptovi.md) | 2 — AI sloj | C02 | ~140k |
| C12 | [Skills at-storyboard / at-qa / at-assemble](C12-skills.md) | 2 — AI sloj | C02, C04–C10 | ~110k |
| C13 | [Suvi hod A — alignment + beat plan](C13-suvi-hod-a.md) | 3 — validacija | C05, C12 | ~90k |
| C14 | [Suvi hod B — storyboard + QA](C14-suvi-hod-b.md) | 3 — validacija | C13 | ~180k |
| C15 | [Suvi hod C — montaža + review](C15-suvi-hod-c.md) | 3 — validacija | C14, C10 | ~80k |

**Kritični put:** C01 → C04 → C05 → C06 → C09 → C12 → C13 → C14 → C15.
**Nezavisno, može bilo kad:** C02, C03, C11 (C11 traži C02).
**Tvrdo pravilo iz izvornog plana:** faza 2 (C11–C12) se ne dira dok cela faza 1 (C04–C10) ne radi 100% pouzdano.

## Odstupanja od izvornog plana (provereno u okruženju, 2026-09-04)

Ovo su činjenice zatečene na disku koje izvorni plan nije imao. Svaka je upisana u celinu koje se tiče.

1. **`ffprobe` ne postoji.** `imageio_ffmpeg` isporučuje isključivo
   `C:\Python311\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe`.
   Na PATH-u nema ni `ffmpeg` ni `ffprobe`. `probe()` mora da parsira stderr od `ffmpeg -i`. → **C04**
2. **`storyboard.json` shema nije nigde specificirana**, a konzumiraju je `lint`, `render`, `shotlist`,
   `assemble` i oba skila. Postaje eksplicitan artefakt (`docs/reference/schemas.md`). → **C01**
3. **Nema git repozitorijuma**, a folder je 1.7 GB (uglavnom mp4). `git init` + `.gitignore` koji
   izbacuje medije, inače je svaki commit neupotrebljiv. → **C01**
4. **`narration.mp3` ima `start: 0.025057`** (Rome). Nije nula — mora se svesno odlučiti da li se
   oduzima pri alignmentu i pri lepljenju audia. → **C05**, **C09**
5. **`ideas.md` ima 30 ideja u 3 kategorije, ali samo 2 nose oznaku `DONE`** — a gotove su 4 epizode.
   Status se mora uskladiti sa `episodes/`. → **C03**
6. **Algoritam sečenja beata ima nepokrivenu ivicu:** beat od npr. 30.5s sa svega 2 rečenice
   (14s + 16.5s) ne može da poštuje i „max 10s po shotu" i „rez pada na granicu rečenice".
   Ponašanje mora biti definisano. → **C04**
7. **R4 (n-gram ponavljanje) sudara se sa C1 (doslovno kopiranje `locked_description`).**
   C1 *zahteva* identičan blok od 25–40 reči u svakom shotu; R4 kažnjava >12 identičnih reči.
   R4 mora da izuzme `locked_description` i kanonski style string. → **C07**

## Verifikacije iz izvornog plana → gde su

| Izvorna verifikacija | Celina |
|---|---|
| 1. ffmpeg wrapper / `probe()` na `part1.mp4` | C04 |
| 2. `align.mjs` na Rome narraciji | C05 |
| 3. `timeline.mjs` unit testovi | C04 |
| 4. `lint.mjs` na lošem fixture-u — BLOCKING | C06 |
| 4. `lint.mjs` — ADVISORY + kontra-test | C07 |
| 5. `assemble.mjs` end-to-end na Marathonu | C09 (+ drift sa dissolve u C10) |
| 6. Suvi hod na novoj epizodi | C13–C15 |

## Van scope-a — ni u jednoj celini, svesno

Ako se pojavi poriv da se ovo doda usput, odgovor je ne. Iz izvornog plana:

- **Muzika, SFX, titlovi** — izabran je čist `final.mp4`. Lako se dodaje kasnije jer `assemble.mjs` već ima audio granu.
- **Automatsko generisanje u Google Flow** — Flow nema javni API; generisanje ostaje ručno.
- **Upscale na 1440p** — ostaje ručno; `--res` zastava je pripremljena u C09.
- **Automatski tambnejl i naslov** — zaseban problem; rubrika iz C03 već meri taj potencijal na nivou ideje.

„Kasnije nadogradnje" iz izvornog plana (biblioteka likova, retention-marker pass, auto-thumbnail,
A/B outro tracking) otključavaju se **tek posle C15** — tvrdo pravilo: nijedan novi feature dok
jedna epizoda ne prođe ceo lanac od `narration.mp3` do `final.mp4`.

## Status

Svaka celina ima kućicu ovde. Ažurira se na kraju sesije.

- [x] C01  - [x] C02  - [x] C03  - [ ] C04  - [ ] C05
- [ ] C06  - [ ] C07  - [ ] C08  - [ ] C09  - [ ] C10
- [ ] C11  - [ ] C12  - [ ] C13  - [ ] C14  - [ ] C15
