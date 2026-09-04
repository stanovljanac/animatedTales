# C14 — Suvi hod B: promptovi + QA

**Faza:** 3 (validacija) · **Zavisi od:** C13 · **Procena:** ~180k tokena ⚠ **najveća celina — pratiti budžet**
**Izvorni plan, sekcije:** „2c. Template-i", „at-qa", „Verifikacija 6".

## Cilj

Napisati oba prompta za svaki shot iz C13, provući kroz linter, popraviti sve BLOCKING nalaze,
protumačiti ADVISORY, i izbaciti produkcionu listu za Flow.

## ⚠ Budžet — ovo je jedina celina koja realno može da pređe 200k

30 shotova × (image ~130 reči + animation ~80 reči) ≈ 6.300 reči čistog izlaza,
plus razmišljanje po shotu, plus krugovi popravki posle lintera.

**Obavezno praćenje:** posle svakog **bloka od 10 shotova** upiši `storyboard.json` i commituj.
Ako posle 20 shotova pređeš ~140k — stani, commituj, ostatak u nastavak sesije.
Prekid po bloku je bezbolan jer je `storyboard.json` jedini izvor istine.

## Zadatak sesije

1. Za svaki shot napiši `image_prompt` i `animation_prompt` po `docs/reference/prompt-templates.md`.
2. Popuni `tags` (svih šest osa) — one nose R1 proveru, pa moraju biti iskrene, ne dekorativne.
3. Popuni `characters[]` po shotu i **doslovno prekopiraj** `locked_description` iz `episode.json`
   u svaki prompt gde lik učestvuje (C1 to proverava).
4. `MOTION BUDGET: key motion completes within <use_len>s` — obavezno kad `use_len < 9.0`.
   Bez toga Veo raspoređuje pokret preko celih 10s i dobiješ pola akcije.
5. `node tools/lint.mjs episodes/<slug>` — popravi **sve** BLOCKING.
6. ADVISORY protumači kroz `at-qa`: R1 eskalacije razmotri jednu po jednu, R2/R3 samo zabeleži.
7. `node tools/render.mjs` → `storyboard.md`
8. `node tools/shotlist.mjs episodes/<slug>` → produkciona lista za Flow

## Posle sesije — tvoj ručni deo

Generisanje u Google Flow po `shotlist` izlazu:

- sačuvaj slike kao `episodes/<slug>/images/shotNN.jpeg`
- sačuvaj klipove kao `episodes/<slug>/shots/partNN.mp4`
- za odbačene shotove: `node tools/shotlist.mjs episodes/<slug> --only 07,12` daje samo te promptove

## Verifikacija — definicija gotovog

```bash
node tools/lint.mjs episodes/<slug> ; echo "exit=$?"    # exit=0 → nula BLOCKING
node tools/render.mjs episodes/<slug>
node tools/shotlist.mjs episodes/<slug> | head -60
```

- **nula BLOCKING nalaza**
- svaki image prompt 90–160 reči, svaki animation 60–100 (P1/P2 to proveravaju, ali pogledaj i sam)
- svaki shot sa `use_len < 9.0` ima `MOTION BUDGET` sa **tačnim** brojem
- ADVISORY pročitan i **odlučeno** po svakoj R1 eskalaciji (popraviti ili svesno propustiti — i zapisati koje)
- `storyboard.md` čitljiv bez otvaranja JSON-a
- `shotlist` izlaz kopira se u Flow bez ručnog doterivanja

## Podaci za kalibraciju (nastavak iz C13)

Dopuni `episodes/<slug>/notes.md`:

- koliko je BLOCKING nalaza bilo u **prvom** prolazu lintera, po kodu (T1/S1/S2/P1/P2/C1…)
- koliko R1 eskalacija i koliko si ih stvarno popravio
- R2 miks: koliko karakternih / ambijentalnih / mapa-dijagrama
- R3: koji uređaji su korišćeni i koliko puta
- koliko shotova si prepravljao ručno posle lintera

Ovo su podaci koji posle treće epizode odlučuju da li R2/R3 uopšte treba da dobiju prag.

## Zamke

- **Ne prepravljati `script.md`.** Zamrznuta je od C13.
- Ne popravljati ADVISORY nalaze mehanički. R1 na 3 linked shota istog beata je **očekivan i ispravan** —
  ako se javi, greška je u linteru (C07), ne u storyboardu.
- Ne pisati promptove „u paketu" bez gledanja u `NARRATION SAYS` / `VIEWER SEES` — to je tačno ona
  greška zbog koje su scene bile prezalepljene za imenice iz narracije.
- Ne štampati ceo `storyboard.json` u konzolu radi provere. Koristi `render.mjs`.

## Tačke preseka

Blokovi od 10 shotova. Svaki blok: napiši → upiši JSON → commituj.
Linter (5–8) može u zasebnu sesiju ako promptovi pojedu budžet.
