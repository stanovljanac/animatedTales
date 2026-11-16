# buffalo-jump — alternative za Flow

Redosled pokušaja za svaki rizičan shot ([`docs/reference/flow-filter.md`](../../docs/reference/flow-filter.md)):

1. **Plan A** — original (početni frejm, radnja kako je skripta traži). Ovo stoji u `storyboard.json`.
2. **Plan B** — alternativna slika i animacija, sa zamenjenim rečima i preusmerenom radnjom.
3. **Plan C** — still sa slikom koja je prošla (ili sa najboljom koju imaš), bez Flow klipa.

`node tools/flow-risk.mjs episodes/buffalo-jump` nema nijedan signal (nijedna sporna reč, nijedan početni frejm iz
sredine radnje), a deca i krv su izbačeni iz svih promptova. Ovih sedam shotova su ipak rizični **po smislu**:
životinje koje padaju, ranjena životinja pod kopljima, rasparčavanje, i priča o mladiću ispod litice. Plan B je napisan
unapred; menja se samo kad Flow odbije (poruku traži tačnu, ne pogađa se kategorija).

| Shot | Rizik | Plan B | Plan C |
|---|---|---|---|
| 27 | vođe stoje na ivici, stado ih gura (pad životinja) | silueta: samo prašina nad ivicom i tamne siluete u njoj, nijedna životinja ne prelazi ivicu | still `push` |
| 29 | stojeći bizon pod kopljima (ranjena životinja) | bizon se smiruje u prašini, lovci stoje u širokom polukrugu bez koplja uperenih ka njemu | still `push` |
| 32 | sečenje mesa i struganje koža (telo) | široki noćni kadar: vatre, razapete kože i police, ljudi mali i bez pogleda na leševe | still `pull` |
| 43 | mala figura mladića (maloletnik) | nema figure: samo ispust u plavoj senci i prašina; kamera ide ka ispustu | still `push` |
| 44 | mladić pod ispustom, životinje rastu ka njemu | nema figure: prazan ispust, gomila tamnih oblika raste ka senci | still `push` |
| 45 | vuča životinja sa ispusta, nalaz tela | ljudi vuku užad, zaustave se i spuste glave; nijedna ruka ni telo ne dodiruju ispust | still `push` |
| 50 | jedna životinja pada sa litice | stado probija liniju i beži ulevo, jahači se okreću; litica je prazna, bez životinje na ivici | still `push` |

## Plan B — šta se menja

Isto za svih sedam: **zamena reči** u animation promptu (strikes → nema; stumbles over the lip → izbačeno; drags →
„slides a pace away"), **nova slika** kad je okidač u slici (43 i 44 bez figure; 29 i 45 bez uperenih koplja i sa
mrtvom prirodom oko ispusta), **preusmerena radnja** (27 → prašina i silueta umesto skoka, 50 → probijena linija bez
pada).

### 27 — vođe stoje na ivici

```
Image: ACTION: dust boils over the empty lip of the cliff while the dark outlines of the lead bison and the packed herd crowd the edge as black silhouettes inside the dust; no animal crosses the lip.
       FRAME LAYOUT: lower right — the lip, near-camera; center and left — the dust and the silhouettes, medium; upper third — gold sky.
Anim:  0–1s: the dust cloud rolls forward over the lip and the dark silhouettes inside it surge and pause; 1–3s: the camera pushes toward the edge as more silhouettes press into the haze; 3–5s: the cloud thickens and glows gold; 5–6s: the roar of hooves keeps rising and the dust streams toward the right.
```

### 29 — stojeći bizon

```
Image: ACTION: one big bison stands in the settling dust at the foot of the cliff while the hunters stand in a wide half-ring, spears held upright beside them, none levelled.
Anim:  the bison turns its heavy shoulders and blows; the hunters keep moving round it at a distance, step by step, spears upright; no lunge, no contact.
```

### 32 — noć na licu mesta

```
Image: wide night view: ring of fires, hides pegged flat in rows, long rows of meat strips on clean hides; people small, bent over the hides, seen from far.
Anim:  sparks and smoke rise, small figures carry strips of meat and bundles between fires; no close action on any carcass.
```

### 43 i 44 — mladić

```
43 Image: the shadowed ledge at the foot of the cliff in blue shadow, boulders and tall grass, a faint footpath leading toward it, no person anywhere.
   Anim:  the camera creeps toward the ledge along the footpath, grass whipping, a far roar swelling, dust drifting above.
44 Image: the empty ledge in blue shadow, the heap of dark animal shapes rising toward its mouth, dust falling; no figure inside the ledge.
   Anim:  the heap climbs toward the ledge, dust falls in sheets, the light dims in the hollow.
```

### 45 — vuča

```
Image: hunters on their ropes at the left dragging a heavy animal clear; the ledge at the right is only a dark hollow, no hands or body near it.
Anim:  the hunters haul and then stop, lower their heads, one carries a hide toward the ledge and the camera holds on the hunters' faces, not on the hollow.
```

### 50 — probijena linija

```
Image: ACTION: the herd has broken through the line of cairns and scatters back across the snow toward the left while the riders wheel after it; the cliff at the far right is empty.
Anim:  slice 3–5s ends with "the scattered streams of animals keep running across the plain while the riders ride in circles trying to gather them".
```

## Plan C

```
"source_file": "shots/shotNN.jpeg",
"motion_budget": null,
"gen_len": null,
"animation_prompt": null,
"render_mode": "still",
"still_motion": "push",
"tags.camera_motion": "push"
```

Posle svake izmene: `node tools/lint.mjs episodes/buffalo-jump`, pa `node tools/render.mjs episodes/buffalo-jump`.
Ne menjaj shotove koje korisnik nije prijavio.
