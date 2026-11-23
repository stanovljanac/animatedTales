# Serija — Greek Gods

**Status:** mapa potvrđena, sva četiri dela gotova, compilation sklopljen (`episodes/greek-gods-compilation`, §8). Ovaj fajl je **izvor istine za celu seriju** i piše se
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
| 4 | `greek-gods-part-4` | Hephaestus, Aphrodite, Ares | **Mreža.** Majka ga je bacila s Olimpa jer je bio hrom, oženio je najlepšu boginju, uhvatio je u krevetu s Aresom — i pozvao ceo Olimp da gleda. Jedna priča drži svo troje. |

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

### 4.6 Zaključano u Part 3

Atina, Apolon i Artemida dobijaju lock u Part 3 i od tada su registar: nose ih end kartica Part 3,
compilation i svaki kasniji kadar u kome se pojave. Helios (Part 2) i kamen (Part 1) bili su lokalni,
ali ih Part 3 ponavlja, pa po pravilu 4.1 tačka 5 prelaze u registar — tekst je doslovno onaj iz
parta u kome su nastali.

| `id` | `name` | Koristi ga | Uloga |
|---|---|---|---|
| `athena` | Athena | 3, comp | rođena iz Zevsove glave; zlatni šlem zabačen, egida preko maslinastozelenog |
| `apollo` | Apollo | 3, comp | rođen na Delosu; zlatokos, belo i zlato, lovor |
| `artemis` | Artemis | 3, comp | rođena prva, babica bratu; kratki šafran hiton, zlatne strele |
| `helios` | Helios | 2, 3 | sunce koje sve vidi (Part 2), staje na Atinino rođenje (Part 3) |
| `the-stone` | The Stone | 1, 3 | kamen u povoju (Part 1), u Delfima (Part 3) |

**Vizuelna gramatika trojke, namerna:** Atina je jedina u oklopu (zlato i maslinastozeleno), Apolon
jedini otkrivenih grudi u belom i zlatu, Artemida jedina u kratkom hitonu i čizmama. Grupni lock
`the-three-children` je lokalan za Part 3 i nosi iste tokene.

```json
[
  {
    "id": "athena",
    "name": "Athena",
    "locked_description": "a tall strong Greek goddess in her prime, dark hair bound at the nape, clear grey eyes, a crested golden Corinthian helmet worn pushed back on her head, a scaled golden aegis over a long olive-green peplos, bare feet"
  },
  {
    "id": "apollo",
    "name": "Apollo",
    "locked_description": "a tall beardless young Greek god, long golden hair with loose curls at the neck, a laurel wreath, a calm radiant face, clear blue eyes, a white himation edged in gold over one shoulder, bare chest and bare feet"
  },
  {
    "id": "artemis",
    "name": "Artemis",
    "locked_description": "a lithe young Greek huntress goddess, auburn hair tied up in a knot, a sharp sun-browned face with green-brown eyes, a knee-length pale saffron hunting chiton with a red border, a quiver of golden arrows, laced hunting boots"
  },
  {
    "id": "helios",
    "name": "Helios",
    "locked_description": "a radiant beardless Greek god of the sun, a crown of long golden rays standing out from his curls, eyes of white fire, a gold-white chiton, a chariot of beaten gold drawn by four horses with manes of flame",
    "scale_critical": true
  },
  {
    "id": "the-stone",
    "name": "The Stone",
    "locked_description": "a smooth oval boulder of grey limestone about the size of a swaddled newborn, worn round by a river, the surface faintly veined and pitted, one end slightly narrower than the other",
    "scale_critical": true
  }
]
```

### 4.7 Zaključano u Part 4

Hefest, Afrodita i Ares dobijaju lock u Part 4 i od tada su registar: nose ih end kartica Part 4,
compilation i svaki kasniji kadar u kome se pojave. Ostalo što Part 4 zaključava je lokalno za taj
part i ostaje u `episodes/greek-gods-part-4/episode.json` (`hermes`, `the-sea-goddesses`,
`sea-cave`, `the-forge`, `the-bedchamber`, `the-net`, `the-golden-throne`); `hermes` prelazi u
registar tek ako se napravi Part 5.

| `id` | `name` | Koristi ga | Uloga |
|---|---|---|---|
| `hephaestus` | Hephaestus | 4, comp | bačen s Olimpa jer je hrom; čađ, kožna kecelja, kriva leva noga |
| `aphrodite` | Aphrodite | 4, comp | najlepša boginja; biserno-bela, zlatni pojas |
| `ares` | Ares | 4, comp | bog rata, Herin drugi sin; tamna bronza i grimizno |

```json
[
  {
    "id": "hephaestus",
    "name": "Hephaestus",
    "locked_description": "a thickset heavily muscled bearded Greek smith-god, soot-streaked skin and a thick dark beard, a thin crooked left leg with the foot turned inward, a scorched leather apron over one bare shoulder, a plain pointed workman's cap"
  },
  {
    "id": "aphrodite",
    "name": "Aphrodite",
    "locked_description": "an astonishingly beautiful Greek goddess in her prime, long honey-gold hair braided with pearls, a luminous rose-pale face with large dark eyes, a sheer pearl-white peplos under a gold-stitched girdle, gold bracelets, bare feet"
  },
  {
    "id": "ares",
    "name": "Ares",
    "locked_description": "a tall hard-muscled beardless Greek war god in his prime, cropped black hair, a scarred cheek and cold grey eyes, a dark bronze muscle cuirass over a crimson tunic, bronze greaves, a short crimson cloak over one shoulder"
  }
]
```

**Vizuelna gramatika trojke, namerna:** Hefest je jedini radnik (koža, čađ, kapa, kriva noga),
Afrodita jedina u prozirnom biserno-belom sa zlatom, Ares jedini u punoj tamnoj bronzi i grimizu.
Silueta govori ko je ko pre lica: smeđe-crni radnik, svetla boginja, crveno-bronzani ratnik.

**„Hrom", ne „ružan".** Mapa serije (§2) je prvobitno govorila „ružan"; ispravljeno po izvorima.
Nijedan antički tekst ne kaže da je bio ružan: Ilijada 18 kaže da ga je Hera htela da sakrije jer je
hrom, a Himna Apolonu da je bio slab i sa osušenom nogom. Skripta, lock i mapa prate izvore. Smisao
kičme je isti — sramota majke — ali reč je *lame*, i tako je i u kadru (kriva noga, a ne ružno lice).
Opšte pravilo: kad se formulacija biblije i izvor razlikuju, važi izvor i biblija se ispravlja.

**Dionis i Hermes nisu zaključani u registru.** Dionis je u skripti samo „the god of wine" i dobija
jedan do dva kadra, opisan slobodno u `ACTION`. Hermes je u Part 4 lokalan (net-scena i ćup).

**Afrodita i Ares leže pod pokrivačem, vide im se samo glave.** Odiseja ih stavlja u krevet; pripovedanje
kaže samo „lay down together". Svaki kadar sa njima u krevetu ima pokrivač navučen do ramena, glave i
lica iznad njega, a mreža pada preko pokrivača. Nijedan kadar ne pokazuje golo telo, pa nije potrebna
odeća u tom kadru. Kad stoje van kreveta (svečani kadri, end kartica), odeveni su po lockovima. To je
ograničenje za storyboard i ne menja skriptu.

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
| 3 | *proročanstvo* — Zevs je uradio ono zbog čega je mrzeo oca | mreža | Atina, Apolon ili Artemida — koga bi svetu najviše falilo da se nije rodio |
| 4 | *mreža* — najslabiji bog je uhvatio najjače | compilation (Part 5 nije planiran) | Hephaestus, Aphrodite ili Ares — ko je te noći izgubio najviše |

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

**Part 3, zaključan tekst** (80 reči po `countWords`, stoji u `episodes/greek-gods-part-3/script.md`):

> Cronus swallowed his children to escape a prophecy. His son swallowed a wife to escape the same
> one. In the next part, the god his mother threw off Olympus marries the most beautiful goddess —
> and catches her in a net. Athena, Apollo or Artemis — which one would the world miss most if they
> had never been born? Tell us in the comments. If you like stories like this one, leave a like and
> subscribe to Animated Tales. Until next time.

Najava Part 4 nosi kičmu (majka ga je bacila s Olimpa, oženio je najlepšu, mreža) i ne imenuje ni
Hefesta, ni Afroditu, ni Aresa — sva tri imena ostaju Part 4. Pitanje za komentare je izvučeno iz
kičme „rođeni uprkos": šta bi svetu falilo da nisu rođeni.

**Part 4, zaključan tekst** (74 reči po `countWords`, stoji u `episodes/greek-gods-part-4/script.md`):

> A net no one could see caught the swiftest god on Olympus, and it was made by the god his mother
> threw away. Next on the channel: all twelve gods of this series, from Zeus to Hephaestus, together
> in one story. Hephaestus, Aphrodite or Ares — who lost the most that night? Tell us in the
> comments. If you like stories like this one, leave a like and subscribe to Animated Tales. Until
> next time.

Most je na ključnoj imenici *net* i na epizodinoj ironiji (najsporiji uhvatio najbržeg). Part 4 je
kraj numerisanog lanca, pa **ne počinje sa „In the next part"**: najava vodi na compilation i
počinje sa „Next on the channel". Pitanje je izbor od tri, izvučeno iz kičme epizode.

**Najava je obaveza, ne uslov.** Compilation se radi bez obzira na preglede partova (§8): ako bi se
čekalo na gledanost, možda se nikad ne bi objavio, a izgovoreno obećanje ne može da se povuče iz
objavljenog videa. Lanac outroa je dosledan — Part 1 vodi na Part 2, Part 2 na Part 3, Part 3 na
Part 4, Part 4 na compilation. ALT 1 u `script.md` (zatvara seriju bez obećanja) ostaje samo kao
rezerva.

Formatiranje i dalje poštuje sva četiri parser-pravila iz `04-script.md`: naslov je tačno
`## OUTRO`, poslednji je u fajlu, nijedan drugi naslov ne počinje rečju „outro", a dve rezervne
varijante stoje u HTML komentaru.

### 6.1 End kartica svakog parta

Poslednji shot svakog parta je end kartica po odeljku „End kartica" u
`docs/reference/prompt-templates.md` — poster koji rekapitulira **ceo** part, sa naslovom i
SUBSCRIBE dugmetom. U seriji važi još i ovo, da bi četiri kartice izgledale kao jedan komplet:

- **trojka parta stoji preko celog kadra**, near-camera i front on, svako na svojoj trećini,
  pogled u gledaoca — kao braća na kartici Part 1;
- **oko svakog boga, sitno i daleko, scene njegove priče iz tog parta**, a u prvom planu uz donju
  ivicu po jedan simbol njegove priče;
- **naslov u tri reda**: veliki red sa trojkom, srednji sa kičmom parta, tanki razmaknuti red sa
  tri domena (Part 1: `THE THREE BROTHERS` / `AND THE DIVISION OF THE UNIVERSE` /
  `SKY · SEA · THE DEAD`; Part 2: `THE THREE SISTERS` / `WHO GOT NO KINGDOM` /
  `MARRIAGE · HARVEST · HEARTH`);
- slova ista na sve četiri: klesana bronzano-zlatna serifna velika slova sa tamnim obrisom;
- tri pojedinačna locka iz registra (§4), ne grupni lock — likovi su dovoljno veliki da se opis
  vidi.

| Part | Trojka, sleva nadesno | Kičma u srednjem redu | Tri domena |
|---|---|---|---|
| 1 | Zeus, Poseidon, Hades | `AND THE DIVISION OF THE UNIVERSE` | `SKY · SEA · THE DEAD` |
| 2 | Hera, Demeter, Hestia | `WHO GOT NO KINGDOM` | `MARRIAGE · HARVEST · HEARTH` |
| 3 | Athena, Apollo, Artemis | `WHO WERE NEVER SUPPOSED TO BE BORN` (veliki red: `THE THREE CHILDREN`) | `WISDOM · PROPHECY · THE HUNT` |
| 4 | Hephaestus, Aphrodite, Ares | `AND THE NET THAT CAUGHT THEM` (veliki red: `THE SMITH, HIS WIFE AND HIS BROTHER`) | `FORGE · LOVE · WAR` |

Part 4: Afrodita stoji **u sredini, između muža i ljubavnika** — raspored sleva nadesno je i
poenta kartice. Simboli uz donju ivicu: nakovanj i čekić (Hefest), pehar sa biserima i zlatni pojas
(Afrodita), bronzani šlem sa grimiznim perjem (Ares). Sitne scene oko svakog: Hefest bačen s Olimpa
i zlatni presto, Afrodita i zlatna mreža, Ares u bronzanom ćupu. Mreža se vidi samo kao tanak sjaj
lanaca, nikad kao kadar sa golim telom: u krevetu su Afrodita i Ares pod pokrivačem, vide im se samo
glave (vidi §4.7).

### 6.2 Rekap na početku parta

Outro gleda unapred, rekap unazad. Rekap je **najviše 2–3 kadra, 15–20s, 2–4 rečenice (~50 reči)**
i služi samo tome da se part prati bez prethodnog. Prethodni part je već na kanalu; rekap koji ga
prepričava troši prvi minut na video koji gledalac nije kliknuo, a pravi se kao da je nov.

> *Zašto:* Part 2 je otvorio rekapom od ~31s (S03–S09, sedam rečenica) sa tri nova klipa — shot03,
> shot05 i shot06, 37 kredita po tadašnjem cenovniku Omni 1.1 — a sve što pokazuju Part 1 je već imao: Kron guta decu, izbacuje ih,
> braća dele svet. Part 3 otvara jednom rečenicom i odmah ulazi u Metidu.

1. **Rekap se piše prema kadrovima koji već postoje.** Svaka rečenica prepričava jedan događaj koji
   je raniji part ispričao i pokazao, a njen shot se **ne generiše nego kopira**. Zbog registra (§4)
   i istog style stringa kopiran klip izgleda kao da je pravljen za novi part — isti mehanizam
   koristi compilation (§8). Kad nijedan postojeći kadar ne nosi rečenicu, prvo se traži druga
   formulacija istog događaja, pa tek onda nov kadar.
2. **Kopija, ne putanja.** `episodes/<raniji-part>/shots/partNN.mp4` se kopira u `shots/partMM.mp4`
   novog parta. `source_file` koji pokazuje na `../greek-gods-part-N/…` lint i montaža bi pročitali,
   ali ga `tools/timeline.mjs` vraća na `shots/partMM.mp4` pri svakom ponovnom sečenju, a puca i kad
   se folder pomeri.
3. **Prozor sme da se pomeri.** Klip se uzima i od sredine kroz `use_in` / `use_out`
   (`use_out = use_in + use_len`), dok god prozor staje u trajanje starog klipa — to meri F1. Still
   ostaje na `use_in = 0`, pa se slika kopira cela.
4. **Storyboard opisuje ono što je u kadru.** `image_prompt`, `animation_prompt` i `characters` se
   prepisuju iz izvornog shota, a svaki lock koji se u kadru vidi ulazi u `episode.json` novog parta,
   doslovno iz §4 — inače C1 pada (`characters` navodi entitet koji ne postoji u `episode.json`).
5. **Poreklo ide u `notes.md`**, npr. `shot01 ← greek-gods-part-2 shot05, use 1.0–5.3s — ne
   generiše se`. Taj red je ono što kaže da se shot preskače u Flow-u.

**Part 4:** most unazad je Hera koja iz besa zbog Atine rađa Hefesta sama (§7). Atinino rođenje
već nosi Part 3 — kadar u kome iskače iz Zevsove glave — pa se rekap piše prema njemu i prema
kadru Here na Olimpu iz Part 3; nov kadar dobija tek Hefest. U `greek-gods-part-4/script.md` to su
S01 ← Part 3 shot 12 (`athena`, `zeus`, `olympus`) i S02 ← Part 3 shot 20 (`hera`, `olympus`);
prvi nov kadar je S03. Oba locka stoje u `episode.json` Part 4 zbog C1.

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
| Sekira koja otvara Zevsovu glavu (Pindar: Hefest; Apolodor: Prometej ili Hefest) | **3** za sekiru, **4** za Hefesta | Part 3 sme sekiru **bez nosioca** („later poets say it took an axe"); Hefest se u Part 3 ne imenuje i ne vidi |
| Hera iz besa zbog Atine rađa Hefesta sama (*Teogonija* 927–929) | **4** | Part 3 ne pominje — to je Part 4 most na Part 3 |
| Hera rađa Tifaona i daje ga zmaju u Delfima (*Himna Apolonu* 305–355) | nije u planu | Part 3 ga ne koristi (vuče Hefesta); kandidat za Short |
| Hestija i ognjište | **2** | ne |
| Hefest bačen s Olimpa, pećina Tetide i Eurinome, zlatni presto | **4** | Part 3 ga ne imenuje; sekira bez nosioca ostaje jedini dodir |
| Mreža (*Odiseja* 8.266–366), Helios kao doušnik, Posejdonova garancija | **4** | Helios je u Part 2 „sunce koje sve vidi" (§4.6); Part 4 ga ponavlja u istoj ulozi |
| Ares u bronzanom ćupu (*Ilijada* 5.385–391) | **4** | ne |
| Afroditino rođenje iz pene, Uran i srp | **Titan video** | Part 4 ga ne priča: Afrodita je u Odiseji Zevsova ćerka i skripta ne navodi poreklo |

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

**Naslov:** The 12 Gods of Greek Mythology · **Trajanje:** ~15 min · **Krediti: nula.**

**Odluka korisnika (2026-11-22): compilation je sva četiri dela sklopljena u jedan video**, a ne nova
petominutna naracija preko starih kadrova (raniji plan ovog odeljka). Priča svakog dela ostaje cela;
otpadaju samo ponovljeno — rekap na početku nastavaka — i kraj: outro sa najavom sledećeg dela,
„leave a like and subscribe" i end kartica. Part 4 outro i dalje obećava „all twelve gods of this
series… together in one story" i to je ovaj video. Tvrdi plafon od 8 minuta važi za epizode, ne za
compilation sklopljen od četiri već objavljena dela.

- Ništa se ne generiše: ni slika, ni klip, ni naracija. Sve je rez postojećeg.
- Pravi se **novom epizodom** `episodes/greek-gods-compilation/` alatom `tools/compile.mjs` iz
  `compile.json` (rečenice i kadrovi po delu); montažu radi običan `tools/assemble.mjs`, pa svi delovi
  dobijaju isti template (zum 1.06, zvuk klipova 10,5%) bez obzira kad su prvi put sklopljeni.
- **Šta otpada po delu:** Part 1 — outro S55–S60 i end kartica; Part 2 — rekap S01–S09 (tri brata,
  Kron, podela) i outro; Part 3 — outro; Part 4 — rekap S01–S03 (dva kadra kopirana iz Part 3) i outro.
- **Spojevi se rade postojećim materijalom, bez novih scena:** Part 1→2 vodi Part 2 S02 („Their three
  sisters were never given a lot.") preko prelaznog still-a kacige i tri senke, koji je Part 2 već
  imao; Part 2→3 je direktan rez; Part 3→4 vodi Part 4 S02 („Hera could not stop a child born from her
  husband's head.") preko Herinog besa (Part 4 shot 03) umesto kopije iz Part 3. Obrazloženje i
  predlog opcionih novih scena su u `episodes/greek-gods-compilation/notes.md`.
- Rezovi zvuka su na stvarnoj tišini (ne na alignmentu), a prozor zvuka i slike je isti.

## 9. Kontrola

Pre nego što bilo koji part ode u produkciju:

```bash
node tools/lint.mjs episodes/greek-gods-part-N --no-media
```

Linter proverava C1 unutar epizode. **Poklapanje sa registrom ne proverava** — to je ručni korak:
`locked_description` u `episode.json` mora znak po znak da odgovara sekciji 4 ovog fajla.
