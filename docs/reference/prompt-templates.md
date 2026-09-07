# Template-i promptova

Dva šablona: jedan za startni frejm (`shot.image_prompt`), jedan za klip (`shot.animation_prompt`).
Redosled blokova nije preporuka — model čita s početka, pa ono što je front-loaded dobija najviše
težine. Zato identitet lika ide gore, a isključenja dole.

Dužine su BLOCKING: **P1 = 90–160 reči** za image, **P2 = 60–100 reči** za animation, po kanonskom
brojaču iz `schemas.md` §0.6. Taj brojač broji i nazive blokova (`FRAME LAYOUT:` = 2 reči) i vremenske
oznake (`0–1s:` = 1 reč), pa je gornja granica uža nego što deluje: `STYLE` blok pojede 16 reči, a
svaki `locked_description` još 25–40.

> **Namerno ponavljanje, tri dozvoljena izuzetka:** kanonski style string iz `style-string.md`,
> `locked_description` iz `episode.json` i fiksne `PRESERVE`/`FORBID` linije animation šablona
> stoje doslovno u svakom promptu — prva dva jer se po definiciji kopiraju neizmenjeni, treće jer
> su fiksne linije, ne šablon za popunjavanje. R4 sva tri izuzima iz provere ponavljanja n-grama
> (`schemas.md` §4.1 i §5.6 tačka 2). Sama `PRESERVE` linija nosi 13 reči, pa bi bez izuzeća
> obarala prag „>12" na svakom paru shotova.

---

## Image template

```
STYLE:            <kanonski string iz style-string.md, doslovno>
SUBJECT:          <ime lika>, <locked_description iz episode.json, doslovno, 25–40 reči>
WEARING/PROPS:    <samo ono što ovaj kadar zaista pokazuje, a nije u locked_description>
ACTION:           <jedna radnja, kontinuirana, bez „pa onda">
SETTING:          <mesto, period, materijali>
CAMERA:           <gde kamera stoji | eye/low/high/overhead | wide/medium/close>
FRAME LAYOUT:     <šta je na kojoj trećini ekrana, sa near-camera / far parovima>
FACING:           <koju stranu tela vidimo, gde ko gleda>
SCREEN DIRECTION: <kretanje preko kadra>
LIGHT:            <izvor, doba dana, tvrdoća senke>
PALETTE:          <tri do četiri boje, ne više>
NOT IN FRAME:     <šta je namerno isključeno>
```

Četiri bloka od `CAMERA` do `SCREEN DIRECTION` plus `NOT IN FRAME` su ono što meri **S2**; njihova
pravila i primeri su u `camera-language.md`, ne ovde.

### Primer — 151 reč, prolazi P1, S1, S2, C1

```
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SUBJECT: Hanno, a lean Carthaginian clerk of about fifty, close-cropped grey hair, a short curled beard, an undyed linen tunic belted with rope, a wax tablet under one arm.
WEARING/PROPS: worn sandals, a bronze stylus.
ACTION: he cuts one more mark into the wax.
SETTING: a stone quay of fitted limestone, crates along the edge.
CAMERA: camera stands two paces from him on the quay, eye level, medium.
FRAME LAYOUT: left third — Hanno, near-camera and large; center — the open tablet; right third — a moored hull, far and hazy.
FACING: we see his face and chest three-quarter on; his eyes stay down.
SCREEN DIRECTION: dockhands cross from the right edge toward the left.
LIGHT: flat morning haze off the water.
PALETTE: sand ochre, weathered timber, sea green.
NOT IN FRAME: the city walls, the open sea.
```

`SUBJECT` blok nosi `locked_description` entiteta `hanno` (27 reči) doslovno — to je ono što
provera **C1** traži kao podstring posle normalizacije.

Računica koju vredi imati u glavi: 16 (`STYLE`) + 29 (`SUBJECT`) + 66 (pet kamera-blokova) =
**111 reči** je potrošeno pre nego što si napisao išta o radnji, svetlu i boji. Ovaj primer staje
na **151**, devet reči ispod plafona, a nema nijedan suvišan pridev. Sa dva lika u kadru
(dva `locked_description`-a) plafon se probija — tada se skraćuje `SETTING` i `WEARING/PROPS`,
nikad kamera-blokovi.

---

## Animation template

```
MOTION BUDGET: key motion completes within <use_len>s.
0–1s:      <šta se pokreće odmah>
1–<mid>s:  <razvoj>
<mid>–end: <gde se sleže>
CAMERA:      <jedan kontinuiran potez ili zaključana kamera>
ENVIRONMENT: <ambijentalni pokret>
PRESERVE:    same characters, clothing, props, architecture, palette and composition as the source image
FORBID:      cuts, scene changes, new characters, on-screen text, camera teleports, style shifts
```

`PRESERVE` i `FORBID` su fiksne linije, ne šablon za popunjavanje — direktan fiks za „gube se
elementi, jedni se menjaju drugima, scena se seče". `MOTION BUDGET` mora da nosi isti broj kao
`shot.motion_budget`, koji je jednak `shot.use_len` (provera T3).

Tri vremenska proreza su obavezna i moraju da pokriju ceo klip bez rupe. Zbog toga animation prompt
ne sme da sadrži reči koje impliciraju rez **unutar** klipa — `then`, `later`, `afterwards`,
`cuts to`, `meanwhile` — to meri **S3**. Napredovanje se izražava vremenskim prorezom, ne veznikom.

### Primer — 90 reči, prolazi P2, S1, S3

```
MOTION BUDGET: key motion completes within 6.5s.
0–1s: Hanno presses the stylus into the wax.
1–4s: he lifts the tablet toward the light, counting; a dockhand crosses the lower edge with a crate.
4–6.5s: he tucks the tablet under his arm and his shoulders settle.
CAMERA: one continuous slow push toward the tablet.
ENVIRONMENT: haze drifts over the water; a rope sways against the quay.
PRESERVE: same characters, clothing, props, architecture, palette and composition as the source image.
FORBID: cuts, scene changes, new characters, on-screen text, camera teleports, style shifts.
```

Primetićeš da lik ovde nije ponovo opisan. To je namerno: identitet se uspostavlja u slici, a
`locked_description` bi na svakom shotu sa dva lika sam pojeo ceo P2 budžet. `PRESERVE` linija je
njegova zamena (`schemas.md` §0.7). Fiksne `PRESERVE` i `FORBID` linije zajedno nose 25 reči —
više od četvrtine P2 budžeta — pa na tri vremenska proreza u ovom primeru ostaje 38 reči,
po trinaestak svaki.

---

## Kontrolna lista pre upisa u `storyboard.json`

1. Prebroj obe dužine kanonskim brojačem, ne na oko — 90–160 i 60–100.
2. Pet naziva blokova stoji u image promptu, verzalom i sa dvotačkom.
3. Nijedna zabranjena prostorna fraza (lista A u `camera-language.md`).
4. Nijedna od pet reči koje impliciraju rez, u animation promptu.
5. `locked_description` svakog lika iz `shot.characters[]` stoji doslovno u image promptu.

---

# Shema 2 — image template sa hijerarhijom vizuelne težine

> Sve iznad opisuje **shemu 1** i važi za epizode koje nose `schema_version: 1`. Linter bira
> pravila po tom broju, pa postojeće epizode ostaju validne bez prepravke. Nove epizode se pišu
> po ovom odeljku. Obrazloženje promene je u `schemas.md` §3.3.1.

Tri stvari se menjaju: plafon je **90–280 reči** (meki cilj 180–260, R5), uvode se blokovi
`SCALE` i `DETAIL`, i redosled blokova prestaje da bude preporuka — **`SUBJECT` i `SCALE` idu pre
kamera-blokova**, jer je to jedino mesto na kome front-loading nešto znači.

```
STYLE:            <kanonski string iz style-string.md, doslovno>
SUBJECT:          <PRIMARY lock — characters[0], locked_description doslovno>
SCALE:            <3–4 tvrdnje o veličini; obavezan kad je entitet scale_critical>
SUBJECT 2:        <SECONDARY lock, ako postoji; najviše dva>
ACTION:           <jedna radnja, kontinuirana, bez „pa onda">
SETTING:          <mesto, period, materijali>
CAMERA:           <gde kamera stoji | eye/low/high/overhead | wide/medium/close>
FRAME LAYOUT:     <šta je na kojoj trećini ekrana, sa near-camera / far parovima>
FACING:           <koju stranu tela vidimo, gde ko gleda>
SCREEN DIRECTION: <kretanje preko kadra — nikad negacija, vidi listu D>
LIGHT:            <izvor, doba dana, tvrdoća senke>
PALETTE:          <tri do četiri boje, ne više>
DETAIL:           <gustina koju ova veličina kadra uopšte može da pokaže — style-string.md>
NOT IN FRAME:     <šta je namerno isključeno>
```

**S2 na shemi 2** traži sedam naziva: pet kamera-blokova plus `SUBJECT` i `DETAIL`. `SCALE` je
uslovan i nosi ga **S4**. `SUBJECT` mora da sadrži PRIMARY lock doslovno — **S5**; C1 bi ga našao
bilo gde u promptu, pa bi lock zaključan u `SETTING` liniji prošao, a upravo to se dogodilo u prvoj
epizodi na tri shota.

## `SCALE` — zašto se ista stvar tvrdi četiri puta

Ovo je jedini blok u kome je ponavljanje **namerno i obavezno**. Difuzioni model raspoređuje težinu
po učestalosti i poziciji, ne po tome koliko je rečenica elegantna. Jedna precizna tvrdnja o veličini
na 40. reči prompta gubi od pet raspoređenih tvrdnji.

- **Loše (jedna tvrdnja, i to unutar locka):** `…always drawn larger than the gods around him`
- **Dobro:** `SCALE: Fenrir is monumental, drawn far larger than any figure near him; his shoulder rises above the gods' heads; the gods read as small dark shapes beside his ribs; strong size contrast carries the frame.`

Odnos prema drugim likovima ide **ovde**, nikad u `locked_description` — inače prompt tvrdi odnos
prema bogovima u kadru iz kog ih `NOT IN FRAME` izbacuje.

**R4 izuzima `SCALE` i `DETAIL`** iz provere ponavljanja n-grama, iz istog razloga iz kog izuzima
style string i `locked_description`: to su blokovi čiji je posao da se ponavljaju.

## `visual_priority` se ne upisuje u prompt

Rangirana lista od 3 do 5 stavki živi u `storyboard.json` i služi da se PRIMARY lock može mašinski
proveriti (S5). U prompt **ne ide**: model ne čita meta-instrukcije o važnosti, pa bi lista trošila
30-ak reči ne menjajući sliku. Prioritet se modelu saopštava pozicijom i učestalošću — dakle
`SUBJECT` blokom, `SCALE` blokom i redosledom — a ne tako što mu se napiše da je nešto prioritet.

## Primer — shot sa dva locka, PRIMARY je lik a ne rekvizit

```
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SUBJECT: Fenrir, a colossal grey-black wolf with a lean muscular frame, amber eyes, coarse shaggy fur along the shoulders, scarred muzzle and heavy jaws.
SCALE: Fenrir is monumental, drawn far larger than any figure near him; his shoulder rises above the gods' heads; the gods read as small dark shapes beside his ribs; strong size contrast carries the frame.
SUBJECT 2: Drómi, a massive black iron chain with links twice the thickness of ordinary forgework, riveted bands and reinforced collars, oily dark sheen, with the mass to sag under its own weight.
ACTION: he rises against the collar as four gods haul on the slack.
SETTING: black rock, standing water, cold northern shore.
CAMERA: camera stands twelve paces off on the rock, low, wide.
FRAME LAYOUT: center — the wolf, near-camera and large; left third — the gods, small; right third — a ridge, far and hazy.
FACING: we see the wolf's flank and head three-quarter on, eyes toward screen-left; the gods stand half-turned from camera.
SCREEN DIRECTION: the gods haul from center toward the left edge; loose grit skitters toward camera.
LIGHT: hard storm light under a black sky, one break of pale light on the wet flank.
PALETTE: oiled black, storm slate, cold white.
DETAIL: coarse individual fur strands catch the light, hammer marks and rivet seams read on every link.
NOT IN FRAME: the far mountains, the ribbon.
```

Isti kadar je na shemi 1 bio nemoguć: lock je morao da bira između vuka i lanca, izabrao je lanac,
i vuk — `center, near-camera and large` — dobijao je četiri reči.

## Kontrolna lista pre upisa (shema 2)

1. Prebroj obe dužine kanonskim brojačem: **90–280** i 60–100. Cilj je pokrivenost, ne broj.
2. Sedam naziva blokova stoji u image promptu, plus `SCALE` kad je entitet `scale_critical`.
3. `characters[0]` je vizuelni subjekt kadra i njegov lock stoji **u `SUBJECT` bloku**.
4. `visual_priority` ima 3–5 stavki i `[0]` imenuje PRIMARY lock.
5. Nijedna zabranjena prostorna fraza (lista A), nijedna prazna `SCREEN DIRECTION` (lista D).
6. Nijedna od pet reči koje impliciraju rez, u animation promptu.
7. `locked_description` nosi identitet — ako u njemu piše poza, greška je u `episode.json`.
