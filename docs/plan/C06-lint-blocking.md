# C06 — `tools/lint.mjs`, BLOCKING sloj

**Faza:** 1 (deterministički alati) · **Zavisi od:** C01 (shema), C02 (prompt-templates), C04 (`probe`) · **Procena:** ~130k tokena
**Izvorni plan, sekcije:** „lint.mjs — deterministički QA", BLOCKING tabela, „Verifikacija 4".

## Cilj

Linter koji je **autoritet za tehničku ispravnost** — i ništa više. Deset provera, sve determinističke,
sve sa jednoznačnim odgovorom da/ne. ADVISORY sloj je zasebna celina (C07) i ovde se **ne dira**;
samo ostavi mesto za njegovu sekciju u izveštaju.

```
node tools/lint.mjs episodes/<slug>
```

Izlaz: `episodes/<slug>/qa-report.md` sa **dve strogo odvojene sekcije**. Exit code 1 ako ima ijedan BLOCKING nalaz.

## BLOCKING provere — verbatim iz izvornog plana

| # | Provera | Prag |
|---|---|---|
| T1 | pokrivenost tajmlajna: gapovi / preklapanja / `sum(use)` vs trajanje narracije | ±0.2s |
| T2 | `use_len` u granicama | 3.0–10.0s |
| T3 | `motion_budget` prisutan kad `use_len < 9.0` | — |
| S1 | zabranjene prostorne fraze bez screen-position klauzule | — |
| S2 | obavezni blokovi u image promptu: `CAMERA`, `FRAME LAYOUT`, `FACING`, `SCREEN DIRECTION`, `NOT IN FRAME` | — |
| S3 | reči koje impliciraju rez unutar klipa: `then`, `later`, `afterwards`, `cuts to`, `meanwhile` (u animation promptu) | — |
| P1 | dužina image prompta | 90–160 reči |
| P2 | dužina animation prompta | 60–100 reči |
| C1 | `locked_description` iz `episode.json` prisutan **doslovno** u svakom shotu gde lik učestvuje | — |
| F1 | svaki shot ima svoj `shots/partNN.mp4`, izvor ≥ `use_out` | — |

## Isporučuje

- `tools/lint.mjs` — BLOCKING sloj + skelet izveštaja (obe sekcije, ADVISORY prazna sa napomenom „C07")
- `tests/fixtures/storyboard.bad.json` — namerno loš, obara tačno određene provere (dole)
- `tests/fixtures/storyboard.good.json` — prolazi sve; koristi izbrojane primere promptova iz C02
- `tests/lint-blocking.test.mjs`

## Odluke koje moraju biti donete

- **S1 nije prosto grep.** Zabranjena fraza je dozvoljena **ako je u istoj rečenici screen-position
  klauzula**. Obe liste (zabranjene fraze / screen-position tokeni) dolaze iz
  `docs/reference/camera-language.md` — **čitaj ih odatle, ne hardkoduj u lint.mjs.**
  Tako se pravilo menja na jednom mestu.
- **P1/P2 brojanje reči** mora tačno pratiti definiciju iz `docs/reference/schemas.md` (C01):
  da li se `CAMERA:` i ostale oznake blokova broje. Ako C01 to nije rešio — reši sada i **upiši nazad u schemas.md**.
- **C1 „doslovno"** — normalizovati whitespace pre poređenja, ali ne i interpunkciju.
- **F1 traži `probe()`** iz C04. `use_out` se poredi sa stvarnim trajanjem fajla, uz toleranciju od 1 frejma.
- **T1** poredi `sum(use_len)` sa `narration_duration` iz `storyboard.json`, koje dolazi iz `timing.json`.

## Format izveštaja

```markdown
# QA report — <slug>
Generated: <ts> · storyboard: <N> beatova, <M> shotova

## BLOCKING  (<k> nalaza)
- [T2] shot 07: use_len 1.2s — izvan granica 3.0–10.0
- [S2] shot 12: image prompt nema blok FACING
...

## ADVISORY  (<k> signala)
(implementira C07)
```

Nalaz uvek nosi: kod provere · shot/beat id · izmerenu vrednost · očekivanu vrednost.
Bez izmerene vrednosti izveštaj je beskoristan za popravku.

## Verifikacija — definicija gotovog (izvorna verifikacija 4, BLOCKING deo)

`storyboard.bad.json` mora da obori **tačno ove** provere:

| Provera | Kako je izazvana u fixture-u |
|---|---|
| S1 | rečenica *„soldiers march out of the fortress in the background"* |
| S2 | image prompt bez bloka `FACING` |
| T2 | shot sa `use_len` 1.2s |
| C1 | shot sa likom, ali bez njegovog `locked_description` |

```bash
node tools/lint.mjs tests/fixtures/bad-episode   # exit 1, 4 očekivana nalaza
node tools/lint.mjs tests/fixtures/good-episode  # exit 0, 0 BLOCKING nalaza
node --test tests/
```

Dodatno: **nijedan lažni pozitiv na dobrom fixture-u.** Ako dobar prompt iz C02 obori P1 ili S1,
greška je u linteru ili u template-u — ne u fixture-u.

## Tačka preseka ako sesija pređe budžet

T1–T3 + F1 (numeričke, brze) su jedna polovina; S1–S3 + P1–P2 + C1 (tekstualne, sa listama iz
`camera-language.md`) druga. Fixture-i idu sa prvom polovinom.
