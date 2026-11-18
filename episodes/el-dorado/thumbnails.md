# Thumbnailovi — el-dorado

Pet koncepata, svaki u dve varijante: **A bez teksta** i **B sa tekstom**. A i B su isti prompt; B ima samo još jedan `TEXT:` blok i drugačiji `NOT IN FRAME`, pa test poredi samo natpis. Pravila po kojima su pisani su u [`docs/reference/thumbnails.md`](../../docs/reference/thumbnails.md).

## Šta je ovde drugačije od starih thumbnailova

Stari su pokušavali da ispričaju celu priču u jednom kadru (pet likova, piramida, pomračenje, naslov preko sredine). Tvoje tri reference rade suprotno:

- **jedna scena = jedna poenta** koja se vidi bez čitanja (stampedo na jednog lovca, ogromna ema naspram vojnika, kralj na belom konju pred kapijom);
- **kontrast veličina ili kontrast očekivanja** — jedan veliki lik ili predmet, jedan veliki „problem“ naspram njega;
- **namerno prazan komad neba, magle ili kamena** u jednom uglu, tamo ide natpis i ništa se ne briše sa slike;
- **mali broj jakih boja**, jedna topla tačka koja vuče oko.

Natpis nije naslov videa: to je rečenica od 3–5 reči, pouka ili misao lika, i naslov je ne ponavlja.

## Kako se koristi

1. **Flow:** Image · 16:9 · x4, prompt doslovno (jedan blok = jedan prompt). `flow-images.mjs` pravi samo slike shotova, thumbnailovi se rade ručno.
2. **A i B generiši u istoj sesiji** da prođu isti uslovi. Ako B napravi grešku u slovima, ne ispravljaj prompt: uzmi A i dodaj natpis u editoru (isti tekst, ista boja, isti ugao).
3. **Proveri** na 168×94 px (veličina u listi na telefonu): vidi li se poenta i čita li se natpis. Donji desni ugao zauzima oznaka trajanja — nema lica ni slova tamo. YouTube traži 1280×720, najviše 2 MB.
4. **Test:** u YouTube Studiju „Test & compare“ ide do tri thumbnaila. Predlog je dole, sa po jednim naslovom uz svaki.

## Pregled

| # | Koncept | Poenta | Natpis (B) | Ugao | Naslov uz njega |
|---|---|---|---|---|---|
| 1 | Poklon u jezeru | Čovek prekriven zlatom baca zlato u vodu | HE THREW THE GOLD AWAY | gore desno | El Dorado Was Never a City. It Was a Man on a Raft |
| 2 | Lovci i duh u magli | Španci traže zlatni grad, a ono što su čuli stoji u magli pred njima | THEY NEVER SAW IT | gore levo | What Was El Dorado, Really? A Gilded Lord, a Sacred Lake and a Hunt That Cost Lives |
| 3 | Isušiti jezero | Jedan čovek preseče zid jezera da bi ga ispraznio i pokupio zlato sa dna | DRAIN THE LAKE. TAKE THE GOLD. | gore levo | How a Gift Thrown Into a Mountain Lake Became the Legend of El Dorado |
| 4 | Bez ičega nazad | Čovek koji je zapisao legendu o zlatu odlazi bez zlata | I WENT BACK WITH NOTHING | gore levo | El Dorado: A Muisca Heir, a Reed Raft and the Chronicler Who Went Hunting for the Gold Himself |
| 5 | Zlatni splav iz pećine | Jedini predmet koji je preživeo: zlatni splav od 20 cm iz pećine u Pasci, a iza njega jezero sa pravim splavom | WAS THIS EL DORADO? | gore levo | From a Gilded Heir on a Raft to a Lost City on European Maps: The Story of El Dorado |

## Preporučeni test (tri od pet)

| Thumbnail | Zašto baš on | Naslov |
|---|---|---|
| **1 Poklon u jezeru** | ikona legende i preokret u jednom pokretu; najjača slika, vidi se i na malom | El Dorado Was Never a City. It Was a Man on a Raft |
| **2 Lovci i duh u magli** | misterija i „vidim nešto što oni ne vide“; hladna paleta, različita od ostala dva | What Was El Dorado, Really? A Gilded Lord, a Sacred Lake and a Hunt That Cost Lives |
| **3 Isušiti jezero** | pohlepa i akcija, ljudski lik koji gleda; druga vrsta radoznalosti („zašto?“) | How a Gift Thrown Into a Mountain Lake Became the Legend of El Dorado |

Tri različita okidača (preokret, pohlepa, misterija) i tri različite palete (zlatno-plavo, kamen-blato, indigo) znače da pobednik nešto kaže, a ne samo „ova je lepša“. Natpis je gore desno samo u prvom, u drugom i trećem je gore levo, jer taj ugao u njihovim kadrovima ništa ne zaklanja. Koncepti 4 i 5 su rezerva za drugi krug ili za thumbnail Shorta.

Naslovi su isti u `publish.md`: naslov broj N ide uz koncept broj N. Naslov ne ponavlja frazu natpisa uz koji ide; pojedinačne reči poput „gold“ i „lake“ su u ovoj priči neizbežne.

---

## 1. Poklon u jezeru

**Poenta:** Čovek prekriven zlatom baca zlato u vodu — preokret cele priče („nije blago, nego dar“) u jednom pokretu.
**Šta se vidi za sekundu:** Zlatna figura, luk zlata kroz vazduh, tamno jezero. Zlato leti, ne leži.
**Natpis (B):** „HE THREW THE GOLD AWAY“ — gore desno, tamnocrvena (#B3161B) sa tankim krem rubom. Alternative: „EL DORADO WAS A MAN (naslov videa kao natpis)“ · „HE WAS LORD (rečenica S19)“.
**Naslov uz njega:** El Dorado Was Never a City. It Was a Man on a Raft
**Pazi:** Flow filter „sexual content“ za zlatom premazan lik (flow-filter.md, el-dorado shot 13): zato je lik sa leđa i u profilu, bela tkanina do ispod kolena, zlatni pektoral, dim preko nogu. Ako Flow ipak odbije: smanji lika na pola visine kadra, tri četvrtine, mangal sa dimom ispred (Plan B iz flow-filter.md). Naslednik nikad nije gol spreda.

### 1A — bez teksta (645 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one clear moment, readable at phone size — the gold-covered Muisca heir stands on his reed raft in the middle of a round mountain lake and hurls a handful of gold and emeralds into the water: the man called El Dorado giving his gold away.
SUBJECT: a young Muisca heir of about twenty-five, a lean smooth face with high cheekbones, calm dark eyes, straight black hair cut at the shoulders, a slim upright build, a small gold ring through the nose, at the left third, large, filling two thirds of the frame height and cropped at the thigh, seen from behind and from the side with his head turned in clean profile toward the right, his back, shoulders, arms, neck, face and hair plated in glittering gold dust until he shines like a figure cast in the metal, a long plain white cotton cloth wrapped from his waist to below his knees, a broad gold pectoral disc on his chest seen edge-on from the side, a crown of upright feathers on his head, his right arm swung out to the right with the hand open and the fingers spread at the moment of release, his face calm and lifted
SUBJECT 2: a glittering arc of thrown gold flying from his open hand across the middle of the frame toward the right: flat gold figurines, discs, nose rings, rough nuggets and a few dark green emeralds, each piece catching the sun, the arc ending in a bright splash and spreading rings on the dark water at the right
SUBJECT 3: the reed raft under his feet, only its left part in the frame at the lower left: bundled yellow reeds lashed with plaited cord, a raised bundled prow, one clay incense brazier at its corner trailing grey smoke, a heap of gold and emeralds at his feet
ACTION: the last pieces of gold are still leaving his fingers while smoke from the brazier drifts across his legs
SETTING: a perfectly round mountain lake in a high Andean bowl, dark blue water ringed by steep walls of green paramo grass and low scrub, a narrow pale shore, thin mist along the rim, no building anywhere, a thin ring of tiny Muisca figures in red, ochre and indigo mantles along the far shore, far and small, arms raised
CAMERA: eye level with the heir, a little low, medium-wide shot, the camera floating still on the water beside the raft.
FRAME LAYOUT: left third — the gilded heir, large, back and profile; center — the arc of gold across the frame at chest height; right and lower right — the splash and the rings on the dark water; middle distance — the thin ring of the far shore crowd, small; upper right quarter — open, calm pale dawn sky with thin mist, smooth and EMPTY, nothing in it.
FACING: we see the heir from behind and in profile, his face turned toward screen-right and the thrown gold; the far crowd shows only raised arms and plumes.
SCREEN DIRECTION: the gold flies from left to right; ripples spread outward from the splash; smoke drifts to the right.
LIGHT: a low gold sun on the right horizon behind the arc, a bright rim of light along the heir’s gold back and shoulder, hard glints along the whole arc, a soft mist glow in the sky.
PALETTE: gold, deep lake blue, paramo green, pale dawn cream, a touch of crimson in the far mantles
DETAIL: flecks of gold dust shedding from his skin, emerald facets, the hammered edges of the flying figurines, plaited rope on the raft, crisp splash droplets.
NOT IN FRAME: any bare uncoated skin, a frontal view of his torso, Spaniards, other boats, buildings, a city, any text, letters, numbers, logos, watermarks.
```

### 1B — sa tekstom (720 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one clear moment, readable at phone size — the gold-covered Muisca heir stands on his reed raft in the middle of a round mountain lake and hurls a handful of gold and emeralds into the water: the man called El Dorado giving his gold away.
SUBJECT: a young Muisca heir of about twenty-five, a lean smooth face with high cheekbones, calm dark eyes, straight black hair cut at the shoulders, a slim upright build, a small gold ring through the nose, at the left third, large, filling two thirds of the frame height and cropped at the thigh, seen from behind and from the side with his head turned in clean profile toward the right, his back, shoulders, arms, neck, face and hair plated in glittering gold dust until he shines like a figure cast in the metal, a long plain white cotton cloth wrapped from his waist to below his knees, a broad gold pectoral disc on his chest seen edge-on from the side, a crown of upright feathers on his head, his right arm swung out to the right with the hand open and the fingers spread at the moment of release, his face calm and lifted
SUBJECT 2: a glittering arc of thrown gold flying from his open hand across the middle of the frame toward the right: flat gold figurines, discs, nose rings, rough nuggets and a few dark green emeralds, each piece catching the sun, the arc ending in a bright splash and spreading rings on the dark water at the right
SUBJECT 3: the reed raft under his feet, only its left part in the frame at the lower left: bundled yellow reeds lashed with plaited cord, a raised bundled prow, one clay incense brazier at its corner trailing grey smoke, a heap of gold and emeralds at his feet
ACTION: the last pieces of gold are still leaving his fingers while smoke from the brazier drifts across his legs
SETTING: a perfectly round mountain lake in a high Andean bowl, dark blue water ringed by steep walls of green paramo grass and low scrub, a narrow pale shore, thin mist along the rim, no building anywhere, a thin ring of tiny Muisca figures in red, ochre and indigo mantles along the far shore, far and small, arms raised
CAMERA: eye level with the heir, a little low, medium-wide shot, the camera floating still on the water beside the raft.
FRAME LAYOUT: left third — the gilded heir, large, back and profile; center — the arc of gold across the frame at chest height; right and lower right — the splash and the rings on the dark water; middle distance — the thin ring of the far shore crowd, small; upper right quarter — open, calm pale dawn sky with thin mist, smooth and EMPTY, nothing in it.
TEXT: in the upper right quarter, the words "HE THREW THE GOLD AWAY" on two lines, "HE THREW" above "THE GOLD AWAY", huge bold hand-lettered capitals with a heavy cut-out look, deep crimson red (#B3161B) with a thin cream outline and a soft dark shadow, straight and not rotated, sitting only on the empty area and touching nothing else, spelled exactly like this, no other words anywhere in the image.
FACING: we see the heir from behind and in profile, his face turned toward screen-right and the thrown gold; the far crowd shows only raised arms and plumes.
SCREEN DIRECTION: the gold flies from left to right; ripples spread outward from the splash; smoke drifts to the right.
LIGHT: a low gold sun on the right horizon behind the arc, a bright rim of light along the heir’s gold back and shoulder, hard glints along the whole arc, a soft mist glow in the sky.
PALETTE: gold, deep lake blue, paramo green, pale dawn cream, a touch of crimson in the far mantles
DETAIL: flecks of gold dust shedding from his skin, emerald facets, the hammered edges of the flying figurines, plaited rope on the raft, crisp splash droplets.
NOT IN FRAME: any bare uncoated skin, a frontal view of his torso, Spaniards, other boats, buildings, a city, logos, watermarks, any words or letters other than the title text.
```

---

## 2. Lovci i duh u magli

**Poenta:** Španci traže zlatni grad, a ono što su čuli stoji u magli pred njima — i ne vide ga. Gledalac vidi ono što lovci ne vide.
**Šta se vidi za sekundu:** Tri čelične kacige u kontra-svetlu, ogromno jezero u magli i jedna mala topla zlatna tačka u sredini.
**Natpis (B):** „THEY NEVER SAW IT“ — gore levo, jarkozlatna (#FFC62E) sa debelim tamnosmeđim rubom. Alternative: „NEVER A CITY (iz naslova videa)“ · „A MAN, NOT A CITY“.
**Naslov uz njega:** What Was El Dorado, Really? A Gilded Lord, a Sacred Lake and a Hunt That Cost Lives
**Pazi:** Tačnost: nijedan Španac nije video ceremoniju (notes.md), zato je splav DUH u magli — prikazan samo gledaocu, kao u shotu 29 — a lovci gledaju prazno jezero. Muisca ne smeju biti na obali.

### 2A — bez teksta (548 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: the hunters’ view of the legend — three Spanish conquistadors on a rocky ridge stare across a round mountain lake full of mist, looking for a golden city; only the viewer can see, faint in the mist, the reed raft and the glowing gold figure that the hunters never saw.
SUBJECT: a Spanish conquistador captain in his fifties, a weathered square face, a short grizzled beard, a steel morion helmet, a dented steel breastplate over a stained red-brown doublet, a sword belt at the hip, in front at the right third, large, from the chest up, seen from behind and in profile, his helmeted head turned toward the left, one hand held flat above his brows against the glare, the other arm stretched out across the lake, pointing
SUBJECT 2: two companions, Spanish conquistadors of the 1530s, bearded sunburned men in steel morion helmets, dented breastplates or quilted cotton jackets, leather boots, swords at the hip, one arquebus slung across a shoulder, exactly two, a step behind the captain and a little lower, smaller in the frame, seen from behind in their helmets, both staring toward the left
SUBJECT 3: a faint translucent ghost of the ceremony: a reed raft with four thin trails of smoke and one tiny upright figure glowing gold, small and far at the left center of the lake, half dissolved in the mist, as if remembered rather than seen
ACTION: the captain points, the men search the water, the wind bends the grass on the ridge, the mist drifts slowly across the lake toward the left
SETTING: a perfectly round mountain lake in a high Andean bowl at dusk, thick white mist lying on the whole water and thinning toward the rim, steep walls of green paramo grass, no building anywhere; in the foreground a rocky ridge with tussock grass and a few furry frailejon plants
CAMERA: just behind and slightly below the men’s shoulders, eye level, medium-wide shot, the camera still.
FRAME LAYOUT: right third — the three conquistadors, the captain largest, cropped at the chest; left center — the misty lake with the ghost raft glowing at its heart; lower left — dark ridge rock with a few frailejones, kept simple; upper left — open deep indigo dusk sky fading into grey mist, smooth and EMPTY, nothing in it.
FACING: all three men are seen from behind and in profile, looking toward screen-left, none looking at the viewer.
SCREEN DIRECTION: the captain’s arm points from right to left; the mist drifts toward the left; the glow of the ghost figure rises slowly.
LIGHT: cold blue dusk light with a bright rim of light along the steel helmets and breastplates; the ghost figure is the only warm gold in the frame and its glow stains the nearest mist.
PALETTE: indigo, mist grey, cold steel, one warm gold glow
DETAIL: dented steel and rivets on the helmets, the grain of the breastplates, frost-white tussock grass, the glow on the mist, the faint braziers and the four threads of smoke on the ghost raft.
NOT IN FRAME: Muisca people, a crowd on the shore, a visible ceremony, a city, buildings, boats, any text, letters, numbers, logos, watermarks.
```

### 2B — sa tekstom (620 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: the hunters’ view of the legend — three Spanish conquistadors on a rocky ridge stare across a round mountain lake full of mist, looking for a golden city; only the viewer can see, faint in the mist, the reed raft and the glowing gold figure that the hunters never saw.
SUBJECT: a Spanish conquistador captain in his fifties, a weathered square face, a short grizzled beard, a steel morion helmet, a dented steel breastplate over a stained red-brown doublet, a sword belt at the hip, in front at the right third, large, from the chest up, seen from behind and in profile, his helmeted head turned toward the left, one hand held flat above his brows against the glare, the other arm stretched out across the lake, pointing
SUBJECT 2: two companions, Spanish conquistadors of the 1530s, bearded sunburned men in steel morion helmets, dented breastplates or quilted cotton jackets, leather boots, swords at the hip, one arquebus slung across a shoulder, exactly two, a step behind the captain and a little lower, smaller in the frame, seen from behind in their helmets, both staring toward the left
SUBJECT 3: a faint translucent ghost of the ceremony: a reed raft with four thin trails of smoke and one tiny upright figure glowing gold, small and far at the left center of the lake, half dissolved in the mist, as if remembered rather than seen
ACTION: the captain points, the men search the water, the wind bends the grass on the ridge, the mist drifts slowly across the lake toward the left
SETTING: a perfectly round mountain lake in a high Andean bowl at dusk, thick white mist lying on the whole water and thinning toward the rim, steep walls of green paramo grass, no building anywhere; in the foreground a rocky ridge with tussock grass and a few furry frailejon plants
CAMERA: just behind and slightly below the men’s shoulders, eye level, medium-wide shot, the camera still.
FRAME LAYOUT: right third — the three conquistadors, the captain largest, cropped at the chest; left center — the misty lake with the ghost raft glowing at its heart; lower left — dark ridge rock with a few frailejones, kept simple; upper left — open deep indigo dusk sky fading into grey mist, smooth and EMPTY, nothing in it.
TEXT: in the upper left corner, the words "THEY NEVER SAW IT" on two lines, "THEY NEVER" above "SAW IT", huge bold hand-lettered capitals with a heavy cut-out look, bright gold-yellow (#FFC62E) with a thick dark brown outline and a soft shadow, straight and not rotated, sitting only on the empty area and touching nothing else, spelled exactly like this, no other words anywhere in the image.
FACING: all three men are seen from behind and in profile, looking toward screen-left, none looking at the viewer.
SCREEN DIRECTION: the captain’s arm points from right to left; the mist drifts toward the left; the glow of the ghost figure rises slowly.
LIGHT: cold blue dusk light with a bright rim of light along the steel helmets and breastplates; the ghost figure is the only warm gold in the frame and its glow stains the nearest mist.
PALETTE: indigo, mist grey, cold steel, one warm gold glow
DETAIL: dented steel and rivets on the helmets, the grain of the breastplates, frost-white tussock grass, the glow on the mist, the faint braziers and the four threads of smoke on the ghost raft.
NOT IN FRAME: Muisca people, a crowd on the shore, a visible ceremony, a city, buildings, boats, logos, watermarks, any words or letters other than the title text.
```

---

## 3. Isušiti jezero

**Poenta:** Jedan čovek preseče zid jezera da bi ga ispraznio i pokupio zlato sa dna — pohlepa iza lova na El Dorado, u akciji.
**Šta se vidi za sekundu:** Mlaz mutne vode kroz urez, polupuno jezero sa blatom i varnicama zlata, čovek u šeširu koji gleda i zna šta hoće.
**Natpis (B):** „DRAIN THE LAKE. TAKE THE GOLD.“ — gore levo, krem (#FFF1CF) sa debelim crnim rubom. Alternative: „THEY DRAINED THE LAKE“ · „12,000 PESOS FROM THE MUD (Sepúlvedina tvrdnja, S33)“.
**Naslov uz njega:** How a Gift Thrown Into a Mountain Lake Became the Legend of El Dorado
**Pazi:** Tačnost: Sepúlveda je prosekao kanal i spustio vodu, ne ispraznio jezero do dna (drugi put nije mogao dublje). Zato je jezero „spušteno“, ne suvo. Dvanaest hiljada pesosa je njegova sopstvena tvrdnja i ne ide u natpis kao činjenica.

### 3A — bez teksta (506 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one man has cut a gash through the wall of a sacred lake to drain it and pick the gold off its shore — the greed behind the hunt for El Dorado, caught in the act.
SUBJECT: a Spanish colonial merchant-engineer in his forties, a broad sunburned face, a dark pointed beard, a wide-brimmed felt hat, a worn leather jerkin over a white shirt with rolled sleeves, at the right third, large, from the waist up, seen from behind and from the side with his face in three-quarter profile turned down and toward the left, the brim of his hat shading his eyes, one fist on his hip, the other arm stretched out toward the cut, a grim satisfied set to his mouth
SUBJECT 2: a raw man-made gash cut through the green grass wall of the crater at the lower center-left, a thundering torrent of brown muddy water pouring out through it and down the slope toward the camera, white foam and spray, about a dozen tiny workers with spades and baskets on both lips of the cut, far and small
SUBJECT 3: the round lake beyond the cut, its level visibly lowered: a wide ring of pale wet mud shore exposed all around the water, gold nuggets and small gold figurines scattered in the mud and glinting like sparks
ACTION: the torrent roars through the cut, the workers dig at its edges, the man watches the water drop and the gold appear
SETTING: a high Andean crater lake in a bowl of green paramo grass under heavy storm clouds, no building, no ships, no Muisca crowd
CAMERA: low angle from beside the man’s shoulder, medium-wide shot, the camera still.
FRAME LAYOUT: right third — the man, large, cropped at the waist; lower center and lower left — the cut and the torrent; center — the half-emptied lake with its pale muddy ring and the sparks of gold; upper left — a big bank of dark slate-grey storm cloud, smooth and EMPTY, nothing in it.
FACING: we see the man from behind and the side, his face in three-quarter profile turned toward screen-left and down at the cut; the workers are tiny and faceless.
SCREEN DIRECTION: the water pours from the cut toward the camera and to the right; his arm points from right to left; clouds drift to the right.
LIGHT: a single break in the storm clouds drops a warm gold shaft onto the exposed mud so the scattered gold sparkles; cool flat light on the man’s face; wet shine on the torrent.
PALETTE: storm slate, wet mud brown, paramo green, gold sparks
DETAIL: the grain of the leather jerkin, the sweat on his sunburned face, the torn turf at the lips of the cut, foam and flying droplets, the glints of gold in the mud.
NOT IN FRAME: Muisca people, a ceremony, a gilded man, ships, buildings, a city, any text, letters, numbers, logos, watermarks.
```

### 3B — sa tekstom (581 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one man has cut a gash through the wall of a sacred lake to drain it and pick the gold off its shore — the greed behind the hunt for El Dorado, caught in the act.
SUBJECT: a Spanish colonial merchant-engineer in his forties, a broad sunburned face, a dark pointed beard, a wide-brimmed felt hat, a worn leather jerkin over a white shirt with rolled sleeves, at the right third, large, from the waist up, seen from behind and from the side with his face in three-quarter profile turned down and toward the left, the brim of his hat shading his eyes, one fist on his hip, the other arm stretched out toward the cut, a grim satisfied set to his mouth
SUBJECT 2: a raw man-made gash cut through the green grass wall of the crater at the lower center-left, a thundering torrent of brown muddy water pouring out through it and down the slope toward the camera, white foam and spray, about a dozen tiny workers with spades and baskets on both lips of the cut, far and small
SUBJECT 3: the round lake beyond the cut, its level visibly lowered: a wide ring of pale wet mud shore exposed all around the water, gold nuggets and small gold figurines scattered in the mud and glinting like sparks
ACTION: the torrent roars through the cut, the workers dig at its edges, the man watches the water drop and the gold appear
SETTING: a high Andean crater lake in a bowl of green paramo grass under heavy storm clouds, no building, no ships, no Muisca crowd
CAMERA: low angle from beside the man’s shoulder, medium-wide shot, the camera still.
FRAME LAYOUT: right third — the man, large, cropped at the waist; lower center and lower left — the cut and the torrent; center — the half-emptied lake with its pale muddy ring and the sparks of gold; upper left — a big bank of dark slate-grey storm cloud, smooth and EMPTY, nothing in it.
TEXT: in the upper left corner, the words "DRAIN THE LAKE. TAKE THE GOLD." on two lines, "DRAIN THE LAKE." above "TAKE THE GOLD.", huge bold hand-lettered capitals with a heavy cut-out look, cream white (#FFF1CF) with a thick black outline and a soft shadow, straight and not rotated, sitting only on the empty area and touching nothing else, spelled exactly like this, no other words anywhere in the image.
FACING: we see the man from behind and the side, his face in three-quarter profile turned toward screen-left and down at the cut; the workers are tiny and faceless.
SCREEN DIRECTION: the water pours from the cut toward the camera and to the right; his arm points from right to left; clouds drift to the right.
LIGHT: a single break in the storm clouds drops a warm gold shaft onto the exposed mud so the scattered gold sparkles; cool flat light on the man’s face; wet shine on the torrent.
PALETTE: storm slate, wet mud brown, paramo green, gold sparks
DETAIL: the grain of the leather jerkin, the sweat on his sunburned face, the torn turf at the lips of the cut, foam and flying droplets, the glints of gold in the mud.
NOT IN FRAME: Muisca people, a ceremony, a gilded man, ships, buildings, a city, logos, watermarks, any words or letters other than the title text.
```

---

## 4. Bez ičega nazad

**Poenta:** Čovek koji je zapisao legendu o zlatu odlazi bez zlata — sveštenik leži ničice pred crnim jezerom. Ljudski vrhunac priče.
**Šta se vidi za sekundu:** Bela mrlja na crnom kamenju (sveštenik), čovek u crnom iznad njega, crno jezero. Nešto je pošlo naopako.
**Natpis (B):** „I WENT BACK WITH NOTHING“ — gore levo, jarkonarandžasta (#FF7A1A) sa debelim skoro crnim rubom. Alternative: „I LEFT HIM THERE“ · „HE NEVER SAID WHY (S49)“.
**Naslov uz njega:** El Dorado: A Muisca Heir, a Reed Raft and the Chronicler Who Went Hunting for the Gold Himself
**Pazi:** Rezervni koncept: slika ne kaže „El Dorado“ na prvi pogled, pa se oslanja na natpis i naslov. Najjači je kao thumbnail za Short iz poslednje trećine (shotovi 31–34). Navod je Freyleov i doslovan iz skripte (S48).

### 4A — bez teksta (543 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: the loneliest moment of the hunt — the chronicler who wrote down the El Dorado ceremony stands over the old priest who has thrown himself face down on the shore of a black mountain lake, and he will go back with nothing.
SUBJECT: a lean Spanish colonial chronicler of about fifty, a long narrow face, deep-set dark eyes, a short pointed beard streaked with grey, a plain black doublet with a flat white collar, ink-stained fingers, at the right third, standing, large, cropped at the thigh, a long black cloak over the doublet, his flat black hat crushed in one hand, three-quarter view turned toward the left and down, his face stunned and hollow, not triumphant
SUBJECT 2: an old Muisca priest, a lean weathered face with deep lines, long grey hair tied back with a cotton band, a plain white cotton mantle, a small gold pendant on a cord, bare feet, lying face down on the stony shore at the lower center-left with his arms stretched out toward the water, his white cotton mantle spread across the dark stones, his long grey hair loose, the whitest and brightest shape in the frame
SUBJECT 3: a small dark lake high in the paramo, black water under low cloud, a rim of tussock grass and furry frailejon plants, a rocky shore, bare windswept hills, two faint warm gold glints deep under the black water side by side, the vague outline of two small caimans, barely visible
ACTION: the priest lies still, the man stands over him with his hand open, the wind moves the tufts of frailejon grass and nothing else moves
SETTING: the shore of a small dark lake high in the paramo under low cloud, a rocky edge with tussock grass and furry frailejon plants at the lower right, bare windswept hills, no building
CAMERA: low, near the ground on the shore, eye level with the fallen priest, medium-wide shot, the camera still.
FRAME LAYOUT: right third — the chronicler, large, cropped at the thigh; lower center-left — the priest on the dark stones; across the middle — the black lake with the two faint glints; lower right edge — frailejon plants on rock; upper left — low pale grey cloud, soft, smooth and EMPTY, nothing in it.
FACING: the chronicler is seen in three-quarter view looking down and to the left at the priest; the priest lies with his head toward screen-left and the water; neither looks at the viewer.
SCREEN DIRECTION: the lake lies at the left; the cloud drifts slowly to the left; the man’s gaze runs from right to left and down.
LIGHT: cold grey overcast, soft and without hard shadows; only the white mantle, the small gold pendant on the priest’s chest and the two glints in the water carry any warmth.
PALETTE: slate grey, black water, bone white, a small warm gold accent
DETAIL: the weave of the cotton mantle, wet stones, the pendant on its cord, ink on his fingertips, hoar on the tussock grass, the faint glints under the water.
NOT IN FRAME: Muisca crowds, soldiers, buildings, boats, a golden city, any text, letters, numbers, logos, watermarks.
```

### 4B — sa tekstom (616 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: the loneliest moment of the hunt — the chronicler who wrote down the El Dorado ceremony stands over the old priest who has thrown himself face down on the shore of a black mountain lake, and he will go back with nothing.
SUBJECT: a lean Spanish colonial chronicler of about fifty, a long narrow face, deep-set dark eyes, a short pointed beard streaked with grey, a plain black doublet with a flat white collar, ink-stained fingers, at the right third, standing, large, cropped at the thigh, a long black cloak over the doublet, his flat black hat crushed in one hand, three-quarter view turned toward the left and down, his face stunned and hollow, not triumphant
SUBJECT 2: an old Muisca priest, a lean weathered face with deep lines, long grey hair tied back with a cotton band, a plain white cotton mantle, a small gold pendant on a cord, bare feet, lying face down on the stony shore at the lower center-left with his arms stretched out toward the water, his white cotton mantle spread across the dark stones, his long grey hair loose, the whitest and brightest shape in the frame
SUBJECT 3: a small dark lake high in the paramo, black water under low cloud, a rim of tussock grass and furry frailejon plants, a rocky shore, bare windswept hills, two faint warm gold glints deep under the black water side by side, the vague outline of two small caimans, barely visible
ACTION: the priest lies still, the man stands over him with his hand open, the wind moves the tufts of frailejon grass and nothing else moves
SETTING: the shore of a small dark lake high in the paramo under low cloud, a rocky edge with tussock grass and furry frailejon plants at the lower right, bare windswept hills, no building
CAMERA: low, near the ground on the shore, eye level with the fallen priest, medium-wide shot, the camera still.
FRAME LAYOUT: right third — the chronicler, large, cropped at the thigh; lower center-left — the priest on the dark stones; across the middle — the black lake with the two faint glints; lower right edge — frailejon plants on rock; upper left — low pale grey cloud, soft, smooth and EMPTY, nothing in it.
TEXT: in the upper left corner, the words "I WENT BACK WITH NOTHING" on two lines, "I WENT BACK" above "WITH NOTHING", huge bold hand-lettered capitals with a heavy cut-out look, vivid orange (#FF7A1A) with a thick near-black outline and a soft shadow, straight and not rotated, sitting only on the empty area and touching nothing else, spelled exactly like this, no other words anywhere in the image.
FACING: the chronicler is seen in three-quarter view looking down and to the left at the priest; the priest lies with his head toward screen-left and the water; neither looks at the viewer.
SCREEN DIRECTION: the lake lies at the left; the cloud drifts slowly to the left; the man’s gaze runs from right to left and down.
LIGHT: cold grey overcast, soft and without hard shadows; only the white mantle, the small gold pendant on the priest’s chest and the two glints in the water carry any warmth.
PALETTE: slate grey, black water, bone white, a small warm gold accent
DETAIL: the weave of the cotton mantle, wet stones, the pendant on its cord, ink on his fingertips, hoar on the tussock grass, the faint glints under the water.
NOT IN FRAME: Muisca crowds, soldiers, buildings, boats, a golden city, logos, watermarks, any words or letters other than the title text.
```

---

## 5. Zlatni splav iz pećine

**Poenta:** Jedini predmet koji je preživeo: zlatni splav od 20 cm iz pećine u Pasci, a iza njega jezero sa pravim splavom. Minijatura i događaj u istom kadru.
**Šta se vidi za sekundu:** Ruke drže blistav zlatni splav u mraku, a kroz otvor pećine sija jezero. Predmet je glavni junak.
**Natpis (B):** „WAS THIS EL DORADO?“ — gore levo, smaragdna mint (#2BE3A0) sa debelim crnim rubom. Alternative: „FOUND IN A CAVE, 1969“ · „20 CM OF GOLD“.
**Naslov uz njega:** From a Gilded Heir on a Raft to a Lost City on European Maps: The Story of El Dorado
**Pazi:** Tačnost: raft je iz Pasce, ne sa Guatavite (S40), i nije dokaz ceremonije (S41) — zato natpis pita, ne tvrdi. Ruke su najčešća greška generatora: gledaj sve četiri varijante, brojanje deset figura nije bitno za thumbnail ali sedeći poglavica u sredini jeste.

### 5A — bez teksta (545 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: the clue that turned up in a cave — an old farmer’s hands lift a small cast-gold raft, a seated chief and ten figures around him, out of the dark, while the round sacred lake glows beyond the cave mouth and a tiny reed raft floats on it in the same arrangement.
SUBJECT: two weathered brown hands of an old farmer at the lower left, thick cracked fingers with dirt under the nails, the frayed cuff of a rough cotton sleeve, cupped under and lifting a small cast-gold raft twenty centimetres long, a seated chief at the center with his arms crossed over his chest, ten smaller figures standing in a ring around him, some masked, a rough granular surface, the raft large in the frame, about two fifths of the frame width, tilted slightly toward the camera so that the seated chief and the ring of ten figures all read clearly
SUBJECT 2: the warm beam of a hand lantern from the lower left cutting through floating dust and lighting the gold raft so that it blazes against the black
SUBJECT 3: at the right third, the mouth of the cave as a bright opening framing a perfectly round mountain lake in a high Andean bowl, dark blue water ringed by steep walls of green paramo grass and low scrub, a narrow pale shore, thin mist along the rim, no building anywhere, seen at dawn, with a tiny reed raft at the center of the water trailing four thin threads of smoke
ACTION: the hands hold the raft perfectly still, dust turns in the lantern beam, the threads of smoke rise from the tiny raft on the far lake
SETTING: a low dry cave in an Andean hillside, rough grey rock walls, a clay pot half full of gold ornaments and one green emerald at the lower right edge
CAMERA: close-medium shot from slightly below the raft, looking up a little, the camera still.
FRAME LAYOUT: lower left to center — the hands and the blazing gold raft, large; right third — the cave mouth with the dawn lake and the tiny raft; lower right edge — the clay pot; upper left and across the top — the black rough rock of the cave ceiling, dark, smooth and EMPTY, nothing in it.
FACING: the seated gold chief faces the viewer, his arms crossed over his chest; the hands come in from the lower left edge; the lake at the right is seen straight on.
SCREEN DIRECTION: the lantern beam runs from lower left toward upper right; the smoke on the far lake rises straight up.
LIGHT: the lantern beam in warm gold from the lower left; cool blue-gold dawn light from the cave mouth; everything else in deep shadow.
PALETTE: cave black, blazing gold, dawn blue, a touch of emerald green
DETAIL: the rough granular surface of the cast gold, tiny masks on some of the figures, dust in the beam, dirt in the creases of the fingers, the hammered rim of a gold disc in the pot.
NOT IN FRAME: a museum, glass cases, Spaniards, a gilded man, a crowd, any text, letters, numbers, logos, watermarks.
```

### 5B — sa tekstom (617 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: the clue that turned up in a cave — an old farmer’s hands lift a small cast-gold raft, a seated chief and ten figures around him, out of the dark, while the round sacred lake glows beyond the cave mouth and a tiny reed raft floats on it in the same arrangement.
SUBJECT: two weathered brown hands of an old farmer at the lower left, thick cracked fingers with dirt under the nails, the frayed cuff of a rough cotton sleeve, cupped under and lifting a small cast-gold raft twenty centimetres long, a seated chief at the center with his arms crossed over his chest, ten smaller figures standing in a ring around him, some masked, a rough granular surface, the raft large in the frame, about two fifths of the frame width, tilted slightly toward the camera so that the seated chief and the ring of ten figures all read clearly
SUBJECT 2: the warm beam of a hand lantern from the lower left cutting through floating dust and lighting the gold raft so that it blazes against the black
SUBJECT 3: at the right third, the mouth of the cave as a bright opening framing a perfectly round mountain lake in a high Andean bowl, dark blue water ringed by steep walls of green paramo grass and low scrub, a narrow pale shore, thin mist along the rim, no building anywhere, seen at dawn, with a tiny reed raft at the center of the water trailing four thin threads of smoke
ACTION: the hands hold the raft perfectly still, dust turns in the lantern beam, the threads of smoke rise from the tiny raft on the far lake
SETTING: a low dry cave in an Andean hillside, rough grey rock walls, a clay pot half full of gold ornaments and one green emerald at the lower right edge
CAMERA: close-medium shot from slightly below the raft, looking up a little, the camera still.
FRAME LAYOUT: lower left to center — the hands and the blazing gold raft, large; right third — the cave mouth with the dawn lake and the tiny raft; lower right edge — the clay pot; upper left and across the top — the black rough rock of the cave ceiling, dark, smooth and EMPTY, nothing in it.
TEXT: in the upper left corner, the words "WAS THIS EL DORADO?" on two lines, "WAS THIS" above "EL DORADO?", huge bold hand-lettered capitals with a heavy cut-out look, bright emerald-mint green (#2BE3A0) with a thick black outline and a soft shadow, straight and not rotated, sitting only on the empty area and touching nothing else, spelled exactly like this, no other words anywhere in the image.
FACING: the seated gold chief faces the viewer, his arms crossed over his chest; the hands come in from the lower left edge; the lake at the right is seen straight on.
SCREEN DIRECTION: the lantern beam runs from lower left toward upper right; the smoke on the far lake rises straight up.
LIGHT: the lantern beam in warm gold from the lower left; cool blue-gold dawn light from the cave mouth; everything else in deep shadow.
PALETTE: cave black, blazing gold, dawn blue, a touch of emerald green
DETAIL: the rough granular surface of the cast gold, tiny masks on some of the figures, dust in the beam, dirt in the creases of the fingers, the hammered rim of a gold disc in the pot.
NOT IN FRAME: a museum, glass cases, Spaniards, a gilded man, a crowd, logos, watermarks, any words or letters other than the title text.
```
