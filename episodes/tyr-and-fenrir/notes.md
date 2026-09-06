# tyr-and-fenrir — beleške suvog hoda

Epizoda **1 od 3** potrebnih za kalibraciju kvota (C13 → C14 → C15). Kvote se mere, ne nameću —
sve ispod su izmerene vrednosti, ne ciljevi.

## C13 — alignment + beat plan (2026-09-06)

### Alignment

| Podatak | Vrednost |
|---|---|
| model | `small.en` |
| trajanje whisper run-a | 43.5s |
| trajanje narracije | 200.438s |
| rečenica / reči | 50 / 464 |
| poklapanje tokena | 98.7% |
| interpolirane rečenice | **0** (svako vreme izmereno, nijedno pogođeno) |
| gapovi > 1.5s | 2 — posle S07 (1.700s) i S43 (1.540s) |
| rečenice ispod `confidence 0.85` | 3 — S15 (0.743), S31 (0.666), S39 (0.831) |
| `outro_start` | 182.060s |

Rerun sa `medium.en` **nije** pokrenut: 3/50 ispod praga je 6% i sve tri su kratke linije sa
vlastitim imenima, a poklapanje tokena je 98.7%. Oba gapa su dramske pauze, ne greške rendera.

### Beat plan

| Podatak | Vrednost |
|---|---|
| beatova / shotova | 18 / 27 |
| beatova ručno prepravljenih na checkpointu | **0** (plan odobren iz prve) |
| trajanje beata | min 6.18s · prosek 11.14s · max 18.38s |
| shotova po beatu | 1 shot ×9 · 2 shota ×9 · 3 shota ×0 |

### Distribucija `use_len` — prvi stvarni podatak o splitteru

| Opseg | Shotova | Udeo |
|---|---|---|
| 3–5s | 2 | 7% |
| 5–7s | 9 | 33% |
| **7–9s (ciljni)** | **11** | **41%** |
| 9–10s | 5 | 19% |

prosek 7.424s · medijana 7.541s · min 3.708s · max 9.584s

Ciljni opseg hvata 41% shotova. Rano je za zaključak sa jedne epizode, ali smer je vidljiv:
gubitak je uglavnom nadole (40% ispod 7s), i to na beatovima od ~6–7s koji daju jedan kratak
shot jer ih deljenje na dva probija `minShot`.

### Uređaji

| Uređaj | Beatova |
|---|---|
| `null` (doslovno) | 7 |
| `macro-object` | 3 |
| `silhouette` | 2 |
| `timeline-seasons` | 2 |
| `empty-aftermath` | 2 |
| `process-cutaway` | 1 |
| `ledger-accumulation` | 1 |

11 od 18 beatova nosi uređaj. Konkretni su svi u srednjem delu (B10–B14, sam čin vezivanja) —
tamo se radnja vidi doslovno i uređaj bi je samo zaklonio.

### Upozorenja splittera — 4

| Kod | Gde | Napomena |
|---|---|---|
| `intra-sentence-cut` | B02 @ 16.833s (S05) | rečenica traje 13.1s |
| `intra-sentence-cut` | B09 @ 92.042s (S22) | rečenica traje 12.2s |
| `intra-sentence-cut` | B18 @ 191.375s (S49) | rečenica traje 7.1s |
| `tail-absorbed` | B18 @ 199.96s | 0.478s repa pripojeno poslednjem shotu |

Sva tri reza unutar rečenice su neizbežna i benigna: rečenice su duže nego što jedan shot sme
da bude, pa nijedna podela po granicama rečenica ne staje u 3–10s. Sva tri padaju na **granicu
reči** — nijedan `blind-cut`, dakle nijedna tačka reza nije pogođena.

### Verifikacija C13

| Uslov | Rezultat |
|---|---|
| `timing.json` postoji, zbir ≈ trajanje narracije ±0.3s | ✓ |
| nijedan gap > 1.5s | ✗ 2 gapa (1.700s, 1.540s) — dramske pauze, ne greška |
| beat plan odobren od korisnika | ✓ |
| `sum(use_len)` = trajanje narracije ±0.2s (T1) | ✓ 200.458s vs 200.438s, drift 0.020s |
| svaki `use_len` u [3.0, 10.0] | ✓ 3.708–9.584 |
| udeo u ciljnom opsegu 7–9s zabeležen | ✓ 41% |
| `outro_start` postavljen | ✓ 182.060s |
| broj upozorenja zabeležen | ✓ 4 |

`lint.mjs --no-media` nad skeletom: **211 BLOCKING**, svi T3/S2/P1/P2 — dakle prazni promptovi
i ništa drugo. Nijedan nalaz iz vremenskog sloja (T1/T2), što je i poenta: skelet je vidljivo
nedovršen, ali matematika tajmlajna već drži.

## Odstupanja i odluke iz ove sesije

**1. Rep narracije — zatvorena otvorena stavka iz C04.** `planTimeline` je apsorbovao tišinu na
početku tajmlajna, a na kraju nije; ova epizoda je prva koja je na to naletela (0.478s repa, T1
bi pao). Rešeno simetrično: poslednji beat se sada završava na `timing.duration`. Puna odluka je
u `schemas.md` §5.12, promena je u `tools/timeline.mjs`.

**2. `script.md` je stigao bez `## OUTRO` naslova**, pa je `outro_start` bio `null` i end card
ne bi imao odakle da krene. Naslov je umetnut ispred poslednjeg pasusa, pošto je dokazano da je
tekstualno neutralan: `parseScript()` vraća istih 50 rečenica sa identičnim tekstom i `id`-jevima
pre i posle, menja se samo `outro_start` (`null` → 182.060s). Narracija i `timing.json` nisu
dirani. **Za sledeću epizodu: `## OUTRO` mora da stigne u isporuci** (C13, preduslovi).

**3. `research.md` nije isporučen.** Deset `locked_description`-a u `episode.json` izvedeno je iz
skripte i nordijske tradicije. Svi prolaze 25–40 reči po `countWords`, `id`-jevi su jedinstveni,
bez tačke na kraju — ali ih vredi pročitati pre C14, jer ih C14 prepisuje **doslovno** u svaki
prompt (C1).

**4. `endcard_file` još ne postoji** u folderu epizode. Nije potreban sada; obavezan pre C15.
