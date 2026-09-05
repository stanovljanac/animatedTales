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
