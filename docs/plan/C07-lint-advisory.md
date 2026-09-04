# C07 — `tools/lint.mjs`, ADVISORY sloj

**Faza:** 1 (deterministički alati) · **Zavisi od:** C06 · **Procena:** ~100k tokena
**Izvorni plan, sekcije:** ADVISORY tabela, „Šest osa za R1", „Zašto R2/R3 nemaju prag", „Verifikacija 4".

## Cilj

Kreativni signali koji se **mere i prikazuju, a nikad ne blokiraju**. Ovaj sloj ne sme da promeni
exit code. Ulaz je za `at-qa` sloj i za tebe — brojevi se tumače u kontekstu priče, ne mehanički.

Vodeće načelo iz izvornog plana: *šumni linter koji stalno laje naučiš da ignorišeš.*
Zato R2/R3 **nemaju prag** dok ne postoje podaci iz 3 epizode.

## ADVISORY signali

| # | Signal | Ponašanje |
|---|---|---|
| R1 | **pravilo razlike** — uzastopni shotovi dele previše osa | flag na ≤1 različitu osu; **eskalacija** kad 3+ uzastopna shota dele `subject_type` + `location` + `time_light`; **linked shotovi unutar istog beata su izuzeti** |
| R2 | miks tipova shotova | **samo meri i prikaži**, bez praga: *„22 shota: 18 karakternih, 4 ambijentalna, 0 mapa/dijagrama"* |
| R3 | upotrebljeni vizuelni uređaji | **samo izlistaj**: *„korišćeni uređaji: SILHOUETTE ×1"* |
| R4 | ponavljanje n-grama između promptova | >12 uzastopnih identičnih reči |
| C2 | broj multi-visual klipova | prikaz broja |

Šest osa za R1 (dolaze kao `tags` iz `storyboard.json`, C01):
`subject_type` · `shot_size` · `angle` · `location` · `time_light` · `camera_motion`

## ⚠ Sudar koji izvorni plan nema — R4 protiv C1

**C1 (BLOCKING) *zahteva* da se `locked_description` od 25–40 reči kopira doslovno u svaki shot
gde se lik pojavljuje. R4 kažnjava >12 uzastopnih identičnih reči.**
Bez izuzetka, R4 bi lajao na svaki ispravan storyboard.

Rešenje: pre R4 provere, iz oba prompta **iseci** (a) svaki `locked_description` iz `episode.json`
i (b) kanonski style string iz `docs/reference/style-string.md`. N-gram se meri nad ostatkom.
Zapiši ovo kao komentar u kodu i kao red u `qa-report.md` legendi.

## Isporučuje

- ADVISORY sloj u `tools/lint.mjs` (popunjava sekciju koju je C06 ostavio praznu)
- `tests/fixtures/storyboard.repetitive.json` — 4 uzastopna shota istog `subject_type`+`location`+`time_light`
- `tests/fixtures/storyboard.linked.json` — 3 linked shota istog beata koji dele lokaciju i svetlo
- `tests/lint-advisory.test.mjs`

## Verifikacija — definicija gotovog (izvorna verifikacija 4, ADVISORY deo)

| Slučaj | Očekivano |
|---|---|
| 4 uzastopna shota istog `subject_type`+`location`+`time_light` | **R1 eskalacija** se javlja |
| 3 linked shota istog beata koji dele lokaciju i svetlo | **R1 se NE javlja** (kontra-test iz plana) |
| bilo koji storyboard | R2 ispisuje miks bez suda o njemu |
| bilo koji storyboard | R3 ispisuje listu uređaja |
| dva prompta sa 13 identičnih reči van `locked_description` | R4 se javlja |
| dva prompta koja dele samo `locked_description` i style string | **R4 se NE javlja** |
| bilo koji ADVISORY nalaz | `echo $?` = **0** — exit code se ne menja |

```bash
node tools/lint.mjs tests/fixtures/repetitive-episode ; echo "exit=$?"   # exit=0, R1 eskalacija u izveštaju
node tools/lint.mjs tests/fixtures/linked-episode ; echo "exit=$?"       # exit=0, bez R1
node --test tests/
```

## Zamke

- Ne uvoditi pragove za R2/R3 „da bude korisnije". Plan eksplicitno kaže: **meri 3 epizode, pa kalibriši.**
  Brojevi „25% ne-karakternih" i „≥2 uređaja" su bili procena bez podataka.
- R1 poredi `location` i `time_light` na jednakost — zato su slug-ovi, ne slobodan tekst (C01).
- ADVISORY sekcija mora ostati čitljiva i kad ima 30 signala. Grupiši po kodu, ne po shotu.

## Tačka preseka ako sesija pređe budžet

R1 (sa eskalacijom i izuzećem) je pola posla i najsloženiji deo. R2/R3/R4/C2 su merači i idu brzo —
mogu u nastavak.
