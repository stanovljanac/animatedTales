# heavenly-horses — beleške produkcije

## Režim: sve slike

Korisnikova odluka: epizoda je u potpunosti od still kadrova (`render_mode: "still"`), nula
kredita. Skelet se pravi sa `beatplan.mjs --still`. Rez je 2.5–9.0s, pa ~4:40 naracije nosi
**~45–55 slika**.

## Trajanje

Skripta ima **687 reči** (646 + outro 41). Pri 145 wpm (tempo `antikythera-mechanism`) to je
~4:44; pri 139 wpm (`tyr-and-fenrir`) ~4:56. Merodavna je tek izmerena ElevenLabs narracija.

- **Ako pređe 5:00**, seče se ovim redom: „The whole empire, Sima Qian wrote, was in upheaval."
  (9 reči), pa rečenica o dvojici stručnjaka za konje (19) — tada „His experts chose" postaje
  „The Chinese chose".
- **Ako ostane ispod ~4:15**, prvo se vraća himna i spor oko careve namere (~55 reči, tekst je u
  `research.md` → OPTIONAL MATERIAL), između povratnih brojki i „A year later".

**Izmereno:** `narration.mp3` **279.75s** (4:40). Skraćivanje ni vraćanje ne treba.

## Narracija i alignment

`align.mjs` je pušten dvaput. `small.en`: poklapanje 97.3%, 7 rečenica ispod 0.85 — sve na
imenima (Dayuan, Ferghana, Sima Qian). Po skilu ponovljeno sa **`medium.en`, koji je zadržan**:
96.8%, 6 ispod 0.85, 2 pauze >1.5s umesto 6.

Oba modela prave istu vrstu greške na po dve granice: pauzu posle rečenice pripišu prvoj reči
sledeće, pa rez padne na **kraj** prethodne rečenice umesto na početak sledeće — dakle u tišinu.
`small.en` to radi na S25 i S34 (obe su granice beatova), `medium.en` na S37 (−1.26s, granica
B34) i S50 (unutar end karte). Ista vrsta greške, manje pogođenih granica, bolja pouzdanost ⇒
`medium.en`. `timing.json` se ne dira ručno.

## Osa ekrana (zaključana pre pisanja promptova)

> **Han Kina drži desnu polovinu ekrana i gleda/kreće se ulevo — na zapad. Dajuan i Xiongnu
> drže levu i gledaju udesno.**

Svesno odstupanje od podrazumevane podele iz `camera-language.md` (strana gledaoca levo), iz
jednog razloga: **mapa**. B06 je slikana karta sa Chang'anom na desnoj ivici i Ferganom na levoj,
kako svaka karta stoji — zapad je levo. Kad bi scene vodile vojsku udesno, a karta ulevo, gledalac
bi dobio dva suprotna smera za isti pohod. Ovako je smer isti u svakom kadru: **na zapad = ulevo,
kući = udesno.** Da kretanje ulevo čita kao otpor ovde radi za priču, ne protiv nje — oba pohoda
su borba sa razdaljinom.

- **Desno, gleda i kreće se ulevo:** car, Li Guangli, poslanik, Han vojska, Žadna kapija kao
  polazište (kapija u desnoj polovini, pustinja levo od nje).
- **Levo, gleda udesno:** Xiongnu, plemići Dajuana, grad Dajuan, oazni gradovi.
- **Povratak** (B35b, B36) ide **udesno** — jedini kadrovi u kojima se Han kreće tom stranom.

Sima Qian je izvan sukoba: gleda na dole, u letvice, ne preko ose.

## Beat mapa

**45 beatova · 51 slika · prosek 5.49s · 24/51 u opsegu 4–6s.** Šest rezova unutar rečenica
(S03, S18, S26, S38, S39, S47) — sve su rečenice duže od 9s ili im je sused kraći od 2.5s, i
svaki rez pada na mesto koje odgovara slici:

| Rečenica | Prvi shot | Drugi shot |
|---|---|---|
| S03 | „…the most dangerous enemy of the Han dynasty lived on" — Xiongnu kao masa | „horseback: the Xiongnu…" — jedan jahač izbliza |
| S18 | „…a few thousand starving soldiers, and it was" — izgladnela kolona | „beaten at the same border town…" — poraz |
| S26 | „…sixty thousand soldiers marched west, with a hundred thousand" — vojska | „oxen, more than thirty thousand horses, … camels" — stoka |
| S38 | „…several dozen of the finest horses and more than three thousand" — izbor | „ordinary ones, and the army turned for home" — povratak |
| S39 | „…just over ten thousand came back through" — tanka kolona | „the Jade Gate, with just over a thousand horses" — konji |
| S47 | „…grew fields of alfalfa from" — polja oko palata | „Ferghana seed: fodder, for the horses of heaven" — konji na lucerki |

Dugi kadrovi koji se ne mogu deliti bez reza usred rečenice: B06 (8.3s, karta), B15 (8.1s),
B16 (8.4s), B20 (8.8s, Žadna kapija), B30 (8.8s). Na svima ide `push` ili `pan`, ne `hold`.

## Tačnost perioda — važi za svaku sliku

- **Nema uzengija.** Han konjica oko 100. p.n.e. jaše bez uzengija; sedlo je mekano. Model ih crta
  po navici, pa ide u `NOT IN FRAME` na svakom kadru sa jahačem.
- Han vojnik: lamelarni oklop, samostrel (crossbow) i luk, koplje-helebarda *ji*; ne srednjovekovni
  kineski oklop iz filmova.
- Dajuan: grad od nepečene cigle i nabijene zemlje u dolini okruženoj planinama, ne kamena tvrđava.
- Fergana konji: visoki, vitki, dugih nogu — namerno drugačija silueta od niskih stepskih konja sa
  početka epizode. Ta razlika je ceo razlog rata i mora da se vidi.
- Žadna kapija (Yumen): utvrđeni prolaz od nabijene zemlje u pustinji, ne monumentalna kapija.

## Kadrovi koji traže odluku pre promptova

- **Glava kralja i pokolj** se ne prikazuju. Rečenica se nosi posledicom: zatvoren sanduk koji
  plemić nosi kroz kapiju, spuštena koplja, prazan trg.
- **Razbijen zlatni konj** je tambnejl kandidat — ista slika nosi i hook i naslov.
- **Skrenuta reka** (shot 31): **ne presek** — reč *cross-section* vuče model ka udžbeničkom
  dijagramu. Širok kadar sa uzvišenja: zid, staro korito kako se suši, nasip od zemlje i pruća,
  kopači sa korpama, reka koja skreće u novi kanal. Dijagrami i strelice su u `NOT IN FRAME`.

## Izmene posle reviewa (pre promptova)

| Beat / shot | Izmena | Zašto |
|---|---|---|
| B06 / 07 | svilena mapa odmotana **zdesna nalevo** preko lakiranog stola, naslikana kao pejzaž; bez natpisa, strelica i ruže vetrova | predmet iz sveta priče, ne infografik; kineski svitak se čita zdesna nalevo, što je i osa epizode |
| B07 / 08 | jedan konj iz donjeg rakursa, crvenkast odsjaj znoja; oblaci samo kao pramenovi otkinuti sa grebena | „people said" — slika ne sme da tvrdi legendu; reč *horse* ne stoji uz oblake, a „ghost horses, horses in the sky" su u `NOT IN FRAME` |
| B11 / 12 | ledger → putovanje: karavan preko slanog tla, **svaka druga** kamila sa praznim sedlom, sveži grobovi od kamenja duž staze | `ledger-accumulation` bi bio ×3 (R3); „pola" ostaje u promptu |
| B24 / 27 | drugi shot je najširi kadar epizode; vrste stoke se čitaju kao **pojasevi** boje, ne kao jedinke | narracija ih čita kao spisak |
| B41 / 46 | zlatni konj sam na tamnoj tkanini, čist profil ka desnoj ivici, leđa na sredini kadra | callback bez dvorane iz B09; 47 (dva živa konja) je komponovan isto — rez zlato → živi konji |
| B05 / 06 | vest „sa dalekog zapada" dolazi na **graničnu osmatračnicu**, ne na kapiju palate | B05 i B08 bi oba bila na kapiji palate |
| B22, B23 / 24, 25 | poslanici na stepeništu palate po danu; ministri u okovima silaze niz terasu dok se regruti postrojavaju | tri uzastopna kadra u istoj dvorani pri lampama; drveni jaram (cangue) je kasniji od Hana i stoji u `NOT IN FRAME` |
| B10, B37 / 11, 42 | Sima Qian: srednji plan za stolom, pa krupni plan šake i kista | ista postavka, druga veličina |

## Lockovi i kontinuitet

- Dodat `horse-judges` (dvojica procenjivača konja) — pojavljuju se u 29 (proba na stepskom konju) i
  38 (biraju najboljeg ferganskog konja), pa moraju da budu isti ljudi.
- `golden-horse` ide doslovno u 09, 10, 14 i 46 — callback se prepoznaje po locku, ne po „pamćenju"
  modela.
- End kartica (51): nebeski konj i han vojnik na otvorenoj Žadnoj kapiji u zalazak, gornja trećina
  prazna za naslov.
