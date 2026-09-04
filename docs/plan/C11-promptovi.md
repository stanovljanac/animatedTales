# C11 — Prepisivanje promptova 01 / 03 / 04

**Faza:** 2 (AI sloj) · **Zavisi od:** C02 · **Procena:** ~140k tokena
**Izvorni plan, sekcije:** „Faza 2 — Prepisivanje promptova" (tabela), „2e. Automatski outro".

⚠ **Ne počinji ovu celinu dok cela Faza 1 (C04–C10) ne radi pouzdano.** To je tvrdo pravilo iz izvornog plana.

## Cilj

Tri paste-in-ChatGPT prompta, svaki **samodovoljan za jedan svež chat**, nijedan preko ~200 linija.
`masterPrompt.md` se penzioniše.

| Fajl | Sada | Cilj |
|---|---|---|
| `docs/ideaDiscovery.md` → `docs/prompts/01-idea-discovery.md` | 762 | ~120 |
| `docs/researchAndStoryPlanner.md` → `docs/prompts/03-research.md` | 433 | ~150 |
| `docs/storyWritter.md` → `docs/prompts/04-script.md` | 939 | ~180 |
| `docs/masterPrompt.md` | 896 | **obrisan** |
| `docs/visualPromptEngine.md` | 1672 | **obrisan** — zamenjuju ga skilovi (C12) |

Ukupno **4250 → ~1000 linija**, nula duplikata između fajlova.

## Ključne izmene po fajlu

### `01-idea-discovery.md` (~120 linija)

Uklonjene liste-nabrajalice (one troše pažnju modela pre nego što zadatak počne).
Scoring **izmešten u `docs/reference/scoring-rubric.md`** (C03) — prompt samo upućuje na njega,
jer bodovanje ionako radiš lokalno.

### `03-research.md` (~150 linija)

**Zadržan output ugovor** (to je jedini deo koji nizvodni koraci stvarno konzumiraju),
sažeta proza svuda ostalo.

### `04-script.md` (~180 linija) — najveći posao

Sažimanje + **novi obavezan izlazni odeljak `## OUTRO`**, po formuli:

> **[tematski most izveden iz teme OVE epizode] + [poziv koji imenuje kategoriju priča] + [like/subscribe to Animated Tales] + [odjava]**

Pravila outro-a:

- 18–28 reči (~7–10s narracije)
- mora da reciklira **centralnu imenicu same epizode**
- zabranjene generičke fraze („history is fascinating")
- izlaz kao **3 varijante** da biraš

Referentni uzorak koji formula mora tačno da reprodukuje:

> *„History is full of moments where everything almost changed in a single night. If you want to explore more forgotten stories and turning points like this, leave a like and subscribe to Animated Tales. Until next time."*

`## OUTRO` je i **mašinski ugovor**: `align.mjs` (C05) traži tu sekciju da bi postavio `outro_start`,
a `assemble.mjs` (C09) na osnovu njega drži end card. Naziv sekcije mora biti tačno `## OUTRO`.

## Zamke

- **Nema numeracije 02.** Stage 02 je ručni korak (izbor ideje iz bodovane tabele). Zadrži rupu — jasnija je nego renumeracija.
- **Nula duplikata sa `docs/reference/`.** Umesto prepisivanja identiteta kanala, prompt kaže:
  *„zalepi i `docs/reference/channel-bible.md`"*. To je razlog zašto C02 ide pre ove celine.
- Ne brisati `masterPrompt.md` i `visualPromptEngine.md` **dok** njihov jedinstveni sadržaj nije potvrđen
  u `reference/` (C02) i skilovima (C12). Za `visualPromptEngine.md` to znači: **briše se tek posle C12**,
  ne ovde. U ovoj celini ga samo označi kao `DEPRECATED` u prvoj liniji.
- Sažimanje nije skraćivanje. Prođi original i za svaki pasus odluči: jedinstven → ostaje;
  duplikat → briše se; nabrajanje → sažima u pravilo.

## Verifikacija — definicija gotovog

```bash
wc -l docs/prompts/*.md docs/reference/*.md
# svaki fajl < 200 linija; zbir prompts/ + reference/ ≈ 1000
ls docs/masterPrompt.md 2>&1        # ne postoji
head -1 docs/visualPromptEngine.md  # DEPRECATED oznaka
```

- **Test outro formule:** primeni je na Rome epizodu i potvrdi da reprodukuje referentni uzorak.
- Svaki od tri prompta pročitaj kao da si model koji ga vidi prvi put: da li može da uradi zadatak
  bez ijednog dodatnog fajla osim onih koje eksplicitno traži da zalepiš?
- `grep` provera: nijedan pasus od 12+ reči se ne pojavljuje u dva fajla.

## Tačka preseka ako sesija pređe budžet

`01` + `03` su jedna polovina, `04` + outro formula druga (i teža).
Ako posle `03-research.md` pređeš ~120k — stani, commituj, `04-script.md` u zasebnu sesiju.
