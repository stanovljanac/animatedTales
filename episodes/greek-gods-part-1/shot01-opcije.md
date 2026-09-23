# Shot 01 — tri opcije za uvodni kadar

0:00–6.58 · „Three brothers shook three lots in a helmet. Whatever each of them drew, he would rule it forever."
Generisanje **8s** u obe opcije sa klipom. Oba para promptova prolaze `lint.mjs` (0 BLOCKING).

## Zašto je stari klip pao

- **Tri ruke tri osobe na obodu.** Model ne ume da animira usklađen pokret tri ruke, pa ih
  zamrzne, a „pokret" prebaci na jedino što je ostalo: kamenčiće. Zato skaču sami od sebe.
- **Mali identični predmeti su glavni događaj.** Tri iste sive oblutka model ne broji, nego ih
  kopira i briše. Sve se to dešavalo u centru kadra, jer je kamera gledala pravo u činiju.
- **Pokret nije imao uzrok.** Prompt je tražio da se kamenčići kotrljaju, a nije rekao da ih
  pomeraju ruke.

## Opcija 1 — jedne ruke drmaju šlem (upisana u `storyboard.json`)

Šta je drugačije: **jedan par ruku** jednog tela (obe podlaktice idu do istih grudi), kamenčići
su **tri različite boje** (beo, sivozelen, crn), jer model lakše drži tri različita predmeta nego
tri ista. Svaki skok kamenčića je izazvan trzajem ruku. Kamera je zaključana. FORBID izričito
zabranjuje četvrti kamenčić i treću ruku.

**Pre klipa proveri sliku:** tačno tri kamenčića i jedan par ruku. Ako slika ima četiri
kamenčića, imaće ih i klip, pa sliku generiši ponovo (0 kredita) pre nego što potrošiš kredite
na klip.

```
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SUBJECT: a battered bronze war helmet serving as a lot-urn, and three lots for it, each a flat river pebble scratched with a single mark, the bronze dented and dull, its horsehair crest torn short, held upside down as a bowl in one pair of big scarred hands, exactly three pebbles lying in it: one chalk-white, one sea-grey, one black.
SCALE: the helmet is an ordinary man-sized war helmet; the two hands gripping it are a god's hands, each palm covering a whole side of the bronze; each pebble is the size of a thumb joint; three pebbles, and only three, anywhere in the frame.
ACTION: both hands grip the helmet by its cheek-guards, braced to shake it.
SETTING: a scorched plain at the end of a ten-year war, ash in the air, a storm breaking overhead.
CAMERA: camera faces the figure a little above the helmet, high, close.
FRAME LAYOUT: center — the open bowl and the three pebbles, near-camera and large; lower-left and lower-right — the two forearms, both rising to one broad bare chest cropped at the upper edge; upper-left — storm cloud and lightning, far.
FACING: we see into the bowl tilted toward camera and the front of one chest; no face.
SCREEN DIRECTION: ash drifts from the upper-left toward screen-right; a lightning fork runs down the upper-left.
LIGHT: white lightning from the upper-left flares on the bronze rim; dull red afterglow from the burning ground under the knuckles.
PALETTE: dull bronze, ash grey, ember red, lightning white.
DETAIL: hammer dents in the bronze, torn crest stubble, one scratched mark on each pebble, scars across the knuckles.
NOT IN FRAME: faces, any second figure, weapons.
```

```
MOTION BUDGET: key motion completes within 6.583s; hold to the end of an 8s generation.
0–1s: the hands jerk the helmet left and back; the three pebbles jump.
1–4.3s: the hands shake it side to side in sharp jolts; each jolt knocks the same three pebbles against the bronze.
4.3–6.5s: the hands stop and hold it level; the three pebbles settle in the bottom.
CAMERA: locked on the helmet.
ENVIRONMENT: ash blows across the frame; lightning flickers upper-left.
PRESERVE: same characters, clothing, props, architecture, palette and composition as the source image.
FORBID: cuts, scene changes, new characters, on-screen text, camera teleports, style shifts, a fourth pebble, a third hand.
```

## Opcija 2 — tri brata kao divovi, šlem podignut ka oluji

Nova ideja, u mitskom registru: tri boga veća od brda stoje na grebenu iznad spaljene ravnice
rata, a **Posejdon u sredini drma šlem visoko iznad glave** dok ga druga dvojica gledaju i munja
puca iznad njih. Raspored Zevs levo, Posejdon centar, Had desno prati zaključani red iz `notes.md`.

Zašto ovako:

- **Kamenčići su u šlemu, van kadra**, pa model nema šta da umnoži.
- **Pokret je krupan i jednostavan**: jedan lik drma predmet, a ostalo nose vetar, munja i dim,
  što model najbolje radi. Od prve sekunde je jasno da je ovo animacija, a ne slajdšou.
- **Ne ponavlja shot 16.** Na 1:33 isti trenutak ide odozgo i zbliza, kao izvlačenje. Ovde je
  drmanje, iz donjeg rakursa i u punoj razmeri.

**Pre klipa proveri sliku:** šlem je jasno u rukama boga u sredini, a tri boje himationa
(ljubičastocrvena, morskozelena, crnoljubičasta) se razlikuju.

```
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SUBJECT: three powerfully built bearded Greek gods in their prime, one in a purple-red himation with dark waving hair, one salt-weathered in sea-green with hair in heavy ropes, one pale in black-violet covering both shoulders, standing as giants on a ridge of black rock, the god in sea-green at the center lifting a helmet high over his head in both hands.
SCALE: the three gods are colossal, each taller than the burning hills around them; the war plain spreads out small below their knees; the fires on the plain read as sparks beside their feet; the helmet is an ordinary war helmet, small in the raised hands of a god.
SUBJECT 2: a battered bronze war helmet serving as a lot-urn, and three lots for it, each a flat river pebble scratched with a single mark, the bronze dented and dull, its horsehair crest torn short, held upside down at the top of the frame, its three pebbles inside and out of sight.
ACTION: the god in sea-green raises the helmet to shake it while the other two watch it.
SETTING: the end of the ten-year war, craters still burning on the plain, a storm splitting open overhead.
CAMERA: camera sits low on the plain far below them, looking up, low, wide.
FRAME LAYOUT: left third — the god in purple-red; center — the god in sea-green, near-camera, arms raised, the helmet near the upper edge; right third — the god in black-violet; lower edge — the burning plain, far and small.
FACING: we see all three faces from below, three-quarter on, all eyes lifted to the helmet.
SCREEN DIRECTION: lightning forks from the upper-left toward screen-right; ash and the three himatia stream toward screen-right.
LIGHT: white lightning from above rim-lights the three heads and the raised bronze; red glow from the burning plain underlights their chests.
PALETTE: storm slate, lightning white, ember red, dull bronze.
DETAIL: figures readable by outline and posture, himatia whipping in the wind, layered rock ledges and smoke below them.
NOT IN FRAME: armies, other gods, weapons, Olympus.
```

```
MOTION BUDGET: key motion completes within 6.583s; hold to the end of an 8s generation.
0–1s: the god in sea-green shakes the raised helmet hard; lightning cracks overhead.
1–4.3s: he shakes it in three hard jolts as the other two lean in; wind whips their himatia toward screen-right.
4.3–6.5s: he holds the helmet high and still; the storm light fades to red.
CAMERA: one slow push up toward the helmet.
ENVIRONMENT: smoke streams across the plain; fires flicker below their knees.
PRESERVE: same characters, clothing, props, architecture, palette and composition as the source image.
FORBID: cuts, scene changes, new characters, on-screen text, camera teleports, style shifts.
```

## Opcija 3 — still, ako nijedan klip ne prođe

Bez novih kredita: uzima se **bolja od dve slike** iz opcija 1 i 2 (obe se ionako prave pre klipa),
u punoj rezoluciji. Montaža joj daje isti glatki zum kao ostalim still kadrovima (push ka šlemu).
Javi koja slika, pa prebacujem shot 01 na `still` u storyboard-u i montiram ponovo.

## Predaja

Sačuvaj u koren epizode kao i do sada: slika `shot01.jpeg`, klip `shot01.mp4`. Ako probaš obe
opcije, dodaj sufiks (`shot01-o1.mp4`, `shot01-o2.mp4`) i reci koja ulazi. Kopiranje u `shots/` i
ponovnu montažu radim ja; ako prođe opcija 2, upisujem je u `storyboard.json` umesto opcije 1.
