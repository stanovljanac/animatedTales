# C15 — Suvi hod C: montaža + finalni review

**Faza:** 3 (validacija) · **Zavisi od:** C14 (+ tvoje generisanje u Flow-u), C10 · **Procena:** ~80k tokena
**Izvorni plan, sekcije:** „assemble.mjs", „Verifikacija 6", „Redosled izvođenja" — poslednja tačka.

Poslednja sesija prve epizode kroz novi lanac. Posle nje se donosi odluka da li sistem ostaje.

## Preduslov

Svi `episodes/<slug>/shots/partNN.mp4` generisani u Flow-u, plus `endcard.jpeg`.

## Zadatak sesije

1. `node tools/assemble.mjs episodes/<slug> --dissolve 8`
2. Pročitaj `qc-report.md`
3. Javi šta treba regenerisati — pre svega shotove sa **<50%** iskorišćenja generisanog klipa
4. Posle tvoje zamene `partNN.mp4`: ponovo pokreni `assemble.mjs` (idempotentan je)
5. Finalni kreativni review — **tvoj deo**, i jedini koji je i trebalo da ostane ručan

## Verifikacija — definicija gotovog

```bash
node -e "import('./tools/ffmpeg.mjs').then(async m => console.log(await m.probe('episodes/<slug>/final.mp4')))"
cat episodes/<slug>/qc-report.md
```

- `final.mp4` traje koliko i narracija + end card rep, **drift < 0.2s**
- jedan audio stream, 1920×1080 @ 24fps, yuv420p
- `qc-report.md` bez ERROR-a
- **gledanje cele epizode** — jedini test koji hvata ono što nijedan linter ne vidi

## Poređenje sa starim postupkom — svrha cele Faze 3

Izvorni plan traži: *„poređenje utrošenog vremena i broja shotova koje si morao ručno da popravljaš
u odnosu na `NightWhenRomeAlmostFell`."*

Upiši u `docs/plan/RETROSPEKTIVA.md`:

| Metrika | Stari postupak (Rome) | Novi lanac |
|---|---|---|
| Ukupno tvoje vreme | | |
| Vreme na ručno krojenje u 123apps | ~37s krojenja / sati provere | **0** (očekivano) |
| Shotova ručno prepravljano posle generisanja | | |
| Shotova regenerisano zbog pogrešnog kadra | | |
| Scena koje se seku unutar klipa | | |
| Likova koji se redizajniraju između shotova | | |
| Drift video ↔ narracija | ručno po sluhu | izmereno |

Plus zbirni podaci iz `notes.md` (C13 + C14) — to je **epizoda 1 od 3** potrebne za kalibraciju
R2/R3 pragova.

## Tvrdo pravilo iz izvornog plana

> **Nijedan novi feature se ne dodaje dok jedna epizoda ne prođe ceo lanac od `narration.mp3` do `final.mp4`.**

Kad ova sesija prođe — to je tačka gde se otključava lista „Kasnije nadogradnje" iz izvornog plana
(biblioteka likova, retention-marker pass, auto-thumbnail kandidati, A/B outro tracking).

## Zamke

- Ne prepravljati `assemble.mjs` „u letu" ako nešto ne valja. Ako alat ima bug — to je povratak u C09/C10
  sa testom koji ga hvata, ne zakrpa u produkcionoj sesiji.
- Ne prihvatati drift „jer se ne primećuje". Ceo smisao timeline-first pristupa je da je drift merena nula.
- `--dissolve 8` je opcija, ne obaveza. Ako prelazi izgledaju loše, hard cut je legitiman izbor.
