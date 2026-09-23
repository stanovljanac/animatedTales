# Serija — Greek Gods

**Status:** mapa potvrđena, Part 1 gotov, Part 2 ima research i skriptu (`episodes/greek-gods-part-2`). Ovaj fajl je **izvor istine za celu seriju** i piše se
pre nego što ijedan `episode.json` u seriji dobije sadržaj.

**Čita ga:** svako ko počinje bilo koji part ili compilation. **Menja ga:** samo eksplicitna odluka
— izmena zaključanog opisa posle prve objavljene epizode znači da isti bog izgleda drugačije u dve
epizode, a to se posle ne popravlja.

---

## 1. Zašto ovaj fajl postoji

Tri stvari u seriji se ne mogu popraviti naknadno, i sve tri su razlog za ovaj fajl.

1. **Zevs se pojavljuje u svakoj epizodi.** Provera C1 (`docs/reference/schemas.md` §0.7) hvata
   nepoklapanje `locked_description` i prompta **unutar jedne epizode**. Između epizoda ne hvata
   ništa — linter nikad ne vidi dva `episode.json` fajla zajedno. Ako se Zevsov opis piše u Part 1
   iz glave, u Part 3 je drugi Zevs i nijedan alat to ne prijavljuje.
2. **Outro Part 1 imenuje Part 2.** Ne može da se napiše bez mape do kraja serije.
3. **Compilation od 12 bogova** se sklapa od već generisanih kadrova. To radi samo ako partovi od
   početka pokrivaju tačno dvanaest bogova, bez rupe i bez preklapanja.

Ono što ovaj fajl **ne radi**: ne istražuje bogove. Research se piše po partu, kad partu dođe red,
u `episodes/<slug>/research.md` po `docs/prompts/03-research.md`. Ovde su kičma i spisak.

---

## 2. Mapa serije

| Part | Slug | Bogovi | Kičma — jedna priča koja drži trojku |
|---|---|---|---|
| 1 | `greek-gods-part-1` | Zeus, Poseidon, Hades | **Žreb.** Tri brata su bacila kocku za svemir. Had je dobio ono što niko nije hteo — i ispao najbogatiji. |
| 2 | `greek-gods-part-2` | Hera, Demeter, Hestia | **Tri sestre.** Isti otac ih je progutao, isti brat ih je oslobodio — a kraljevstvo nisu dobile. Dobile su ono u čemu ljudi stvarno žive: brak, žetvu, ognjište. |
| 3 | `greek-gods-part-3` | Athena, Apollo, Artemis | **Rođeni uprkos.** Hera je gonila Letu po svetu da ne rodi; Atina je izašla Zevsu iz glave jer je progutao Metidu — isto proročanstvo koje je nateralo Krona da guta decu. Part 3 se vraća na Part 1. |
| 4 | `greek-gods-part-4` | Hephaestus, Aphrodite, Ares | **Mreža.** Majka ga je bacila s Olimpa jer je bio ružan, oženio je najlepšu boginju, uhvatio je u krevetu s Aresom — i pozvao ceo Olimp da gleda. Jedna priča drži svo troje. |

**Part 5 (Hermes, Dionysus) nije planiran.** Radi se samo ako serija bude radila — kao „poslednja
dva trona", i tada ne ulazi u compilation od 12, nego dobija svoj.

**Titanomahija je zaseban video, van numeracije 1–4.** Rat sa Titanima je u Part 1 stisnut u
jedan pasus od ~70 reči — to je sažetak, ne priča, i namerno je ostavljen takav. Cela tema ide u
poseban video koji **ne nosi broj parta**, ne ulazi u lanac outroa i ne dira aritmetiku
compilationa. To je ideja **#21 u `docs/ideas.md`**, preusmerena: Part 1 joj je pojeo prvu polovinu
(proročanstvo, gutanje, kamen), pa joj ostaje rat. Dizajn je već plaćen — `cronus`, `the-cyclopes`,
`the-hundred-handers`, `tartarus` i `the-war-plain` su zaključani u Part 1 i kopiraju se doslovno.
Tamo idu i Uran i srp, Otris, Atlas, mera Tartara nakovnjem i Kureti sa Krita.

**Titani se ne stavljaju ispred Part 1.** Žreb je najjača kičma koju serija ima; otvaranje
worldbuilding-om umesto kukom je poznata greška za retenciju, a i lomi lanac outroa i numeraciju
sva četiri naslova. Titan video izlazi **posle** Part 1, kao spoke, ne kao prolog.

Svaka trojka ima **jednu priču**, ne tri mini-predavanja. To je pravilo, ne opis: ako se trojka ne
može ispričati kroz jedan sukob, trojka je pogrešna.

---

## 3. Had, naslovi i zašto compilation nije „12 Olympians"

Had **nije u kanonskoj Dvanaestorici Olimpijaca** — on ne živi na Olimpu, a u kanonskoj listi
njegovo mesto drži Hestija ili Dionis, zavisno od izvora. Pošto je Had u Part 1 (bez njega nema
žreba, a žreb je najjača kičma koju serija ima), compilation **ne sme** da nosi naslov
`12 Olympians`.

**Odluka:** Had ostaje, compilation se zove **„The 12 Gods of Greek Mythology"**.

Posledica koju treba prihvatiti: dvanaest bogova ove serije nisu kanonska Dvanaestorica. Hermes i
Dionis nisu u njoj. To se **ne krije** — Part 1 u narraciji kaže da Had nije jedan od dvanaest koji
sede na Olimpu, i to je jedan od najjačih obrta te epizode. Naslov compilationa samo ne sme da
tvrdi suprotno.

---

## 4. Registar zaključanih opisa

Ovo je **jedini izvor istine za izgled** svakog entiteta koji se ponavlja kroz seriju.

### 4.1 Pravilo kopiranja

1. Opis se u `episodes/<slug>/episode.json` kopira **doslovno**, znak po znak. Ne skraćuje se, ne
   dopunjuje se, ne prilagođava se epizodi. Isti `id`, isto `name`, isti `locked_description`.
2. Svaki opis je već proveren na **25–40 reči** po `countWords` (`schemas.md` §0.6) i pisan kao
   imenička fraza bez tačke, tako da ulazi u `SUBJECT:` blok bez prepravke.
3. **Nosi identitet, nikad pozu ni stanje** (`schemas.md` §1.2). Bes, pokret, položaj ruku i odnos
   prema drugom liku idu u `ACTION`, `FRAME LAYOUT` i `SCALE`, po kadru.
4. `episode.json` nosi **samo entitete koji se u toj epizodi zaista pojavljuju**. Registar je veći
   od bilo kog pojedinačnog `episode.json` fajla i to je u redu.
5. Entitet koji postoji samo u jednoj epizodi **ne ulazi u registar** — piše se direktno u tom
   `episode.json` i tamo ostaje. U Part 1 su takvi: `rhea`, `the-hundred-handers`, `tartarus`,
   `crete-cave`, `cap-of-darkness`, `lot-helmet`, `the-stone`.

### 4.2 Likovi

| `id` | `name` | Koristi ga | Uloga |
|---|---|---|---|
| `zeus` | Zeus | 1, 2, 3, 4, comp | nebo; kralj u svakoj epizodi |
| `poseidon` | Poseidon | 1, 3, comp | more i zemljotres |
| `hades` | Hades | 1, 2, comp | mrak; jedini pokriven |
| `the-three-brothers` | The Three Brothers | 1, comp | grupni opis za kadar sa sva tri |
| `cronus` | Cronus | 1, 3 | otac koji guta; Part 3 ga citira |
| `the-five-siblings` | The Five Swallowed Children | 1, 2 | grupni opis, bogovi pre svojih simbola |
| `the-cyclopes` | The Cyclopes | 1, 4 | kovači triju oružja |

```json
[
  {
    "id": "zeus",
    "name": "Zeus",
    "locked_description": "a broad powerfully built Greek god in his prime, thick dark hair swept back from a high brow, a full curled beard, deep-set grey eyes under heavy brows, a purple-red himation over one shoulder, bare chest and bare feet"
  },
  {
    "id": "poseidon",
    "name": "Poseidon",
    "locked_description": "a heavily muscled Greek god in his prime, long dark hair in heavy salt-stiffened ropes, a thick pointed beard, sun-darkened weathered skin, pale sea-green eyes, a deep sea-green himation knotted low at the waist, bare feet"
  },
  {
    "id": "hades",
    "name": "Hades",
    "locked_description": "a lean severe Greek god in his prime, long black hair and a full black beard, pale bloodless skin, dark hooded eyes, a heavy black-violet himation covering both shoulders and falling to the ankles, bare feet"
  },
  {
    "id": "the-three-brothers",
    "name": "The Three Brothers",
    "locked_description": "three powerfully built bearded Greek gods in their prime, one in a purple-red himation with dark waving hair, one salt-weathered in sea-green with hair in heavy ropes, one pale in black-violet covering both shoulders"
  },
  {
    "id": "cronus",
    "name": "Cronus",
    "locked_description": "a gaunt ageing Titan with long grey-white hair and a heavy matted grey beard, a hollowed lined face, corded veined arms and big knuckled hands, a coarse dark ochre himation over one shoulder, bare chest and bare feet",
    "scale_critical": true
  },
  {
    "id": "the-five-siblings",
    "name": "The Five Swallowed Children",
    "locked_description": "five newly grown Greek gods, two bearded men and three women of the same tall strong build, plain undyed himatia and peploi, pale skin, no crowns, no jewellery and no weapons"
  },
  {
    "id": "the-cyclopes",
    "name": "The Cyclopes",
    "locked_description": "three giant one-eyed smiths with broad slab-muscled shoulders, one large eye set under a heavy single brow, shaggy black hair and beards, soot-blackened skin, rough leather aprons over bare torsos, scarred forearms and thick burned hands",
    "scale_critical": true
  }
]
```

**Vizuelna gramatika trojke, namerna:** Zevs je otkriven i u purpuru, Posejdon otkriven i u
zelenom, Had **jedini pokriven na oba ramena i do članaka**. Silueta govori ko je ko pre nego što
se vidi lice — i tiho nosi tezu epizode: brat koji se sklanja s vidika. Ne menjati bez razloga.

**Mali Zevs nije zaključan, namerno.** `locked_description` nosi odraslog boga; beba u pelenama u
istom tekstu bila bi kontradikcija u svakom drugom kadru. Kadar sa odojčetom **ne navodi `zeus` u
`shot.characters`** i opisuje dete slobodno u `SUBJECT` bloku. Isto važi za bilo kog boga u
detinjstvu u kasnijim partovima — ne pravi se drugi zaključani opis „young X".

### 4.3 Lokacije

| `id` | `name` | Koristi ga | Uloga |
|---|---|---|---|
| `olympus` | Mount Olympus | 1, 2, 3, 4, comp | jedino mesto koje nije podeljeno |
| `the-sea` | The Sea | 1, 3, comp | Posejdonov deo |
| `the-underworld` | The Underworld | 1, 2, comp | Hadov deo; Part 2 ga nasleđuje |
| `the-war-plain` | The Plain of the Titan War | 1, 3 | Titanomahija |

```json
[
  {
    "id": "olympus",
    "name": "Mount Olympus",
    "locked_description": "the summit of Mount Olympus above the cloud line, broad terraces of pale marble and bare rock, tall plain columns, wide open sky, snowfields and lower peaks showing far below through breaks in the cloud"
  },
  {
    "id": "the-sea",
    "name": "The Sea",
    "locked_description": "the open Aegean under a wide sky, deep blue-green water in long swells, white spray tearing off the crests, bare rocky islands low on the horizon, the pale sandy floor visible far down through clear water"
  },
  {
    "id": "the-underworld",
    "name": "The Underworld",
    "locked_description": "a vast grey cavern world under the earth, a slow black river in a wide bed, colourless asphodel meadows stretching into darkness, distant walls of dark rock, no sun and no horizon, a dim even greyness everywhere"
  },
  {
    "id": "the-war-plain",
    "name": "The Plain of the Titan War",
    "locked_description": "a scorched plain of cracked rock between two mountain ranges, the ground split into deep fissures, shattered boulders the size of houses, burning craters, smoke and ash blowing low across everything under a dark sky"
  }
]
```

### 4.4 Rekviziti

| `id` | `name` | Koristi ga | Uloga |
|---|---|---|---|
| `thunderbolt` | The Thunderbolt | 1, 3, 4, comp | poklon zarobljenika |
| `trident` | The Trident | 1, 3, comp | ribarsko koplje |

```json
[
  {
    "id": "thunderbolt",
    "name": "The Thunderbolt",
    "locked_description": "a hand-length weapon of solid white-gold light shaped like a spindle, tapering to sharp points at both ends, bound at the middle by a band of bronze, thin forks of lightning standing out from each end",
    "scale_critical": true
  },
  {
    "id": "trident",
    "name": "The Trident",
    "locked_description": "a bronze fishing spear the height of a man, a worn dark wooden shaft bound with cord below the head, three barbed prongs on a socketed head, the bronze dark and polished from long use",
    "scale_critical": true
  }
]
```

### 4.5 Zaključano unapred, još nekorišćeno

Ovi opisi se **ne pojavljuju u Part 1**, ali se pišu sada jer bi inače nastali u Part 2 bez plana.
Kopiraju se u `greek-gods-part-2/episode.json` kad tom partu dođe red.

| `id` | `name` | Koristi ga |
|---|---|---|
| `hera` | Hera | 2, 3, 4 |
| `demeter` | Demeter | 2, compilation |
| `hestia` | Hestia | 2, compilation |

```json
[
  {
    "id": "hera",
    "name": "Hera",
    "locked_description": "a tall stately Greek goddess in her prime, dark hair drawn back under a low golden crown, large steady eyes and a full mouth, a white peplos under a dark red mantle pinned at both shoulders, bare feet"
  },
  {
    "id": "demeter",
    "name": "Demeter",
    "locked_description": "a mature Greek goddess with heavy wheat-gold hair loosely bound, a broad calm sun-warmed face, strong working hands, a plain ochre peplos under a dark brown mantle drawn up over the head, bare feet"
  },
  {
    "id": "hestia",
    "name": "Hestia",
    "locked_description": "a quiet Greek goddess in her prime, light brown hair fully covered by a plain veil, a still even face, pale grey eyes, an undyed woollen peplos belted at the waist, a grey mantle over both arms, bare feet"
  }
]
```

---

## 5. Dva pravila kadra koja registar nameće

Ovo nisu stilske preporuke nego posledica aritmetike: P1 traži **90–160 reči** za ceo
`image_prompt`, a style string troši 16 (`docs/reference/style-string.md`). Zaključani opisi se u
taj budžet lepe doslovno.

**1. Najviše dva zaključana entiteta po kadru.** Dva opisa od po ~36 reči su 72 reči, plus style
16 = 88, pa na `SUBJECT`, `SETTING`, `ACTION`, `FRAME LAYOUT`, `LIGHT`, `PALETTE`, `DETAIL`,
`SCALE` i `NOT IN FRAME` ostaje ~70. To je tesno ali radi. Tri entiteta (~110 + 16 = 126)
ostavljaju 34 reči za devet blokova — ne radi, i to nije stvar veštine pisanja.

**2. Zato postoje grupni entiteti.** `the-three-brothers` i `the-five-siblings` su **jedan**
zaključani opis za kadar u kome se svi vide zajedno. Kadar tada navodi grupu, ne pojedince.

| Kadar pokazuje | `shot.characters` | Zašto |
|---|---|---|
| jednog brata | `zeus` \| `poseidon` \| `hades` | pun identitet, ima mesta za sve blokove |
| dva brata | dva pojedinačna `id`-a | 72 reči, prolazi |
| sva tri brata | `the-three-brothers` | tri pojedinačna ne staju u P1 |
| izbacivanje dece iz Krona | `the-five-siblings` (+ `the-stone`, `zeus`) | pet pojedinačnih je ~175 reči |

Grupni opisi su **kompresija pojedinačnih, a ne nova verzija lika** — nose iste raspoznatljive
tokene (purpurno-crveno / morsko-zeleno / crno-ljubičasto pokriveno). Kad se menja pojedinačni
opis, mora da se proveri i grupni.

`the-five-siblings` namerno nema krune, nakit ni oružje: to su bogovi **pre** nego što su postali
ono po čemu ih znamo. Kadar izbacivanja iz Krona je jedino mesto u celoj seriji gde se tako vide.

**Petoro, ne šestoro.** Kron je progutao petoro — Hestiju, Demetru, Heru, Hada i Posejdona, dakle
tri žene i dva muškarca. Zevs je šesto dete, ali nikad nije bio progutan, pa u kadru izbacivanja
stoji **suv i u purpurno-crvenom**, odvojen od linije. Šestoro dece Kronove jeste tačan skup, ali
nije tačan opis onoga što izlazi iz njega. Raniji lock je to spajao i greška je u Part 1 prošla
kroz ceo BLOCKING sloj, zato što C1 proverava da je opis **doslovno prepisan**, a ne da je tačan.
Zbog toga kadar nosi tri locka i sedi na ~278 reči, tik ispod P1 plafona: to je cena koja se
plaća svesno, jer je jedini kadar u seriji u kome se petoro i Zevs vide zajedno.

---

## 6. Lanac outroa

Outro svakog parta **imenuje sledeći part**. To je razlog zbog kog mapa mora da postoji pre Part 1.

**Formula za seriju — šest delova**, umesto četiri iz `docs/prompts/04-script.md`:

> [most iz *ove* epizode, na njenoj ključnoj imenici] + [**najava sledećeg parta**] +
> [**pitanje za komentare, izvučeno iz kičme epizode**] + [poziv koji imenuje vrstu priča koje
> kanal priča] + [leave a like and subscribe to Animated Tales] + [sign-off]

Serija **ne** izbacuje „poziv koji imenuje vrstu priča" iz bazne formule — on ostaje, a najava i
pitanje se dodaju ispred njega.

**Odstupanje od ugovora, svesno.** `04-script.md` traži **30–42 reči**. Najava košta ~15 reči, a
pitanje za komentare ~17, pa je budžet outroa u ovoj seriji **70–80 reči (~29–33s)**. Nijedna
provera ne meri outro, pa ovo ne ruši ništa u lancu; zapisano je da se ne bi tumačilo kao propust.
Van serije važi 30–42.

**Najava se ne poziva na broj parta.** Formulacija je **„In the next part"**, ne „Part Two".

> *Zašto je pravilo promenjeno:* ranija verzija je tražila doslovno „Part Two" / „Part Three" /
> „Part Four", da bi gledalac čuo isti broj koji vidi u naslovu sledećeg videa. Cena je bila ton —
> izgovoren broj zvuči kao kurs, a ne kao priča. Odluka: broj ostaje **u naslovu i u descriptionu**,
> gde je pretraživ i gde ga gledalac zaista traži; narracija ga ne izgovara. Ako se ikad vrati,
> mora da se vrati u **sva četiri parta odjednom** — pola serije sa brojem i pola bez je najgori
> mogući ishod.

Najava mora da: (a) počne sa **„In the next part"**, i (b) u jednoj klauzi kaže kičmu tog parta —
ne spisak imena. Imena bogova su dozvoljena, ali ne umesto kičme.

**Pitanje za komentare** mora da bude **izbor, a ne da/ne pitanje** — izbor tera na duži komentar i
lakše se piše. Izvlači se iz kičme epizode, nikad generički („what do you think?"). Isto pitanje
sme da se ponovi u pripadajućim Shorts-ovima; to je namerno, jer povezuje mrežu Shorts → long.

| Part | Ključna imenica mosta | Najava vodi na | Pitanje za komentare |
|---|---|---|---|
| 1 | *podela* — sve je podeljeno osim zemlje i Olimpa | tri sestre bez kraljevstva | koji od tri žreba bi uzeo |
| 2 | *ognjište / žetva* — ono u čemu ljudi stvarno žive | deca rođena uprkos | brak, žetva ili ognjište — koja sestra je imala pravu moć |
| 3 | *proročanstvo* — Zevs je uradio ono zbog čega je mrzeo oca | mreža | — piše se uz Part 3 |
| 4 | *mreža* — najslabiji bog je uhvatio najjače | compilation, ili Part 5 ako se radi | — piše se uz Part 4 |

**Part 1, zaključan tekst** (75 reči, stoji u `episodes/greek-gods-part-1/script.md`):

> Three brothers divided the universe and left the ground we live on common to all three. In the
> next part, their three sisters — swallowed by the same father, freed by the same brother, and
> given no kingdom at all. Sky, sea, or the dead — which lot would you have wanted? Tell us in the
> comments. If you like stories like this one, leave a like and subscribe to Animated Tales. Until
> next time.

**Part 2, zaključan tekst** (75 reči, stoji u `episodes/greek-gods-part-2/script.md`):

> The sisters were given no kingdom — only the marriage, the harvest and the hearth that every home
> is built around. In the next part, three gods who were never supposed to be born — one of them
> straight out of her father's head. Marriage, harvest or hearth — which sister held the real power?
> Tell us in the comments. If you like stories like this one, leave a like and subscribe to Animated
> Tales. Until next time.

Najava Part 3 nosi kičmu („rođeni uprkos") i jedan zadirkujući detalj (glava), a Metidu i Letu ne
imenuje — oba ostaju Part 3 da ih otkrije.

Formatiranje i dalje poštuje sva četiri parser-pravila iz `04-script.md`: naslov je tačno
`## OUTRO`, poslednji je u fajlu, nijedan drugi naslov ne počinje rečju „outro", a dve rezervne
varijante stoje u HTML komentaru.

---

## 7. Razgraničenje materijala

Bogovi se prelivaju kroz tuđe priče. Bez ovog spiska Part 1 pojede Atinu iz Part 3, a Part 2 ostane
bez Persefone. **Pravilo: materijal pripada partu čijeg boga objašnjava, a ne partu koji do njega
prvi stigne.**

| Materijal | Pripada | Šta Part 1 sme |
|---|---|---|
| Kron guta decu, proročanstvo, kamen, Titanomahija | **1** | sve |
| Žreb tri brata (Ilijada 15.187–193) | **1** | sve |
| Kiklopi i sto-ruki, tri oružja | **1** | **tri oružja da, rat ne** — rat je jedan sažet pasus, detalji idu u Titan video |
| Uran i srp, Otris, Atlas, mera Tartara, Kureti | **Titan video** | ne pominje se |
| Metida progutana, Atina iz Zevsove glave | **3** | **ne pominje se** — Part 3 je nosi kao vraćanje na Part 1. Part 1 sme da pokaže **ispijen pehar** u kadru izbacivanja: emetik kao predmet, bez toga ko ga je spravio. Metida se niti vidi niti imenuje, pa callback ostaje netaknut |
| Nadmetanje za Atinu (maslina vs. slani izvor) | **3** | **ne imenuje ni Atinu ni Atenu**; Posejdonova ozlojeđenost ide kroz Ilijadu i kroz „gubio je gradove", bez imena |
| Had i Persefona | **2** | sme da kaže da svi jednom stižu kod njega; otmicu **ne** |
| Hera kao Zevsova žena | **2** | Hera se vidi u kadru izbacivanja, među petoro progutanih, ali priča o braku je Part 2 |
| Hera baca Hefesta s Olimpa | **4** | ne |
| Hestija i ognjište | **2** | ne |

**„Hestija ustupa presto Dionisu" nije antički mit** — potiče od Roberta Grejvsa (*The Greek Myths*,
1955). Antičko je samo to da se spiskovi dvanaestorice razlikuju (oltar dvanaest bogova u Atini ima
Hestiju, istočni friz Partenona se obično čita sa Dionisom). Ranija verzija ove tabele vodila je
ustupanje prestola kao materijal za Part 2; skinuto je, i Part 2 ga ne koristi ni kao rečenicu.

**Part 2 i žreb.** *Homerska himna Demetri* (75–87) sama se poziva na podelu: Helios teši Demetru da je
Had „tvoj rođeni brat" i gospodar „trećine koju je dobio kad je podela napravljena". Most između Part 1
i Part 2 je u izvoru, ne izmišljen — i zato ga skripta izgovara.

Za Part 1 to praktično znači: **Posejdonova ozlojeđenost se priča kroz Ilijadu 15 i kroz to da je
gubio gradove i odgovarao poplavom i sušom — bez imenovanja Atine.** Tako Part 3 dobija netaknuto
nadmetanje kao svoju scenu.

---

## 8. Plan compilationa

**Naslov:** The 12 Gods of Greek Mythology · **Trajanje:** ~5 min · **Krediti: nula.**

Compilation je **nova narracija preko već generisanih kadrova iz sva četiri parta**. Ne generiše se
nijedna nova slika ni klip. Jedan dan posla.

- ~25s po bogu × 12 = ~300s, plus uvod i outro → seče se do 5 minuta, tvrdog plafona iz
  `channel-bible.md` §2.
- Piše se **tek kad sva četiri parta postoje**, i objavljuje se kad partovi već imaju gledanost
  koju compilation može da preuzme.
- Lanac je isti kao za epizodu (`align` → `beatplan` → `lint` → `assemble`), ali se `shots/` folder
  puni **kopijama i isečcima iz partova**, ne novim generisanjem. `episode.json` compilationa
  kopira registar iz ovog fajla u celini.
- Svaki bog dobija **jedan kadar koji je u svom partu već nosio njegov najjači trenutak**. Ako
  compilationu za nekog boga fali kadar, to znači da je taj part imao rupu — a to se vidi tek ovde,
  zato ovaj plan stoji pre Part 1.

**Rizik koji treba pratiti:** partovi 2–4 moraju da ostave bar po jedan čist, „portretni" kadar po
bogu — kadar u kome je bog sam i prepoznatljiv. U Part 1 to su pojedinačni kadrovi Zevsa, Posejdona
i Hada (zato pojedinačni zaključani opisi postoje i pored grupnog).

---

## 9. Kontrola

Pre nego što bilo koji part ode u produkciju:

```bash
node tools/lint.mjs episodes/greek-gods-part-N --no-media
```

Linter proverava C1 unutar epizode. **Poklapanje sa registrom ne proverava** — to je ručni korak:
`locked_description` u `episode.json` mora znak po znak da odgovara sekciji 4 ovog fajla.
