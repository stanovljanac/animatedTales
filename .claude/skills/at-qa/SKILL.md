---
name: at-qa
description: Use when reviewing an existing storyboard.json for an Animated Tales episode - stage 07. Runs tools/lint.mjs, reads the BLOCKING and ADVISORY sections, adds the narrative review a linter cannot do, and rewrites the prompts of failing shots only. Do NOT use for building a storyboard from scratch (that is at-storyboard) or for assembly (at-assemble).
---

# at-qa — stage 07

Deterministički linter plus ono što linter ne vidi. Popravlja **samo pale shotove**.

## Tok

### 1. Linter

```
node tools/lint.mjs episodes/<slug>
```

Piše `episodes/<slug>/qa-report.md` sa dve sekcije i vraća **exit 1** kad ima ijedan BLOCKING
nalaz. ADVISORY nikad ne menja exit code.

Opcije: `--no-media` (preskoči F1 kad klipovi još ne postoje) · `--no-write` (samo ispiši).

Nalaz izgleda ovako i nosi tačan `shot_id`:

```
  [T2] shot 03: use_len 1.208s — izvan granica 3.0–10.0
  [S1] shot 01: image prompt: "in the background" bez screen-position klauzule — „…"
  [S2] shot 02: image prompt nema blok FACING
  [C1] shot 04: locked_description entiteta "hill-fort" nije doslovno u image promptu
BLOCKING: 4 nalaza (T2 S1 S2 C1)
```

### 2. Popravke — samo pali shotovi

> **Prepisuješ prompt samo onog shota koji je pao.** Nikad ceo storyboard, nikad „usput sam
> doterao i ostale".

Razlog je merljiv: svaki dodirnut prompt je novi ulaz za R4 (ponavljanje n-grama) i novi rizik
za C1 (doslovan `locked_description`). Prepisivanje shota koji prolazi menja stanje koje je
već provereno, a ne popravlja ništa.

Popravke po vrsti nalaza:

| Nalaz | Šta je pokvareno | Popravka |
|---|---|---|
| **T1** | zbir `use_len` ne prati narraciju | **ne diraj promptove** — beat mapa je pogrešna, vrati se na `at-storyboard` |
| **T2** | `use_len` van 3–10s | isto: beat mapa, ne prompt |
| **T3** | nema `MOTION BUDGET` linije sa brojem | dopiši je; broj mora da bude jednak `use_len` |
| **P1/P2** | broj reči van 90–720 / 60–220 (shema 1: 90–160; end kartica 90–1200) | image: skrati `SETTING` i `ACTION`, **nikad kamera-blokove**, nikad `locked_description` i nikad `SCALE`; animation: skrati `ENVIRONMENT`, nikad proreze |
| **S1** | zabranjena prostorna fraza | zameni je screen-position klauzulom po `docs/reference/camera-language.md` |
| **S2** | fali jedan od obaveznih blokova (pet kamera-blokova, na shemi 2 i `SUBJECT` i `DETAIL`) | dopiši blok verzalom sa dvotačkom |
| **S4** | shot nosi `scale_critical` lock bez `SCALE` bloka | dopiši `SCALE` sa 3–4 tvrdnje o veličini; ponavljanje je tu namerno |
| **S5** | PRIMARY lock nije u `SUBJECT` bloku, previše lockova, ili `visual_priority` nije 3–5 stavki sa PRIMARY na vrhu | premesti lock u `SUBJECT`; ako kadar traži tri locka, problem je kadar, ne prompt |
| **S3** | reč koja implicira rez u animation promptu | izrazi napredovanje vremenskim prorezom, ne veznikom |
| **C1** | `locked_description` nije doslovno u promptu | prekopiraj ga iz `episode.json` neizmenjen |
| **F1** | klip ne postoji ili je prekratak | nije prompt — regeneriši klip, vidi `at-assemble` |

T1 i T2 su jedini nalazi koje **ne popravljaš ovde**. Oni znače da je pogrešno grupisanje
rečenica, a to je odluka `at-storyboard`-a. Reci to korisniku umesto da krpiš.

### 3. Narativni pregled — ono što linter ne vidi

Linter meri oblik. Ovo meri smisao, i radi se **na svakom prolazu**, i kad je BLOCKING prazan:

- **besmislice** — kadar koji je formalno ispravan a ne prikazuje ništa razumljivo
- **gubitak fokusa** — beat koji je vizuelno lep a odvlači od onoga što narracija govori
- **beat koji ne prati priču** — tačan opis pogrešnog trenutka
- **preslikavanje imenica** — `viewer_sees` koji samo ponavlja reči iz `narration_says`
  umesto da ih vizualizuje; kod apstraktnih beatova to je najčešća greška
- **early motion** — prvi prorez (`0–1s:`) nosi atmosferu umesto radnje, a kadar nije
  namerno miran ni refleksivan. Merljivo: pročitaj `0–1s:` liniju i pitaj se da li se u njoj
  nešto **dešava**.
- **zamrznut kraj** — poslednji prorez se ne završava na `gen_len`, ili propisuje mirovanje
  (`hold`, `holds still`, `goes still`, `settles`, `comes to rest`, `freezes`, `nothing moves`,
  `stays the same`), ili `MOTION BUDGET` linija kaže `hold to the end`. Model takav klip zamrzne
  pre kraja naracije. Prepiši po „Pravilima proreza" u `prompt-templates.md`: prorezi do
  `gen_len`, poslednji nastavlja radnju istim ritmom. **Ovo je nalaz i kad BLOCKING prolazi.**
- **telegrafski prorezi** — prorez od jedne kratke rečenice („the crowd moves") ne kaže ko se
  kreće, kako ni kuda. Svaki prorez su dve rečenice: glavna radnja i šta se još pomera.
- **still montage na pogrešnom mestu** — niz statičnih slika tamo gde je narracija aktivna
- **end kartica koja nije kartica** — poslednji shot (nad `## OUTRO`) mora da ima `TITLE:` i
  `BUTTON:` blok po odeljku „End kartica" u `prompt-templates.md`, i da rekapitulira **celu**
  priču, ne samo kraj. Ako piše `NOT IN FRAME: text`, nema SUBSCRIBE dugmeta, ili pozadina
  prikazuje samo poslednju scenu, prompt se prepisuje iz cele skripte.

Na **still epizodi** (`render_mode: "still"`, `schemas.md` §3.3.2) tri stavke iznad menjaju
oblik, jer animation prompta nema:

- **early motion se ne meri** — pokret kadra je `still_motion`, ne prorez `0–1s:`
- **umesto toga se gleda ritam pokreta** — pet uzastopnih `push`-eva je isto tako umorno kao
  slajdšou. `hold` je pun izbor i sme da se koristi tamo gde rez treba da stane.
- **smer panovanja mora da prati `SCREEN DIRECTION`** — `pan-left` nad kadrom u kome sve ide
  udesno je greška koju linter ne može da vidi, jer bi za to morao da razume prozu.

Režijska tabla u `storyboard.md` ima kolonu `režim` upravo zbog ovoga: niz pokreta se čita
odozgo naniže, na jednom ekranu.

### 4. ADVISORY je ulaz, ne izveštaj

ADVISORY sekcija `qa-report.md`-a je **ulaz u ovaj sloj**. Brojevi se tumače u kontekstu priče,
ne mehanički.

| Signal | Kako se čita |
|---|---|
| **R1** — pravilo razlike | dva uzastopna shota se razlikuju po premalo osa. Shotovi u istom `link_group` su izuzeti — namerno dele lokaciju i svetlo. |
| **R2** — miks tipova shotova | **nema prag.** Epizoda o jednoj bici legitimno je puna `crowd` i `group` kadrova. |
| **R3** — upotrebljeni uređaji | **nema prag.** Samo izlistava. Epizoda bez ijednog uređaja je signal da je pogledaš, ne nalaz. |
| **R4** — ponavljanje n-grama | `locked_description`, style string i fiksne `PRESERVE`/`FORBID` linije su već izuzeti. Ono što ostane je stvarno ponavljanje i vredi ga pogledati. |
| **R5** — prompt van mekog opsega (image 360–520, animation 150–210) | **image: nije nalaz.** Kadar kome je dovoljno nešto manje ne razvlačiš; signal čuva da to bude odluka, a ne previd. **Animation ispod 150 jeste razlog da pogledaš proreze** — kratak animation prompt je skoro uvek telegrafski prorez ili prorez koji ne stiže do `gen_len`. |
| **R6** — prazna `SCREEN DIRECTION` | blok popunjen negacijom („nothing crosses the frame") je potrošen blok. Zaključan kadar je u redu — imenuj najsitniji živi element (pramen dlake, para daha, senka oblaka). |
| **R7** — `still_motion` protiv `camera_motion` | pokret koji montaža izvodi ne slaže se sa tim šta tag kaže da kamera radi. **Nije nalaz**: `reveal` izveden kao spor zum je legitiman. Ali proveri i smer — `pan-left` uz `SCREEN DIRECTION` koji vodi udesno je greška koju niko drugi neće videti. |
| **C2** — multi-visual klipovi | meri deklaraciju u `animation_prompt`-u (`OPENING VISUAL`, …), ne posebno polje. Imenilac su **samo klipovi** — still kadar nema animation prompt. |

> **R2 i R3 nemaju prag i ne traže akciju** dok se ne izmere tri epizode. Kvote se mere, ne
> nameću. Ne izmišljaj prag i ne prepravljaj storyboard da bi „popravio" R2 ili R3 — to je
> kalibracioni podatak, ne nalaz.

### 5. Ponovni render

Posle svake izmene `storyboard.json`-a:

```
node tools/lint.mjs episodes/<slug>
node tools/render.mjs episodes/<slug>
```

> **`storyboard.md` se nikad ne piše ni menja ručno.** Nastaje isključivo kroz `render.mjs` i
> nosi `DO-NOT-EDIT` zaglavlje. Menjaš `storyboard.json`, pa renderuješ.

**Svaka izmena `storyboard.json`-a ide sa svojim `.md` parnjacima, u istoj sesiji.** Ovo važi i
kad se jedan prompt ispravlja ručno, bez ovog skila. Ako je izmena promenila broj beatova ili
shotova, `render_mode` ili `gen_len`, ručno ispravi i `notes.md`: brojeve i spisak still
kadrova. Cela tabela parova je u `README.md` → „JSON i njegovi `.md` parnjaci".

Gotovo je kad `lint.mjs` vrati exit 0 i kad `storyboard.md` nije stariji od `storyboard.json`-a.

## Šta ovaj skil ne radi

- **Ne menja `script.md`** ni `timing.json`. Skripta je zamrznuta posle rendera narracije.
- **Ne menja beat mapu ni vremena.** T1/T2 nalazi se vraćaju `at-storyboard`-u.
- **Ne prepisuje shotove koji prolaze.**
- **Ne piše `storyboard.md`.**
- **Ne traži akciju po R2/R3.**
