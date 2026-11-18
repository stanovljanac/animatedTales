# hero-twins — alternative za Flow

Redosled pokušaja za svaki rizičan shot ([`docs/reference/flow-filter.md`](../../docs/reference/flow-filter.md)):

1. **Plan A** — original (početni frejm, radnja kako je mit traži).
2. **Plan B** — alternativna slika i animacija, sa zamenjenim rečima i preusmerenom radnjom.
3. **Plan C** — still sa slikom koja je prošla (ili sa najboljom koju imaš), bez Flow klipa.

Aktivan plan je onaj koji stoji u `storyboard.json`. Kad padne, sledeći se prekopira odavde (ili iz
`node tools/shotlist.mjs episodes/hero-twins --only NN`), pa se pokrene `node tools/lint.mjs
episodes/hero-twins` i `node tools/render.mjs episodes/hero-twins`. Plan C ne traži nove promptove, samo
izmenu polja ispod.

| Shot | Rizik | Plan A | Plan B | Plan C |
|---|---|---|---|---|
| 23 | predmet sa licem čita se kao glava (pretpostavka) | pao (slika sa licem u letu) | pao | **aktivan** (still `push`, slika sa Plan A kadra; 15. nov, montirano) |
| 26 | skok u vatru čita se kao samopovređivanje (pretpostavka); gola koža velika u kadru | pao | **aktivan** (blizanci mali, u belim ogrtačima; staju pred jamom) — prošao kao klip, montiran | still `push` (nije potreban) |
| 29 | „žrtvovanje": lik leži pod platnom kao telo | **aktivan** (čuči pod platnom kao pod šatorom) | ispod (zavesa) | still `push` |
| 30 | blizanci „udaraju" gospodare koji „padaju" | **aktivan** (blizanci spremni, nema udarca ni pada) | ispod (vrtlog prašine umesto pada) | still `push` |

Nijedan shot koji već ima klip nije menjan. Početni frejm je ispravljen i u 25, 27, 28 i 31 (bez
filter rizika), jer su im slike prikazivale ishod ili sredinu radnje; vidi tabelu na dnu.

---

## Shot 23 — lopta

**Plan A (pao).** Slika: lordovi udaraju bledu okruglu glavu, glava u letu iznad terena, lice sa zatvorenim
očima. Animation:

```
MOTION BUDGET: key action lands by 6.292s; everything keeps moving at the same natural pace through the end of the 8s generation.
0–1s: a lord leaps and strikes the pale round head with his hip and it sails across the court; the other lords roar and run after it.
1–3s: the head bounces off a wall and a second lord knocks it back; Xbalanque watches with calm eyes, his hand lowering to the floor.
3–5s: the rabbit at his feet bolts across the court toward the right, ears flat, kicking up dust.
5–7s: the lords spin toward it in confusion, pointing and shouting, their headdress feathers flying.
7–8s: the head rolls free along the floor and the lords start after the rabbit at full speed as torch smoke swirls.
```

**Plan B (aktivan u `storyboard.json`).** Šta je zamenjeno i zašto:

| Plan A | Plan B | Razlog |
|---|---|---|
| „pale round head", „head" | „the pale round ball", glatka bela tikva veličine dinje, bez lica | predmet u slici je okidač; u mitu je u igri i bila tikva |
| lopta u letu u slici | lopta povučena na kuk, vodeći lord stoji ukopan | početni frejm; let se animira |
| „strikes with his hip", „knocks it back" | „swings forward", „bat it onward" | glagol kontakta → putanja |
| Xbalanque u natkolenici, veliki | beli pamučni ogrtač do kolena | gola koža velika u kadru |
| `NOT IN FRAME: blood, gore, a skull, any text` | `NOT IN FRAME: any text, a second ball` | bez spornih reči |

**Plan C.**

```
"source_file": "shots/shot23.jpeg",
"motion_budget": null,
"gen_len": null,
"animation_prompt": null,
"render_mode": "still",
"still_motion": "push",
"tags.camera_motion": "push"
```

## Shot 26 — pred vatrom

**Plan A (pao).** Slika: blizanci veliki u kadru, zagrljeni, kadar seče na butinama, lice u profilu ka vatri.
Animation (prorezi posle `MOTION BUDGET` linije):

```
0–1s: the lords heave logs into the pit and the fire roars higher; the twins turn to each other and embrace.
1–3s: the twins press their foreheads together and breathe once, calm; sparks stream past them toward the upper right.
3–4.5s: they step to the lip of the pit hand in hand and leap forward toward the right into the flames in one motion.
4.5–6s: the fire flares white-hot where they entered and the lords recoil from the heat, feathers whipping, as sparks fill the air.
```

**Plan B (aktivan u `storyboard.json`).**

| Plan A | Plan B | Razlog |
|---|---|---|
| „embrace", „embracing" | „hand in hand", „foreheads together" | intima + gola koža |
| „leap into the flames" | „walk hand in hand up the stone lip"; belo užareno svetlo preplavi kadar | samopovređivanje: čin ostaje izvan kadra, ishod pokriva narracija |
| blizanci veliki, seče na butinama, MS | LS, mali, s leđa, beli pamučni ogrtači do kolena | gola koža velika u kadru |
| `NOT IN FRAME: burning flesh, blood, gore, any text` | `NOT IN FRAME: any text` | bez spornih reči |

**Plan C.**

```
"source_file": "shots/shot26.jpeg",
"motion_budget": null,
"gen_len": null,
"animation_prompt": null,
"render_mode": "still",
"still_motion": "push",
"tags.camera_motion": "push"
```

## Shot 29 — platno

**Plan A (aktivan).** Xbalanque čuči pod tankim belim platnom kao pod malim šatorom, Hunahpu drži ruku
podignutu iznad. Zamenjeno u odnosu na raniju verziju: „lies flat" → „crouches" (telo koje leži pod platnom
čita se kao leš). Animation: prvi prorez „the other crouches", drugi „the cloth begins to swell and lift as the
crouched wanderer straightens beneath it".

**Plan B (zavesa, ako A padne).** Platno se drži kao zavesa; Xbalanque stoji iza njega, vide se samo kontura
i bose noge, pa ga Hunahpu otkrije. Nijedan lik ne leži.

Image prompt:

```
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SUBJECT: Hunahpu, a lean Maya ballplayer of about twenty, a smooth oval face with a small beard-less chin, black spots painted on both cheeks, long black hair under a jade-green headband, a heavy jade ear spool, standing at the left third as a ragged wanderer, holding a large white cloth up at arm’s length like a curtain, one hand lifted to whisk it aside
SUBJECT 2: Xbalanque, a lean Maya ballplayer of about twenty, a smooth oval face like his brother, patches of jaguar pelt on both cheeks and forearms, long black hair under a dark blue headband, a heavy jade ear spool, as the second ragged wanderer, standing at the center behind the hanging white cloth, only his bare feet and a faint dark outline showing through the thin fabric
SUBJECT 3: tall stern lords of the Maya underworld, pale ash-grey painted faces with sunken black eyes, towering headdresses of owl feathers and bone, long mantles woven in black and ash grey, necklaces of carved bone, on the dais at the right, laughing and clapping, delighted
ACTION: one wanderer holds a thin white cloth up like a curtain while the other stands hidden behind it; the delighted lords lean forward on their seats, ready to clap
SETTING: a torch-lit Xibalba hall with a long dais of carved seats, tall black columns, drifting smoke and a bare cleared floor
CAMERA: camera crouches at floor level facing the dais, low angle, medium shot.
FRAME LAYOUT: left third — the wanderer holding up the white cloth, near-camera and large; center — the hanging white cloth with a faint dark outline behind it, medium; right third — the lords leaning forward on their dais, medium; upper edge — columns.
FACING: we see the performers from the left with their faces toward the dais at screen-right; the lords look left, toward screen-left, laughing.
SCREEN DIRECTION: the wanderer’s free hand points toward the edge of the cloth at the center; the lords lean in from the right toward the left; sparks drift toward the right.
LIGHT: red torch light, bright faces on the laughing lords, a pale shine on the white cloth.
PALETTE: torch red, cloth white, ragged brown, black
DETAIL: the folds of the hanging white cloth, a faint outline through the thin fabric, ash on the wanderer’s face, the lords’ bone necklaces, hands ready to clap.
NOT IN FRAME: any text, any weapon.
```

Animation prompt:

```
MOTION BUDGET: key action lands by 4.958s; everything keeps moving at the same natural pace through the end of the 6s generation.
0–1s: Hunahpu lifts the white cloth higher with both hands like a curtain while the lords lean forward on their seats; the dark outline behind the cloth shifts.
1–3s: he whisks the cloth sideways toward the left with a flourish; the lords gasp and their feathers shake.
3–4.5s: Xbalanque stands revealed behind it with his arms spread wide; the lords burst into laughter.
4.5–6s: the wanderers bow together while the lords clap and stamp, headdress feathers flying, sparks drifting.
CAMERA: one continuous slow push toward the wanderers for the full 6 seconds.
ENVIRONMENT: cloth ripples; sparks drift; torch smoke swirls; dust drifts in the torchlight; feathers flutter.
PRESERVE: same characters, clothing, props, architecture, palette and composition as the source image.
FORBID: cuts, scene changes, new characters, on-screen text, camera teleports, style shifts.
```

**Plan C.**

```
"source_file": "shots/shot29.jpeg",
"motion_budget": null,
"gen_len": null,
"animation_prompt": null,
"render_mode": "still",
"still_motion": "push",
"tags.camera_motion": "push"
```

## Shot 30 — gospodari i prah

**Plan A (aktivan).** Početni frejm: glavni gospodari silaze sa postolja, blizanci spremni sa otvorenim
šakama, bela svetlost se tek skuplja. Nema udarca ni pada u slici. Zamenjeno: „strike", „collapse",
„arms raised" → „stand ready with open hands raised"; „skull-painted" je u locku i ostaje, ali nije ponovljeno
u `DETAIL` (tamo je „white-painted").

**Plan B (ako A padne).** Ista slika. Menja se samo animacija: gospodari se ne raspadaju, nego ih vrtlog prašine
odnese iz kadra, a ostaju prazni ukrasi za glavu i perle.

Animation prompt:

```
MOTION BUDGET: key action lands by 9.25s; everything keeps moving at the same natural pace through the end of the 10s generation.
0–1s: the two chief lords step down from the dais with eager faces and open arms; the other lords crowd the dais edge at the right.
1–3s: the twins raise their open hands and a soft white glow gathers between them; the chief lords stop and lean toward it, smiling.
3–5s: the glow swells into a flash of white light that fills the hall and a whirl of grey dust rises from the floor around the two chief lords; their headdresses sway.
5–7.5s: the dust climbs into two tall spirals that wrap around the chief lords and carry them out of sight, bone beads clattering across the floor; the other lords stumble back.
7.5–10s: the spirals thin and drift apart across the hall as the empty headdresses tumble through the dust; the lords at the right edge shrink from the twins, torches guttering.
CAMERA: one continuous slow push toward the twins and the lords for the full 10 seconds.
ENVIRONMENT: dust spirals; beads scatter; smoke swirls; flames gutter.
PRESERVE: same characters, clothing, props, architecture, palette and composition as the source image.
FORBID: cuts, scene changes, new characters, on-screen text, camera teleports, style shifts.
```

**Plan C.**

```
"source_file": "shots/shot30.jpeg",
"motion_budget": null,
"gen_len": null,
"animation_prompt": null,
"render_mode": "still",
"still_motion": "push",
"tags.camera_motion": "push"
```

---

## Ostali shotovi sa ispravljenim početnim frejmom

| Shot | Bilo (sredina scene) | Sada (početni frejm) |
|---|---|---|
| 25 | ruke već mimiraju mlevenje | ruka otvorena iznad kamena, spremna da pokaže |
| 27 | pepeo već pada, riba-ljudi izranjaju | lordovi drže pepeo nad rekom, dno prazno |
| 28 | kuća već gori | baklja u ruci plesača, kuća cela |
| 31 | blizanci već lebde i svetle | blizanci pognute glave pred ocem, sunce i mesec još nisu nastali |

Slike za ove shotove treba generisati iznova (`node tools/flow-images.mjs episodes/hero-twins`, slike su
besplatne); klipovi za 23–31 još ne postoje, pa nijedan gotov rad ne propada.
