# Template-i promptova

Dva šablona: jedan za startni frejm (`shot.image_prompt`), jedan za klip (`shot.animation_prompt`).
Redosled blokova nije preporuka — model čita s početka, pa ono što je front-loaded dobija najviše
težine. Zato identitet lika ide gore, a isključenja dole.

Dužine su BLOCKING: **P1 = 90–160 reči** za image (shema 1; shema 2 ima svoj plafon, niže) i
**P2 = 60–220 reči** za animation (obe sheme), po kanonskom brojaču iz `schemas.md` §0.6. Taj
brojač broji i nazive blokova (`FRAME LAYOUT:` = 2 reči) i vremenske oznake (`0–1s:` = 1 reč), pa
je gornja granica uža nego što deluje: `STYLE` blok pojede 16 reči, a svaki `locked_description`
još 25–40.

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

Zajednički za obe sheme — shema 2 menja samo image prompt. Klip se piše kao **neprekidan opis
svake sekunde generisanja**, ne kao tri natuknice.

```
MOTION BUDGET: key action lands by <use_len>s; everything keeps moving at the same natural pace through the end of the <gen_len>s generation.
0–1s:           <radnja koja kreće odmah>; <šta se još pomera u istom trenutku>
1–<a>s:         <razvoj glavne radnje>; <sporedni pokret>
<a>–<b>s:       <radnja napreduje, ne razrešava se u mirovanje>; <šta se menja u okolini>
<b>–<gen_len>s: <radnja traje istim ritmom do poslednje sekunde>; <šta se i dalje pomera>
CAMERA:      <jedan kontinuiran potez sa smerom i brzinom, ceo klip — ili zaključana kamera nad scenom koja se kreće>
ENVIRONMENT: <ambijentalni pokret od prve do poslednje sekunde>
PRESERVE:    same characters, clothing, props, architecture, palette and composition as the source image
FORBID:      cuts, scene changes, new characters, on-screen text, camera teleports, style shifts
```

`PRESERVE` i `FORBID` su fiksne linije, ne šablon za popunjavanje — direktan fiks za „gube se
elementi, jedni se menjaju drugima, scena se seče". `MOTION BUDGET` mora da nosi isti broj kao
`shot.motion_budget`, koji je jednak `shot.use_len` (provera T3), i dužinu generisanja
`shot.gen_len` (provera T4).

Prorezi moraju da pokriju ceo klip bez rupe. Zbog toga animation prompt ne sme da sadrži reči koje
impliciraju rez **unutar** klipa — `then`, `later`, `afterwards`, `cuts to`, `meanwhile` — to meri
**S3**. Napredovanje se izražava vremenskim prorezom, ne veznikom.

### Pravila proreza

Model ne izmišlja ono što mu nije rečeno. Prorez od četiri reči („the crowd moves") daje klip u
kome se skoro ništa ne dešava, a prorez koji kaže da se ništa ne dešava daje **zamrznut kadar**:
model ga čita bukvalno, zaustavi scenu i pretvori klip u sliku mnogo pre kraja naracije
(prijavljeno 2026-10-10). Ranija verzija ovog šablona je to sama tražila — višak preko `use_len`
bio je „izričito zadržan kadar" (`hold to the end`), a poslednji prorez je bio „gde se sleže".

1. **Prorezi pokrivaju ceo `gen_len`, ne `use_len`.** Poslednji prorez se završava brojem
   `gen_len` (`6.5–8s:` na 8s generisanju). Sekunde posle `use_len` montaža odseca, ali ih model
   generiše — i kad za njih nema opisa, popuni ih mirovanjem koje počne ranije, pre reza.
2. **Prvi prorez je `0–1s:`, nijedan nije duži od 2.5s.** Okvirno: 4s → 3 proreza, 6s → 3–4,
   8s → 4–5, 10s → 5.
3. **Svaki prorez su dve rečenice, ~20–30 reči.** Prva: glavna radnja — ko ili šta, kojim delom
   tela ili kojim predmetom, u kom smeru ekrana, kojom brzinom. Druga: šta se u istom trenutku još
   pomera — drugi likovi, tkanina, kosa, plamen, dim, voda, svetlo.
4. **Poslednji prorez je nastavak, ne razrešenje.** Radnja traje istim ritmom: hod se nastavlja,
   kamera i dalje klizi, dim i dalje kulja. Rez u montaži pada usred pokreta, i to je dobar rez.
5. **Mirovanje se nikad ne propisuje** — ni u prorezu, ni u `MOTION BUDGET` liniji, ni u
   `CAMERA`. Ne pišu se: `hold`, `holds still`, `goes still`, `stays still`, `settles`,
   `comes to rest`, `freezes`, `motionless`, `nothing moves`, `stays the same`, `no movement`.
   Zaključana kamera je `CAMERA: locked on <šta>`, bez „no movement".
6. **Tih kadar nije zamrznut kadar.** Refleksivan kadar i dalje kaže šta se sporo kreće: dah,
   plamen, prašina u snopu svetla, senka oblaka, spor push kamere. Tišina je usporen pokret, ne
   odsustvo pokreta.
7. **Promena svetla ili vremena je proces sa smerom**, ne stanje: `the light on the facade slides
   from gold to deep orange`, ne `the light changes`.

Budžet: `MOTION BUDGET` 22 reči, četiri-pet proreza po ~25, `CAMERA` i `ENVIRONMENT` ~30,
`PRESERVE` i `FORBID` 25 — **~190–210**. Plafon je 220 (P2), meki cilj 150–210 (R5, shema 2).
Kad ne staje, skraćuje se `ENVIRONMENT`, nikad prorez.

### Loše i dobro — isti kadar

Crkva na trgu i narod ispred nje; `use_len` 7.2s, generiše se 8s.

**Loše — 70 reči.** Ovakav prompt daje klip koji se zamrzne posle pete sekunde:

```
MOTION BUDGET: key motion completes within 7.2s; hold to the end of an 8s generation.
0–2s: the crowd moves.
2–5s: they walk into the church; the light slowly changes.
5–7.2s: the scene stays the same, nothing moves.
CAMERA: locked, no movement.
ENVIRONMENT: a light breeze.
PRESERVE: same characters, clothing, props, architecture, palette and composition as the source image.
FORBID: cuts, scene changes, new characters, on-screen text, camera teleports, style shifts.
```

Tri greške: prorezi od 4–10 reči ne kažu ko se kreće, kako ni kuda; `5–7.2s:` propisuje mirovanje
pa ga model i daje, a sekunde 7.2–8 nemaju nijedan opis; `hold to the end` u prvom redu je isto
naređenje drugim rečima.

**Dobro — 205 reči.** Svaka sekunda ima radnju, poslednja kao i prva:

```
MOTION BUDGET: key action lands by 7.2s; everything keeps moving at the same natural pace through the end of the 8s generation.
0–1s: the crowd in the square starts toward the church at once; a woman in a red shawl lifts her child onto her hip.
1–3s: the crowd flows up the stone steps toward the open doors at frame center, shoulders jostling; pigeons burst off the steps toward the upper-right corner.
3–5s: the first villagers pass through the arched doorway into the candlelit interior as the rest keep climbing; the bell above the doors starts to swing and toll.
5–7s: the last of the crowd squeezes inside; the light on the facade slides from gold to deep orange and long shadows stretch across the emptying steps.
7–8s: an old man hurries up the last steps holding his hat and slips in as the heavy doors begin to swing shut; dusk deepens over the tower.
CAMERA: one continuous slow push toward the church doors for the full 8 seconds.
ENVIRONMENT: dust drifts in the low sunlight; swallows cross the sky.
PRESERVE: same characters, clothing, props, architecture, palette and composition as the source image.
FORBID: cuts, scene changes, new characters, on-screen text, camera teleports, style shifts.
```

### Primer — 202 reči, prolazi P2, S1, S3, T4

```
MOTION BUDGET: key action lands by 6.5s; everything keeps moving at the same natural pace through the end of the 8s generation.
0–1s: Hanno presses the bronze stylus into the wax and drags it down in one short, firm stroke; a curl of wax lifts off the tip.
1–3s: he raises the tablet toward the light and runs his thumb down the marks, lips moving as he counts; the nearest dockhand shoulders a crate and walks in from the right edge.
3–5s: Hanno nods once and turns the tablet against his chest; the dockhand crosses between him and the moored hull, the crate swaying.
5–6.5s: he tucks the tablet under his left arm and walks toward screen-left along the quay, his tunic swinging with each stride.
6.5–8s: he keeps walking at the same pace as the dockhand drops the crate onto a stack and the planks jolt.
CAMERA: one continuous slow push toward Hanno for the full 8 seconds.
ENVIRONMENT: haze drifts over the water; a mooring rope sways against the quay; small waves slap the stones.
PRESERVE: same characters, clothing, props, architecture, palette and composition as the source image.
FORBID: cuts, scene changes, new characters, on-screen text, camera teleports, style shifts.
```

Primetićeš da lik ovde nije ponovo opisan. To je namerno: identitet se uspostavlja u slici, a
`locked_description` bi na svakom shotu sa dva lika pojeo trećinu P2 budžeta. `PRESERVE` linija je
njegova zamena (`schemas.md` §0.7). Rez je na 6.5s, a prorez `6.5–8s:` i dalje opisuje hod — to je
pravilo 1 na delu.

---

## Kontrolna lista pre upisa u `storyboard.json`

1. Prebroj obe dužine kanonskim brojačem, ne na oko — 90–160 i 60–220.
2. Pet naziva blokova stoji u image promptu, verzalom i sa dvotačkom.
3. Nijedna zabranjena prostorna fraza (lista A u `camera-language.md`).
4. Nijedna od pet reči koje impliciraju rez, u animation promptu.
5. `locked_description` svakog lika iz `shot.characters[]` stoji doslovno u image promptu.
6. Prorezi animation prompta idu do `gen_len`, svaki nosi dve rečenice pokreta, i nijedan ne
   propisuje mirovanje („Pravila proreza").

---

# Shema 2 — image template sa hijerarhijom vizuelne težine

> Sve iznad opisuje **shemu 1** i važi za epizode koje nose `schema_version: 1`. Linter bira
> pravila po tom broju, pa postojeće epizode ostaju validne bez prepravke. Nove epizode se pišu
> po ovom odeljku. Obrazloženje promene je u `schemas.md` §3.3.1.

Tri stvari se menjaju: plafon je **90–720 reči** (meki cilj 360–520, R5), uvode se blokovi
`SCALE` i `DETAIL`, i redosled blokova prestaje da bude preporuka — **`SUBJECT` i `SCALE` idu pre
kamera-blokova**, jer je to jedino mesto na kome front-loading nešto znači.

Plafon je 2026-10-10 udvostručen (bio je 90–360, meki cilj 180–260) da bi kadar bio **opisan**,
ne da bi se ponavljao. Dodatne reči idu u blokove koji nose sadržaj slike: `ACTION` (šta tačno
radi svaka figura, kojom rukom, sa kojim predmetom), `SETTING` (materijali, istrošenost, šta stoji
gde), `LIGHT` (izvor, smer, boja, šta je osvetljeno a šta u senci) i `DETAIL`. Kamera-blokovi
ostaju kratki i tačni, a lockovi se kopiraju, ne prepričavaju.

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

## End kartica — poslednji shot, nad `## OUTRO`

Shot koji stoji nad outro delom narracije („…leave a like and subscribe to Animated Tales. Until
next time.") **nije običan kadar nego end kartica**: slika sa naslovom epizode i SUBSCRIBE
dugmetom, koja postaje `endcard_file` u montaži. Prompt koji tu napiše `NOT IN FRAME: text`
daje lep kadar bez naslova i dugmeta, i kartica mora da se radi ponovo.

Uzor su postojeće kartice (`greek-gods-part-1`, `antikythera-mechanism`,
`night-when-rome-almost-fell`, `tyr-and-fenrir` — `endKartica.*`). Izgled je isti na svima.

**Kartica je rekapitulacija cele priče, ne poslednja scena.** Piše se iz cele `script.md`, ne
iz outro rečenice ni iz poslednjeg beata. Prva verzija za `heavenly-horses` je nacrtala samo kraj
(konj galopira kući) i korisnik ju je vratio: dobra slika, ali ne priča. Pre pisanja izvuci iz
skripte po jedno za svaku ulogu:

| Uloga | heavenly-horses |
|---|---|
| ko pokreće priču | car Wu |
| šta je predmet želje ili sukoba | nebeski konj |
| ključni rekvizit ili početak | zlatni konj i zlato koje je ponuđeno |
| druga strana / cilj na karti | Dajuan pod planinama, reka uz zidine |
| put ili sukob između njih | vojska sa volovima i kamilama kroz pustinju, od Žadne kapije |

Kompozicija je filmski poster:

- **dva velika lika na ivicama**, near-camera i sečena grudima ili ivicom kadra, po osi ekrana
  epizode (strane sukoba ostaju gde su bile ceo film);
- **cela geografija priče u sredini**, daleko i sitno — polazište na jednoj strani, cilj na
  drugoj, put i vojska između;
- **simboli priče u prvom planu** uz donju ivicu (zlatnici, oružje, mapa, polomljeni predmet);
- `SHOT:` linija na početku jednom rečenicom kaže da je ovo poster cele priče i nabroji uloge.
Uz to:

- **`TITLE:` blok** — naslov iz `episode.json` → `title`, verzalom i pod navodnicima, preko
  gornje trećine, u slovima koja nose materijal priče (bronza, drvo sa runama, kamen, lak);
  ispod njega tanka ornamentna linija i **jedna kraća linija o priči**, 3–6 reči, iz skripte.
- **`BUTTON:` blok** — uvek isto dugme: `at the exact center of the frame, a red rounded
  pill-shaped button with a thin gold rim, "SUBSCRIBE" in bold cream capitals, a small gold
  diamond on each side.`
- `FRAME LAYOUT` imenuje `upper third` za naslov, `center` za dugme, i po jednu trećinu za
  svaki veliki lik, tako da im glave ostaju slobodne od naslova i dugmeta.
- `DETAIL` traži čitka slova (`crisp lettering with every letter spelled right`), a
  `NOT IN FRAME` zabranjuje **ostali** tekst (`logos, any other words or letters`), ne tekst
  uopšte.
- `still_motion: hold`, `tags.camera_motion: locked`, `tags.location: end-card`.

**Plafon je 1200, ne 720** (`LIMITS.endCardWords`, P1 na poslednjem shotu; R5 ga ne meri).
Uveden je kao 600 dok je obični plafon bio 360 — tri locka (~130 reči) + `TITLE` + `BUTTON` (~70)
+ raspored po trećinama nisu stajali u 360, a skraćivanje bi izbacilo baš uloge koje karticu čine
rekapitulacijom — i udvostručen je zajedno sa ostalim plafonima 2026-10-10. Glavni likovi i ključni rekvizit idu kao
lockovi (najviše tri); mesta u dubini idu kratkim opisom u `FRAME LAYOUT`. Primer:
`heavenly-horses`, shot 51 (562 reči).

## Kontrolna lista pre upisa (shema 2)

1. Prebroj obe dužine kanonskim brojačem: **90–720** i **60–220** (meki ciljevi 360–520 i
   150–210). Cilj je pokrivenost, ne broj.
2. Sedam naziva blokova stoji u image promptu, plus `SCALE` kad je entitet `scale_critical`.
3. `characters[0]` je vizuelni subjekt kadra i njegov lock stoji **u `SUBJECT` bloku**.
4. `visual_priority` ima 3–5 stavki i `[0]` imenuje PRIMARY lock.
5. Nijedna zabranjena prostorna fraza (lista A), nijedna prazna `SCREEN DIRECTION` (lista D).
6. Nijedna od pet reči koje impliciraju rez, u animation promptu.
7. `locked_description` nosi identitet — ako u njemu piše poza, greška je u `episode.json`.
8. Animation prompt po „Pravilima proreza": prorezi do `gen_len`, nijedan duži od 2.5s, svaki sa
   dve rečenice pokreta, poslednji nastavlja radnju — nigde `hold`, `still`, `settles`, `freezes`.
