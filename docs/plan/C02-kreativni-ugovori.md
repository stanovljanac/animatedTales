# C02 — Kreativni ugovori (`docs/reference/`)

**Faza:** 0 (temelji) · **Zavisi od:** C01 (folderi) · **Procena:** ~100k tokena
**Izvorni plan, sekcije:** „2a. Kamera-jezik", „2b. Katalog vizuelnih uređaja", „2c. Template-i promptova".

## Cilj

Napisati pet kratkih referentnih fajlova koje od sada uključuju i ChatGPT promptovi i lokalni skilovi.
Ovo je istovremeno **mašinski ugovor**: lint provere S1/S2/P1/P2 nisu ništa drugo nego automatska
provera onoga što se ovde zapiše. Ako se imena blokova ovde promene, linter puca.

## Čita

- `docs/masterPrompt.md` (896 linija) — izvlači se **samo** identitet kanala, runtime, integritet, hard reset
- `docs/visualPromptEngine.md` (1672 linije) — izvlači se kanonski style string, rečnik kamere, postojeći template-i

Oba fajla su ~70% međusobni duplikat. Čitaš ih da ekstrahuješ, ne da ih prepišeš.

## Isporučuje

| Fajl | Ciljna dužina | Sadržaj |
|---|---|---|
| `docs/reference/channel-bible.md` | ~60 linija | identitet kanala, ciljni runtime, pravila istorijskog integriteta, hard-reset pravilo — jedini preživeli deo `masterPrompt.md` |
| `docs/reference/style-string.md` | ~40 linija | **jedan** kanonski style string koji se doslovno kopira u svaki image prompt + zabranjeni stilski dodaci |
| `docs/reference/camera-language.md` | ~130 linija | pet obaveznih blokova + tri tvrda pravila + primeri |
| `docs/reference/visual-devices.md` | ~150 linija | 9 uređaja + kad se koji bira + `NARRATION SAYS / VIEWER SEES` pravilo |
| `docs/reference/prompt-templates.md` | ~120 linija | image template (90–160 reči) + animation template (60–100 reči) |

### `camera-language.md` — obavezan sadržaj

Pet blokova, **imena tačno ovako** (linter S2 traži doslovno):

`CAMERA` · `FRAME LAYOUT` · `FACING` · `SCREEN DIRECTION` · `NOT IN FRAME`

Tri tvrda pravila, svako sa jednim **dobrim** i jednim **lošim** primerom:

1. **Zabrana dubinskog jezika kao pozicione instrukcije.** Nikad „u pozadini" — umesto toga
   screen-position + skala + atmosferska perspektiva.
2. **Uvek reci koju stranu tela vidimo.** „we see their faces and chests" / „we see their backs".
3. **ORIGIN/DESTINATION pravilo** — direktan fiks za „vojnici izlaze iz Sardisa": ili je mesto
   **van kadra**, ili je na eksplicitnoj poziciji u kadru uz eksplicitno „likovi su leđima ka njemu,
   licem ka kameri". Nikad ne prepuštaj modelu redosled dubine.

Prepiši **verbatim** iz izvornog plana pun primer koji linter propušta (počinje sa
*„CAMERA: camera stands on the road outside the gate…"*). To je zlatni uzorak i za ljude i za testove.

Navedi i **dve liste** koje S1 direktno konzumira:

- zabranjene fraze: `in the background`, `behind them`, `in the distance behind`, `in front of`
- screen-position tokeni koji ih otključavaju: `upper-right`, `upper-left`, `lower-left`,
  `lower-right`, `left third`, `right third`, `center`, `near-camera`, `far`, …

Bez druge liste S1 se ne može implementirati bez lažnih pozitiva.

### `visual-devices.md` — obavezan sadržaj

Devet uređaja iz izvornog plana: ANIMATED MAP · LEDGER/ACCUMULATION · PROCESS/CUTAWAY ·
BEFORE/AFTER · TIMELINE/SEASONS · MACRO OBJECT · SILHOUETTE · CROWD-AS-TEXTURE · EMPTY AFTERMATH.

Za svaki: kad se koristi · jedan konkretan primer · kako izgleda u `FRAME LAYOUT` bloku.

Plus okidač: **kada je narracija apstraktna ili zbirna** (prosperitet, decenije, trgovina, rast,
opadanje, sistem, poređenje) — biranje iz kataloga je **obavezno, ne opcija**.

Plus `NARRATION SAYS: … / VIEWER SEES: …` linija po beatu, sa pravilom da kod apstraktnih beatova
VIEWER SEES **ne sme** biti imenica-za-imenicu preslikavanje.

### `prompt-templates.md` — obavezan sadržaj

**Image** (90–160 reči), redosled blokova verbatim iz plana:

```
STYLE → SUBJECT (front-loaded, sa locked_description) → WEARING/PROPS → ACTION → SETTING
→ CAMERA / FRAME LAYOUT / FACING / SCREEN DIRECTION → LIGHT → PALETTE → NOT IN FRAME
```

**Animation** (60–100 reči, optimum 78–92), verbatim iz plana:

```
MOTION BUDGET: key motion completes within <use_len>s.
0–1s:      <šta se pokreće odmah>
1–<mid>s:  <razvoj>
<mid>–end: <gde se sleže>
CAMERA:      jedan kontinuiran potez ili zaključana kamera
ENVIRONMENT: ambijentalni pokret
PRESERVE:    same characters, clothing, props, architecture, palette and composition as the source image
FORBID:      cuts, scene changes, new characters, on-screen text, camera teleports, style shifts
```

Uz svaki template **po jedan potpun, izbrojan primer** — image između 90 i 160 reči, animation
između 60 i 100. Ti primeri postaju „dobar fixture" za C06.

## Zamke

- Nula duplikata između pet fajlova i nula prepisivanja proze iz starih promptova. Cilj Faze 2 je 4250 → ~1000 linija.
- `style-string.md` mora dati **jedan** string, ne varijante. Ako ih u `visualPromptEngine.md` ima više, izaberi jedan i zapiši zašto.
- Ne pomeraj imena blokova „radi lepšeg zvuka" — ona su API prema linteru.

## Verifikacija — definicija gotovog

```bash
wc -l docs/reference/*.md      # svaki < 200 linija
```

- Image primer ima 90–160 reči, animation primer 60–100 (prebroj).
- Prođi BLOCKING provere S1, S2, P1, P2 i pokaži gde u `reference/` piše tačno ono što linter meri.
- Nijedan pasus od 12+ reči se ne ponavlja između dva fajla.

## Tačka preseka ako sesija pređe budžet

`channel-bible.md` + `style-string.md` su jedna polovina (traže `masterPrompt.md`),
`camera-language.md` + `visual-devices.md` + `prompt-templates.md` druga (traže `visualPromptEngine.md`).
