# C12 — Skilovi `at-storyboard` / `at-qa` / `at-assemble`

**Faza:** 2 (AI sloj) · **Zavisi od:** C02, C04–C10 (svi alati moraju raditi) · **Procena:** ~110k tokena
**Izvorni plan, sekcije:** „Faza 4 — Skills u Claude Code", „Checkpoint na beat planu", „(d) Skripta je zamrznuta".

⚠ Skilovi dokumentuju **stvarni CLI alata**. Ne piši ih iz plana — piši ih iz koda koji postoji posle C10.

## Isporučuje

```
.claude/skills/at-storyboard/SKILL.md   (~200 linija)
.claude/skills/at-qa/SKILL.md           (~120 linija)
.claude/skills/at-assemble/SKILL.md     (~60 linija)
```

Plus brisanje `docs/visualPromptEngine.md` (njegov sadržaj je sada podeljen između `reference/` i ova dva skila).

## `at-storyboard` — stage 05–06

Ulaz: `script.md` + `narration.mp3`. Tok:

1. `node tools/align.mjs episodes/<slug>` → `timing.json`
2. **Beat plan iz stvarnih tajminga** — grupisanje rečenica u beatove; trajanje beata = zbir, tačan do frejma
3. **⏸ CHECKPOINT — podrazumevano UKLJUČEN**, zastava `--no-review` ga preskače
4. `node tools/timeline.mjs` → sečenje shotova
5. pisanje promptova po template-ima iz `docs/reference/prompt-templates.md`
6. upis `storyboard.json` + `node tools/render.mjs` → `storyboard.md`

### Checkpoint na beat planu — najvažniji deo skila

Beat plan je pravo usko grlo sistema, ne linter. Sve nizvodno se izvodi iz grupisanja rečenica.
Ako je grupisanje pogrešno, matematika je savršena a video je i dalje loš — i to se otkriva tek
posle 30 napisanih promptova.

Skil staje i prikazuje ~12 linija u ovom formatu:

```
B03  [00:41.2–01:04.6]  23.4s  → 3 shota
     NARRATION SAYS: "Under Caesar, Rome prospered as never before…"
     VIEWER SEES:    ANIMATED MAP — granice se šire, trgovačke rute se iscrtavaju,
                     luke se množe duž obale
```

Korisnik odobrava ili prepravlja za ~2 minuta, **i tek onda se piše ijedan prompt.**

### Tvrdo pravilo koje skil mora da nosi eksplicitno

> **Skripta je zamrznuta posle renderovanja narracije.**
> Kad se naiđe na beat koji se teško vizualizuje, prirodni poriv je da se prepravi rečenica —
> ali to poništava `narration.mp3` i `timing.json` i ruši ceo tajmlajn nizvodno.
> **Vizuelni problemi se rešavaju vizuelno.** Izmena skripte znači svesno vraćanje na početak lanca.

## `at-qa` — stage 07

1. `node tools/lint.mjs episodes/<slug>`
2. **Narativni pregled koji linter ne vidi** — besmislice, gubitak fokusa, beat koji ne prati priču
3. **Prepisuje SAMO promptove shotova koji padaju**, nikad ceo storyboard
4. ADVISORY sekcija lint izveštaja je **ulaz** u ovaj sloj — brojevi se tumače u kontekstu priče, ne mehanički
5. `node tools/render.mjs` posle izmena

Skil mora da kaže i šta **nije** njegov posao: R2/R3 nemaju prag i ne traže akciju dok se ne
izmere tri epizode.

## `at-assemble`

1. `node tools/assemble.mjs episodes/<slug> [--dissolve 8]`
2. čita `qc-report.md`
3. **javlja šta treba ponovo generisati pre finalnog reviewa** — pre svega shotove sa <50% iskorišćenja
4. za regeneraciju upućuje na `node tools/shotlist.mjs episodes/<slug> --only NN,NN`

## Zamke

- Skil koji opisuje CLI koji ne postoji je gori od nepostojećeg skila. Svaku komandu **pokreni** dok pišeš.
- `at-storyboard` ne sme sam da menja `script.md`. To je pravilo zamrznute skripte.
- `storyboard.md` se nikad ne piše ručno — samo kroz `render.mjs`. Napiši to u sva tri skila.
- Ne duplirati sadržaj `reference/` fajlova u skilove — skil ih **čita**.

## Verifikacija — definicija gotovog

- `/at-storyboard`, `/at-qa`, `/at-assemble` se pojavljuju u listi skilova nove sesije
- suvi prolaz `at-qa` nad `tests/fixtures/bad-episode` → prepoznaje 4 BLOCKING nalaza i predlaže popravke samo za te shotove
- suvi prolaz `at-assemble` nad `episodes/marathon` → čita `qc-report.md` i imenuje kandidate za regeneraciju
- checkpoint format se ispisuje tačno kako je gore prikazan
- `ls docs/visualPromptEngine.md` → ne postoji

## Tačka preseka ako sesija pređe budžet

`at-storyboard` je 60% posla i najkonsekventniji. Isporuči njega prvog i commituj;
`at-qa` + `at-assemble` mogu u nastavak.
