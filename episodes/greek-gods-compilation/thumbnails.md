# Thumbnailovi — greek-gods-compilation

Tri koncepta, svaki u dve varijante: **A bez teksta** i **B sa tekstom**. A i B su isti prompt; B ima samo još jedan `TEXT:` blok i drugačiji `NOT IN FRAME`, pa test poredi samo natpis. Pravila su u [`docs/reference/thumbnails.md`](../../docs/reference/thumbnails.md); tri koncepta umesto pet jer YouTube „Test & compare“ prima najviše tri, a odluka je da se testiraju tri različita thumbnaila uz tri različita naslova.

**Izmena 2026-11-22:** koncept sa Hefestom, mrežom i parom u krevetu je izbačen (korisniku se nije dopao); zamenila ga je Hera u lancu. Koncept sa prestolima je prepravljen da broj bude tačno 12 (v. odeljak ispod).

## Šta ovaj komplet mora da obeća

Compilation prodaje **celu porodicu**, ne jedan deo priče. Tri okidača su različita, kao u el-dorado testu: **celina** (dvanaest prestola oko vatre), **mračno poreklo** (otac i sin) i **porodična okrutnost** (kralj je okovao svoju ženu). Tri palete se razlikuju (sumrak plavo i vatra / olujno sivo i plavi sjaj / olujno plavo-sivo i crveni plašt sa zlatnim lancem). Nijedan natpis ne tvrdi više nego što video kaže: Kron je progutao svoju decu, Zevs je progutao ženu, Zevs je okovao Heru (Part 2: zlatni lanac na zglobovima i dva nakovnja na stopalima).

## Kako se koristi

1. **Flow:** Image · 16:9 · x4, prompt doslovno (jedan blok = jedan prompt). A i B generiši u istoj sesiji. Ako B napravi grešku u slovima, uzmi A i dodaj natpis u editoru (isti tekst, boja i ugao).
2. **Proveri** na 168×94 px: vidi li se poenta i čita li se natpis. Donji desni ugao zauzima oznaka trajanja; nema lica ni slova tamo. YouTube traži 1280×720, najviše 2 MB.
3. **Test:** „Test & compare“ sa tri thumbnaila i tri naslova, par po rednom broju (naslov N uz koncept N; naslovi su u `publish.md`).

## Pregled

| # | Koncept | Šta se vidi | Natpis (B) | Ugao | Naslov uz njega |
|---|---|---|---|---|---|
| 1 | Dvanaest prestola oko jedne vatre | Prsten od prestola sa svetlećim znakovima i jedna jarka vatra u sredini, odozgo, hladno nebo i oblaci oko njih. | ONE FIRE. TWELVE THRONES. | gore levo | The Complete Saga of the 12 Greek Gods and Their Family: From Cronus to the Net |
| 2 | Otac i sin | Ogroman starac u oluji, mali bog sa plavim sjajem u grudima. Dva lica, jedna porodica. | HIS SON SWALLOWED A WIFE | gore levo | 12 Greek Gods, One Family: The Prophecy That Made Cronus Swallow His Own Children |
| 3 | Kralj je okovao svoju ženu | Velika boginja u crvenom plaštu u zlatnom lancu na oluji, dva nakovnja ispod stopala, sićušan ljutit bog dole levo. | HE CHAINED HIS WIFE | gore levo | Why Did the Greek Gods Keep Swallowing and Trapping Each Other? The Full Story of 12 Gods |

Natpis nije naslov videa i naslov ga ne ponavlja: koncept 1 kaže „jedna vatra, dvanaest prestola“, naslov 1 „saga i porodica“; koncept 2 vuče „progutano“, naslov 2 proročanstvo (dele samo „swallow“); koncept 3 kaže „okovao ženu“, naslov 3 pita zašto su se gutali i hvatali.

---

## Kako dobiti tačno 12 prestola (koncept 1)

Generatori slika loše broje ponovljene predmete u perspektivi: sa prstenom u kosom pogledu i velikim prestolima u prvom planu dodaju „još jedan“ da kadar izgleda pun. Ovaj prompt je zato prepravljen na pet mesta, i svako ima razlog:

1. **Sati na satu.** „One at 12 o'clock, 3 o'clock, 6 o'clock, 9 o'clock and one at each hour between“ je raspored koji model zna napamet; „a ring of twelve“ nije. Tačno dvanaest položaja, jedan presto po satu.
2. **Pogled odozgo (oko 65°).** Nijedan presto nije u prvom planu, nijedan ne zaklanja drugi i nijedan nije odsečen ivicom kadra. U starom promptu su dva velika prestola u prvom planu bila ono što je model dopunjavao.
3. **Jednaki prestoli na zasebnim postoljima, jednak razmak.** „Gap between neighbours equal to one throne width“ drži krug ravnomernim, pa dodatni presto nema gde da stane.
4. **Dvanaest svetlećih znakova, po jedan iznad svakog.** Znak lebdi iznad naslona, pa se vidi sa bilo koje strane (naslon bližih prestola je okrenut kameri), a kad generator pogreši, vidi se prebrojavanjem znakova.
5. **Zabrane za sve što liči na sedište:** stubovi, stepenice, klupe, lukovi, kipovi i „a thirteenth throne“. Stari prompt je imao „tall plain columns“ iz Olympus locka, a stub oko kruga se čita kao presto. Zato se Olympus lock ovde ne koristi doslovno.

**Ako i dalje izađe 11, 13 ili 14** (generiši sva četiri kandidata pa prebroj):

- **Ravno odozgo (90°) umesto 65°.** U SHOT, CAMERA i FRAME LAYOUT zameni opis pogleda: `CAMERA: straight overhead view looking directly down, like an architectural plan, wide shot, centered on the hearth.` i izbaci „the far thrones slightly smaller than the near ones“ (svi su isti). Ravni plan je najlakši za brojanje.
- **Jedan presto + kopije u editoru** (garantuje tačan broj): generiši samo jedan presto sa emblemom pored vatre, pa u editoru napravi 12 kopija rotiranih po 30° oko ognjišta i svakoj stavi drugi znak. Natpis i dalje ide u prazan ugao.
- **Natpis bez broja:** „ONE FIRE. ALL THE GODS.“ — ako ni to ne prođe, a ti ipak hoćeš da thumbnail ne laže: broj nije obećan, pa se ne može prebrojati kao greška.
- Ako je izabrana slika 13: u editoru obriši višak presto (najčešće onaj najbliži kameri) i dopuni prsten kopijom; nikad ne ostavljaj sliku koja se razlikuje od natpisa „TWELVE“.

---

## 1. Dvanaest prestola oko jedne vatre

**Poenta:** Dvanaest istih prestola u savršenom krugu, jedan na svakom satu, svaki sa svojim svetlećim znakom, a u sredini jedna jarka vatra — cela porodica odjednom i tačno dvanaest.
**Šta se vidi za sekundu:** Prsten od prestola sa svetlećim znakovima i jedna jarka vatra u sredini, odozgo, hladno nebo i oblaci oko njih.
**Natpis (B):** „ONE FIRE. TWELVE THRONES.“ — gore levo, topla narandžasta (#FF9F1C) sa tamnoplavim rubom. Alternative: „ALL TWELVE. ONE FIRE.“ · „WHO SAT WHERE?“ · bez broja: „ONE FIRE. ALL THE GODS.“ (ako generator ipak ne pogodi broj).
**Naslov uz njega:** The Complete Saga of the 12 Greek Gods and Their Family: From Cronus to the Net
**Pazi:** Nema likova u kadru, pa nema Flow filtera. **Tačno dvanaest** — v. ispod „Kako dobiti tačno 12“. Olympus lock se ovde NE koristi doslovno: njegov tekst nosi „tall plain columns“, a stubovi oko kruga se čitaju kao još prestola.

### 1A — bez teksta (633 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one clear moment, readable at phone size — seen from high above, exactly twelve identical marble thrones stand in a perfect circle on a round terrace in the clouds, one at every hour of a clock face, each with a small glowing golden emblem floating above it, and in the exact middle of the circle one bright hearth fire burns: the whole family around one fire.
SUBJECT: exactly twelve tall-backed thrones of pale marble, no more and no fewer, standing in one perfect circle like the twelve hours of a clock face: one at the top (12 o'clock), one at the right (3 o'clock), one at the bottom (6 o'clock), one at the left (9 o'clock) and one at each of the other hours between them; all the same size, all evenly spaced with a gap between neighbours equal to one throne width, each standing on its own low round plinth, every throne turned inward toward the center, every throne empty
SUBJECT 2: exactly twelve small glowing golden emblems, one floating above the backrest of each throne, going clockwise round the circle from the top: a white-gold thunderbolt, a crown, a sheaf of wheat, a flame, a trident, a crested helmet, a lyre, a bow, a spear, a girdle, a smith's hammer, a dark close-fitting cap; each emblem a different shape, each small enough to sit inside the width of its throne
SUBJECT 3: a round stone hearth in the exact center of the circle with a bright tall fire in it and sparks rising, the hearthstones glowing orange, a ring of worn paving around it
ACTION: the twelve emblems glow one after another round the circle while the fire in the middle leaps up and throws warm light across the marble; every throne stays empty
SETTING: the round summit terrace of Mount Olympus floating above a sea of cloud at dusk, pale marble paving with thin concentric lines, nothing on it but the twelve plinths, the twelve thrones and the hearth, snow-capped peaks poking through the cloud in the far corners, a thin line of gold on the horizon, first stars
CAMERA: high aerial view looking down at about sixty-five degrees from above the edge of the circle, wide shot, centered on the hearth, the whole circle visible with a margin of cloud around it, the camera standing still.
FRAME LAYOUT: center — the bright hearth fire, small but the brightest point of the image; around it the ring of twelve thrones filling the middle two thirds of the frame, the far thrones slightly smaller than the near ones but all twelve fully visible and separate, none hidden behind another and none cut off by the frame; background and corners — cloud sea and peaks; upper left quarter — pale dusk cloud, smooth and EMPTY, nothing in it; the lower right corner holds only cloud and paving.
FACING: every throne faces the hearth in the center.
SCREEN DIRECTION: sparks rise straight up from the fire; the glow of each emblem spreads inward toward the hearth; thin mist drifts slowly toward screen-right.
LIGHT: warm orange firelight from the center on the inner sides of the thrones and the paving, cold blue dusk light on the outer sides and the cloud, a small golden glow around each of the twelve emblems.
PALETTE: cold dusk blue, pale marble white-grey, warm orange fire, gold emblems
DETAIL: tiny sparks, carved edges of the thrones, a thin glowing line in the paving joining the twelve plinths, mist curling round the plinths, the glow of each emblem on the marble below it.
NOT IN FRAME: a thirteenth throne, extra chairs, benches, steps, columns, arches, statues, any people or gods, animals, text, letters, numbers, logos, watermarks.
```

### 1B — sa tekstom (708 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one clear moment, readable at phone size — seen from high above, exactly twelve identical marble thrones stand in a perfect circle on a round terrace in the clouds, one at every hour of a clock face, each with a small glowing golden emblem floating above it, and in the exact middle of the circle one bright hearth fire burns: the whole family around one fire.
SUBJECT: exactly twelve tall-backed thrones of pale marble, no more and no fewer, standing in one perfect circle like the twelve hours of a clock face: one at the top (12 o'clock), one at the right (3 o'clock), one at the bottom (6 o'clock), one at the left (9 o'clock) and one at each of the other hours between them; all the same size, all evenly spaced with a gap between neighbours equal to one throne width, each standing on its own low round plinth, every throne turned inward toward the center, every throne empty
SUBJECT 2: exactly twelve small glowing golden emblems, one floating above the backrest of each throne, going clockwise round the circle from the top: a white-gold thunderbolt, a crown, a sheaf of wheat, a flame, a trident, a crested helmet, a lyre, a bow, a spear, a girdle, a smith's hammer, a dark close-fitting cap; each emblem a different shape, each small enough to sit inside the width of its throne
SUBJECT 3: a round stone hearth in the exact center of the circle with a bright tall fire in it and sparks rising, the hearthstones glowing orange, a ring of worn paving around it
ACTION: the twelve emblems glow one after another round the circle while the fire in the middle leaps up and throws warm light across the marble; every throne stays empty
SETTING: the round summit terrace of Mount Olympus floating above a sea of cloud at dusk, pale marble paving with thin concentric lines, nothing on it but the twelve plinths, the twelve thrones and the hearth, snow-capped peaks poking through the cloud in the far corners, a thin line of gold on the horizon, first stars
CAMERA: high aerial view looking down at about sixty-five degrees from above the edge of the circle, wide shot, centered on the hearth, the whole circle visible with a margin of cloud around it, the camera standing still.
FRAME LAYOUT: center — the bright hearth fire, small but the brightest point of the image; around it the ring of twelve thrones filling the middle two thirds of the frame, the far thrones slightly smaller than the near ones but all twelve fully visible and separate, none hidden behind another and none cut off by the frame; background and corners — cloud sea and peaks; upper left quarter — pale dusk cloud, smooth and EMPTY, nothing in it; the lower right corner holds only cloud and paving.
TEXT: in the upper left quarter, the words "ONE FIRE. TWELVE THRONES." on two lines, "ONE FIRE." above "TWELVE THRONES.", huge bold hand-lettered capitals with a heavy cut-out look, warm orange (#FF9F1C) with a thin deep navy outline and a soft dark shadow, straight and not rotated, sitting only on the empty dusk cloud and touching nothing else, spelled exactly like this, no other words anywhere in the image.
FACING: every throne faces the hearth in the center.
SCREEN DIRECTION: sparks rise straight up from the fire; the glow of each emblem spreads inward toward the hearth; thin mist drifts slowly toward screen-right.
LIGHT: warm orange firelight from the center on the inner sides of the thrones and the paving, cold blue dusk light on the outer sides and the cloud, a small golden glow around each of the twelve emblems.
PALETTE: cold dusk blue, pale marble white-grey, warm orange fire, gold emblems
DETAIL: tiny sparks, carved edges of the thrones, a thin glowing line in the paving joining the twelve plinths, mist curling round the plinths, the glow of each emblem on the marble below it.
NOT IN FRAME: a thirteenth throne, extra chairs, benches, steps, columns, arches, statues, any people or gods, animals, logos, watermarks, any words or letters other than the title text.
```

---

## 2. Otac i sin

**Poenta:** Div Kron iza prestola drži zavijen kamen, a Zevs ispred njega drži ruku na grudima u kojima svetli ono što je progutao — isto proročanstvo, druga generacija.
**Šta se vidi za sekundu:** Ogroman starac u oluji, mali bog sa plavim sjajem u grudima. Dva lica, jedna porodica.
**Natpis (B):** „HIS SON SWALLOWED A WIFE“ — gore levo, zlatna (#F4D58D) sa debelim tamnim rubom. Alternative: „HE SWALLOWED. SO DID HIS SON.“ (iz S54–S55 Part 3 outroa, 6 reči) · „THE SAME PROPHECY“.
**Naslov uz njega:** 12 Greek Gods, One Family: The Prophecy That Made Cronus Swallow His Own Children
**Pazi:** Kron i Zevs su odrasli, odeveni i pokriveni iznad pojasa — nema deteta u kadru (Flow filter „maloletnici“). Zavijeni kamen je kamen, ne beba: u promptu stoji `the-stone` doslovno i „a stone, not a child“. Natpis i naslov dele samo reč „swallow“.

### 2A — bez teksta (646 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one clear moment, readable at phone size — the colossal old Titan Cronus looms behind a stone throne holding the swaddled stone he swallowed instead of Zeus, while Zeus, small in front of him, presses a hand to his chest where a cold sea-blue light shines: the same prophecy, one generation later.
SUBJECT: a gaunt ageing Titan with long grey-white hair and a heavy matted grey beard, a hollowed lined face, corded veined arms and big knuckled hands, a coarse dark ochre himation over one shoulder, bare chest and bare feet, at the right, colossal, rising out of storm cloud behind the throne so that his head and shoulders fill the right half of the frame and he is drawn four times the height of the god in front of him, seen from below and slightly from the front, his hollowed face turned down toward the small god, one huge hand lifted to chest height holding the swaddled stone, the other hand flat on the throne arm
SUBJECT 2: a broad powerfully built Greek god in his prime, thick dark hair swept back from a high brow, a full curled beard, deep-set grey eyes under heavy brows, a purple-red himation over one shoulder, bare chest and bare feet, at the lower center, small against the Titan but large enough to read, filling one third of the frame height, seated on a plain marble throne turned three-quarters toward the left, his right hand pressed flat to the middle of his chest where a cold sea-blue glow shines through his fingers, his grey eyes lowered and troubled
SUBJECT 3: a smooth oval boulder of grey limestone about the size of a swaddled newborn, worn round by a river, the surface faintly veined and pitted, one end slightly narrower than the other, wrapped in a pale grey blanket like a bundle, held in the Titan's raised hand at the center of the frame; a stone, not a child
ACTION: the Titan's great hand holds the swaddled stone out over the throne while his eyes look down; the god's hand stays pressed to his chest and the blue glow pulses between his fingers
SETTING: the summit of Mount Olympus above the cloud line, broad terraces of pale marble and bare rock, tall plain columns, wide open sky, snowfields and lower peaks showing far below through breaks in the cloud, here at night under a heaving black storm, one torch flame burning in an iron bracket at the far upper right
CAMERA: low angle looking up past the god toward the Titan, medium-wide shot, the camera standing still on the throne terrace.
FRAME LAYOUT: right half — the colossal Titan with the swaddled stone in his raised hand at the center; lower center — the small god on the throne with the blue glow at his chest; lower left — bare marble steps; upper left quarter — heaving storm cloud, dark, smooth and EMPTY, nothing in it; the lower right corner holds only the Titan's robe and cloud.
FACING: we see the Titan from below and front, face turned down toward screen-left; we see the god three-quarter, face turned down and a little toward screen-left, eyes lowered.
SCREEN DIRECTION: cloud pours from the Titan's shoulders toward screen-left; the blue light spreads outward from the god's chest.
LIGHT: cold storm light from the upper left, a hard cyan glow from the god's chest lighting his beard and fingers from below, a small warm orange flicker from the torch at the upper right edge.
PALETTE: storm grey, ochre, purple-red, cold sea-blue glow, one warm orange torch flame
DETAIL: rain streaks, veins on the Titan's knuckles, light leaking through the god's fingers.
NOT IN FRAME: a baby or any child, other gods, crowns on the Titan, text, letters, numbers, logos, watermarks.
```

### 2B — sa tekstom (722 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one clear moment, readable at phone size — the colossal old Titan Cronus looms behind a stone throne holding the swaddled stone he swallowed instead of Zeus, while Zeus, small in front of him, presses a hand to his chest where a cold sea-blue light shines: the same prophecy, one generation later.
SUBJECT: a gaunt ageing Titan with long grey-white hair and a heavy matted grey beard, a hollowed lined face, corded veined arms and big knuckled hands, a coarse dark ochre himation over one shoulder, bare chest and bare feet, at the right, colossal, rising out of storm cloud behind the throne so that his head and shoulders fill the right half of the frame and he is drawn four times the height of the god in front of him, seen from below and slightly from the front, his hollowed face turned down toward the small god, one huge hand lifted to chest height holding the swaddled stone, the other hand flat on the throne arm
SUBJECT 2: a broad powerfully built Greek god in his prime, thick dark hair swept back from a high brow, a full curled beard, deep-set grey eyes under heavy brows, a purple-red himation over one shoulder, bare chest and bare feet, at the lower center, small against the Titan but large enough to read, filling one third of the frame height, seated on a plain marble throne turned three-quarters toward the left, his right hand pressed flat to the middle of his chest where a cold sea-blue glow shines through his fingers, his grey eyes lowered and troubled
SUBJECT 3: a smooth oval boulder of grey limestone about the size of a swaddled newborn, worn round by a river, the surface faintly veined and pitted, one end slightly narrower than the other, wrapped in a pale grey blanket like a bundle, held in the Titan's raised hand at the center of the frame; a stone, not a child
ACTION: the Titan's great hand holds the swaddled stone out over the throne while his eyes look down; the god's hand stays pressed to his chest and the blue glow pulses between his fingers
SETTING: the summit of Mount Olympus above the cloud line, broad terraces of pale marble and bare rock, tall plain columns, wide open sky, snowfields and lower peaks showing far below through breaks in the cloud, here at night under a heaving black storm, one torch flame burning in an iron bracket at the far upper right
CAMERA: low angle looking up past the god toward the Titan, medium-wide shot, the camera standing still on the throne terrace.
FRAME LAYOUT: right half — the colossal Titan with the swaddled stone in his raised hand at the center; lower center — the small god on the throne with the blue glow at his chest; lower left — bare marble steps; upper left quarter — heaving storm cloud, dark, smooth and EMPTY, nothing in it; the lower right corner holds only the Titan's robe and cloud.
TEXT: in the upper left quarter, the words "HIS SON SWALLOWED A WIFE" on two lines, "HIS SON" above "SWALLOWED A WIFE", huge bold hand-lettered capitals with a heavy cut-out look, warm gold (#F4D58D) with a thick dark outline and a soft dark shadow, straight and not rotated, sitting only on the empty storm cloud and touching nothing else, spelled exactly like this, no other words anywhere in the image.
FACING: we see the Titan from below and front, face turned down toward screen-left; we see the god three-quarter, face turned down and a little toward screen-left, eyes lowered.
SCREEN DIRECTION: cloud pours from the Titan's shoulders toward screen-left; the blue light spreads outward from the god's chest.
LIGHT: cold storm light from the upper left, a hard cyan glow from the god's chest lighting his beard and fingers from below, a small warm orange flicker from the torch at the upper right edge.
PALETTE: storm grey, ochre, purple-red, cold sea-blue glow, one warm orange torch flame
DETAIL: rain streaks, veins on the Titan's knuckles, light leaking through the god's fingers.
NOT IN FRAME: a baby or any child, other gods, crowns on the Titan, logos, watermarks, any words or letters other than the title text.
```

---

## 3. Kralj je okovao svoju ženu

**Poenta:** Hera, kraljica bogova, visoko podignuta u oluji zlatnim lancem oko zglobova, sa po jednim gvozdenim nakovnjem na stopalima — a brada joj je uzdignuta. Mali Zevs ispod nje na ivici oblaka. Porodična okrutnost, ne rat.
**Šta se vidi za sekundu:** Velika boginja u crvenom plaštu u zlatnom lancu na oluji, dva nakovnja ispod stopala, sićušan ljutit bog dole levo.
**Natpis (B):** „HE CHAINED HIS WIFE“ — gore levo, koščano bela (#F2EFE6) sa debelim tamnocrvenim (#8B1A1A) rubom. Alternative: „THE KING CHAINED THE QUEEN“ · „HER HUSBAND DID THIS“.
**Naslov uz njega:** Why Did the Greek Gods Keep Swallowing and Trapping Each Other? The Full Story of 12 Gods
**Pazi:** Tačno iz Part 2: „He hung her from the sky, a golden chain on her wrists and two anvils tied to her feet.“ **Flow filter:** reč „hung/hanging“ je izbegnuta (samopovređivanje) — lik je „held up in mid-sky by a golden chain around her wrists“, nikad uže ni lanac oko vrata, bez krvi i rana. Ako Flow ipak odbije: spusti je do pola kadra i dodaj da stoji na oblaku, lanac je i dalje oko zglobova. Zevs je odeven (himation preko ramena); nema golotinje.

### 3A — bez teksta (585 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one clear moment, readable at phone size — Hera, queen of the gods, is held up in mid-sky by a golden chain around her wrists with a heavy iron anvil tied to each foot, and she still holds her chin high, while far below on a cloud terrace the small furious figure of Zeus watches: the king of the gods chaining his own wife.
SUBJECT: a tall stately Greek goddess in her prime, dark hair drawn back under a low golden crown, large steady eyes and a full mouth, a white peplos under a dark red mantle pinned at both shoulders, bare feet, at the center and right, large, filling two thirds of the frame height, seen from the front and slightly from below, held up in the open sky by a golden chain wound round both wrists above her head, the chain running straight up out of the top of the frame, her body stretched long beneath it, her chin lifted, her large steady eyes looking straight out of the frame with cold defiance, no tears, her dark red mantle streaming sideways in the wind
SUBJECT 2: two heavy black iron anvils tied to her bare feet with thick rope, one at each foot, hanging a little below her and swaying
SUBJECT 3: a broad powerfully built Greek god in his prime, thick dark hair swept back from a high brow, a full curled beard, deep-set grey eyes under heavy brows, a purple-red himation over one shoulder, bare chest and bare feet, small, at the lower left on the edge of a cloud terrace, filling one fifth of the frame height, seen in profile facing right and up, fists clenched, jaw set, his purple-red himation torn sideways by the wind
ACTION: the golden chain swings slightly under her weight while the wind lashes her mantle and the storm rolls in around her; Zeus stands rigid below and does not move
SETTING: the open storm sky high above the earth, thick dark banks of cloud, a small cloud terrace at the lower left, a thin line of land and dark sea far below at the bottom edge
CAMERA: low angle looking up at her from below the cloud terrace, medium-wide shot, the camera standing still.
FRAME LAYOUT: center and right — Hera, large, the gold chain rising out of the top of the frame above her hands; below her feet — the two anvils; lower left — the cloud terrace with small Zeus looking up; bottom — dark storm cloud; upper left quarter — storm cloud, dark slate, smooth and EMPTY, nothing in it; the lower right corner holds only cloud.
FACING: we see Hera front on, her face turned toward the viewer; we see Zeus in profile, face toward screen-right and up at her.
SCREEN DIRECTION: her mantle and the cloud stream toward screen-right; the chain and the anvils swing slightly toward screen-left.
LIGHT: a hard cold light from the upper left on her face and white peplos, a bright warm gold glint running all along the chain, deep shadow in the storm.
PALETTE: storm slate-blue, deep red mantle, white peplos, one bright gold chain
DETAIL: individual links of the chain catching the light, the rope round her ankles, the frayed hem of the mantle, glints on the iron anvils, rain streaks.
NOT IN FRAME: blood, wounds, tears, other gods, a crowd, a golden crown on Zeus, text, letters, numbers, logos, watermarks.
```

### 3B — sa tekstom (661 reči)

```text
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
SHOT: one clear moment, readable at phone size — Hera, queen of the gods, is held up in mid-sky by a golden chain around her wrists with a heavy iron anvil tied to each foot, and she still holds her chin high, while far below on a cloud terrace the small furious figure of Zeus watches: the king of the gods chaining his own wife.
SUBJECT: a tall stately Greek goddess in her prime, dark hair drawn back under a low golden crown, large steady eyes and a full mouth, a white peplos under a dark red mantle pinned at both shoulders, bare feet, at the center and right, large, filling two thirds of the frame height, seen from the front and slightly from below, held up in the open sky by a golden chain wound round both wrists above her head, the chain running straight up out of the top of the frame, her body stretched long beneath it, her chin lifted, her large steady eyes looking straight out of the frame with cold defiance, no tears, her dark red mantle streaming sideways in the wind
SUBJECT 2: two heavy black iron anvils tied to her bare feet with thick rope, one at each foot, hanging a little below her and swaying
SUBJECT 3: a broad powerfully built Greek god in his prime, thick dark hair swept back from a high brow, a full curled beard, deep-set grey eyes under heavy brows, a purple-red himation over one shoulder, bare chest and bare feet, small, at the lower left on the edge of a cloud terrace, filling one fifth of the frame height, seen in profile facing right and up, fists clenched, jaw set, his purple-red himation torn sideways by the wind
ACTION: the golden chain swings slightly under her weight while the wind lashes her mantle and the storm rolls in around her; Zeus stands rigid below and does not move
SETTING: the open storm sky high above the earth, thick dark banks of cloud, a small cloud terrace at the lower left, a thin line of land and dark sea far below at the bottom edge
CAMERA: low angle looking up at her from below the cloud terrace, medium-wide shot, the camera standing still.
FRAME LAYOUT: center and right — Hera, large, the gold chain rising out of the top of the frame above her hands; below her feet — the two anvils; lower left — the cloud terrace with small Zeus looking up; bottom — dark storm cloud; upper left quarter — storm cloud, dark slate, smooth and EMPTY, nothing in it; the lower right corner holds only cloud.
TEXT: in the upper left quarter, the words "HE CHAINED HIS WIFE" on two lines, "HE CHAINED" above "HIS WIFE", huge bold hand-lettered capitals with a heavy cut-out look, bone white (#F2EFE6) with a thick deep crimson (#8B1A1A) outline and a soft dark shadow, straight and not rotated, sitting only on the empty storm cloud and touching nothing else, spelled exactly like this, no other words anywhere in the image.
FACING: we see Hera front on, her face turned toward the viewer; we see Zeus in profile, face toward screen-right and up at her.
SCREEN DIRECTION: her mantle and the cloud stream toward screen-right; the chain and the anvils swing slightly toward screen-left.
LIGHT: a hard cold light from the upper left on her face and white peplos, a bright warm gold glint running all along the chain, deep shadow in the storm.
PALETTE: storm slate-blue, deep red mantle, white peplos, one bright gold chain
DETAIL: individual links of the chain catching the light, the rope round her ankles, the frayed hem of the mantle, glints on the iron anvils, rain streaks.
NOT IN FRAME: blood, wounds, tears, other gods, a crowd, a golden crown on Zeus, logos, watermarks, any words or letters other than the title text.
```

---
