# Flow filter — kad generisanje padne i šta tada

Flow (image-to-video, Omni) odbija klip pre nego što ga napravi, a kredit vraća. Odbijanje gotovo
uvek **ne zavisi od reči animation prompta**: filter gleda **izvornu sliku** i radnju koju
prompt traži od nje. Zato većina popravki nije prepisivanje prompta nego jedna od tri stvari:
promena slike, promena radnje ili izlazak iz Flow-a (still).

Redosled pokušaja je isti za svaki rizičan shot, i rizične shotove treba pripremiti **unapred**, ne
tek kad padnu:

1. **Plan A** — original: prvi frejm scene i radnja kako je mit traži.
2. **Plan B** — alternativna slika **i** animacija, sa zamenjenim rečima i preusmerenom radnjom.
   Piše se zajedno sa Planom A i čuva u `episodes/<slug>/alternatives.md`.
3. **Plan C** — still sa slikom koja je prošla, bez Flow klipa. Garantovano radi.

`node tools/flow-risk.mjs episodes/<slug>` nalazi shotove kojima treba Plan B, uz zamenu za svaku
reč, i shotove čija slika prikazuje sredinu scene umesto početka
([`prompt-templates.md`](prompt-templates.md) → „Početni frejm, ne sredina scene").

Ovaj dokument je spisak **potvrđenih** slučajeva i **hipoteza** sa po nekoliko alternativa za svaki.
Hipoteza je označena; kad je korisnik potvrdi ili opovrgne, prebaci se u potvrđene.

## 1. Prvi korak: tačna poruka

Poruka određuje popravku. Zato pre svake izmene traži tekst koji je Flow ispisao.

| Poruka sadrži | Kategorija | Odeljak |
|---|---|---|
| „harmful content related to minors" | maloletnik u kadru ili u opasnosti | 3.1 |
| „sexual content" | golotinja, gola koža velika u kadru, intima | 3.2 |
| „violence" / „graphic" / „harmful content" | krv, rane, odsečeni delovi tela, mučenje, smrt | 3.3 |
| „self-harm" / „dangerous" | radnja koja se čita kao samopovređivanje (skok u vatru, vešanje, trovanje) | 3.4 |
| „real person" / „public figure" | prepoznatljiva stvarna ličnost | 3.5 |
| „copyright" / „third-party" | zaštićen lik ili brend | 3.6 |
| „prompt might violate" bez kategorije, ili samo „failed" | nepoznato | 4 |

Korisnik često ne prijavi poruku. Tada **ne pogađaj kategoriju**: pogodak 14. nov (maloletnik
umesto golotinje) potrošio je tri prepisivanja prompta bez efekta. Pitaj za poruku, a dok je nemaš,
primeni popravku koja važi za sve kategorije odjednom (Plan B, odeljak 2).

## 2. Planovi i alati

Idi redom A → B → C i staj čim klip prođe. Plan B i Plan C se ne prepisuju iz početka: Plan B je
napisan unapred, a Plan C je izmena nekoliko polja.

**Plan A.** Slika je **prvi frejm** klipa (poza pre radnje, predmet miruje, nema kontakta ni ishoda),
a radnju i ishod nosi animation prompt. To je i prva linija odbrane od filtera: slika bez leta,
udarca, rane ili skoka retko je ona koju Flow odbije.

**Plan B** — alternativna slika i animacija. Šta se u njemu radi:
- **Zameni reči** po rečniku iz odeljka 5, u image i u animation promptu.
- **Nova slika** kad je okidač u slici (dete, gola koža, lice na predmetu): odeća van locka, širi kadar,
  predmet bez lica, lik okrenut leđima. Slika se pravi sa `node tools/flow-images.mjs episodes/<slug>`
  (četiri kandidata po shotu, besplatno).
- **Preusmeri radnju**: umesto spornog trenutka pokaži trenutak pre ili posle, ili ga prenesi u uređaj iz
  [`visual-devices.md`](visual-devices.md) (`silhouette`, `empty-aftermath`, `macro-object`,
  `process-cutaway`). Radi kad je sama radnja okidač, a ne slika.
- **Podeli shot na dva** kad sporan trenutak mora da postoji: kratak zaseban shot (still ili klip od
  3s), ostatak klip. Menja `timing.json`, pa je poslednja opcija.

**Plan C** — still (`render_mode: still`, `still_motion: push | pull | pan-left | pan-right | hold`,
`animation_prompt: null`, `gen_len`/`motion_budget: null`, `source_file: shots/shotNN.jpeg`).
Montaža daje sporo približavanje 1.06; jedina cena je što u kadru nema pokreta. Još kadrova u
epizodi već radi tako, pa se ne primećuje. Predloži ga čim Plan B padne, bez novog prepisivanja.

Pravila koja važe za sve:
- **Reč u NOT IN FRAME nije ono što je rušilo klip.** Izmereno na hero-twins: shotovi 10, 11 i 21 su
  prošli Flow sa „blood, skull" i „severed head" u NOT IN FRAME, pa to nije okidač. Izuzetak je dete:
  decu ne imenuj ni tamo (odeljak 3.1).
- **Glava u kadru nije automatski okidač.** Shotovi 10, 11 i 24 su prošli sa „pale head" (mirna glava
  na drvetu). Pao je tek predmet sa licem u letu (23).
- **Lock se ne dira.** Odeću, dete ili predmet dodaj u image prompt van locka.
- **Ne menjaj shotove koje korisnik nije prijavio**, osim kad se piše Plan B unapred ili ispravlja
  početni frejm shotova koji još nemaju klip.
- **Posle izmene:** `node tools/lint.mjs episodes/<slug>` pa `node tools/render.mjs episodes/<slug>`.

## 3. Kategorije

### 3.1 Maloletnici — potvrđeno (greek-gods-part-4, nov 2026)

Okidač: dete ili beba kao glavna figura u izvornoj slici, naročito u opasnosti. Sama reč u promptu
nije okidač (shot 06 sa „baby" i „child" prošao je neizmenjen).

| Pokušaj | Ishod |
|---|---|
| prepisan animation prompt bez „newborn / blanket / swaddling" (shot 05) | nije pomoglo |
| ime boga umesto „boy / kid" (shot 07) | nije pomoglo |
| **nova slika bez deteta**: samo odrasla figura, bela tkanina (veo) već pada, beba se nigde ne vidi (05) | prošlo |
| **still** sa starom slikom, `pan-right` (07) | prošlo |

Alternative po redosledu:
1. Still sa postojećom slikom (Plan C). Najjeftinije.
2. Nova slika: odrasla figura + predmet koji označava dete (veo, zavežljaj, silueta u senci, samo ruke
   koje prihvataju).
3. Starost izvan kadra: dete se čuje ili se vidi njegova senka na zidu, nikad lice ili telo.
4. Mit iz kog je dete izbačeno: pokaži posledicu (prazna kolevka, ostavljen predmet) kao
   `empty-aftermath`.

Ne imenuj decu ni u NOT IN FRAME.

### 3.2 Seksualni sadržaj — potvrđeno (hero-twins, 14. nov 2026)

Okidač: mnogo gole kože veliko u kadru (likovi u natkolenici, kadar seče na butinama). Shot 18 i 16
su pali, 12 i 14 sa istim likovima nisu, pa okidač nije sam lik nego razmer.

Alternative:
1. **Odeća van locka** u image promptu: kratak beli pamučni ogrtač vezan na vratu, platno do kolena
   ispod hip yoke-a. Lock ostaje doslovan.
2. **Širi kadar**: LS umesto MS „cropped at the thigh"; likovi mali i okrenuti leđima prošli su na
   shotu 16.
3. **Krevet**: pokrivač do ramena, vide se samo glave, nikad golo telo (odluka 1. nov 2026,
   `docs/series/greek-gods.md` §4.7).
4. **Silueta** (`silhouette`) za intimne scene, uz upozorenje da je `animation_risk` visok i
   da kamera mora biti zaključana.
5. **Still** (Plan C).
6. Kod novih epizoda: odeću upiši u lock čim se lock piše, pa se problem ne pojavi.

### 3.3 Nasilje, krv, telo — hipoteza

Moguće okidače: rane i krv u prvom planu, odsečeni ili odvojeni delovi tela, mučenje, leš, kostur
„u radnji". Ova kategorija nije bila potvrđena u epizodama; antikythera test je prethodno odbacio
„leš na suđenju" kao rizik.

Alternative:
1. **Prikaži posledicu, ne radnju**: prazno mesto, tamna mrlja, razbijen predmet, dim (`empty-aftermath`).
2. **Silueta ili senka na zidu** umesto samog čina.
3. **Odvrati kameru**: kadar na lice posmatrača, na oružje koje pada, na ruku koja se zatvara.
4. **Zameni telesni deo predmetom**: ono što je „glava" postaje kamen, plod, disk, lopta bez lica
   (vidi 3.7).
5. **Boje bez krvi**: crvena svetlost, crveni veo, crvena tkanina umesto tečnosti.
6. **Still** (Plan C) sa postojećom slikom.

### 3.4 Samopovređivanje i opasna radnja — hipoteza (hero-twins shot 26)

Radnja „dvojica se zagrle i skoče u plamen" čita se kao samopovređivanje ili samospaljivanje, čak i
kad je mit. Slika (blizanci mirni na ivici jame) možda ne bi pala sama, nego tek uz zahtev da uđu u
vatru. Nije potvrđeno: korisnik je pretpostavio vatru, poruka nije navedena.

**Shot 26 je u Planu B** (hero-twins, 15. nov 2026): blizanci mali, s leđa, u belim ogrtačima staju
na ivicu jame i hodaju ka njoj, a bela užarena svetlost preplavi kadar; skok pokriva narracija. Plan C
je still.

Alternative:
1. **Zaustavi pre čina** (Plan B): animation prompt traje do trenutka pred korak. Npr. „the twins press
   their foreheads together and breathe once, the fire roars higher behind them, the lords heave more
   logs, sparks stream past", bez „step / leap / into the flames".
2. **Bela svetlost** umesto ulaska: blizanci hodaju ka jami, bela užarena svetlost preplavi kadar.
   Primenjeno u 26. Ako i to padne, pređi na 3 ili na Plan C.
3. **Prelom na posledicu**: sledeći kadar je pepeo koji se talasa, dim i žar ili prazna ivica
   jame (`empty-aftermath`).
4. **Silueta**: obe figure kao crne siluete ispred plamena, bez lica; `animation_risk` visok.
5. **Zameni vatru** drugim elementom koji priča isti mit: žar na kamenu, užarena rešetka, reka
   svetlosti, ako priča to dopušta. Mitski registar se ne sme urušiti (vidi memoriju
   „Mitski registar"), pa ovo samo kad ništa drugo ne radi.
6. **Still** (Plan C): slika na kojoj blizanci stoje na ivici, sa `push`.

Ista logika važi za kadrove sa vešanjem, davljenjem, trovanjem, skokom sa litice i ostalim
opasnim radnjama koje se mogu čitati kao instrukcija ili podstrek.

### 3.5 Stvarne osobe — hipoteza

Prepoznatljivo lice žive ili javne ličnosti. Epizode su istorijske i mitske, pa je ovo retko, ali
ime moderne ličnosti u promptu ili „as portrayed by" jeste okidač.

Alternative: opis bez imena (godine, odeća, držanje); stilizacija lika koja ne liči na fotografiju;
profil ili leđa; silueta; still.

### 3.6 Zaštićeni likovi i brendovi — hipoteza

Ime filma, igre, lika iz crtaća, logotipa ili brenda u promptu. Mitovi i istorija su van toga, ali
poređenje „like Pixar / like Disney" u STYLE liniji jeste rizik. Style string je zaključan u
[`style-string.md`](style-string.md), pa ga ne treba dirati; ova kategorija se pojavljuje samo kad
neko dopiše poređenje u scenu.

Alternative: ukloni poređenje, opiši zahtevani izgled opštim rečima, vrati se na style string.

### 3.7 Predmet koji liči na nešto sporno — uzrok pretpostavljen (hero-twins shot 23)

Shot 23 prikazuje „blede okrugle glave" kojom lordovi igraju loptu. Na slici predmet u letu ima lice
sa zatvorenim očima, što se čita kao odsečena glava. Animation prompt je prepisan dvaput: prvo bez
„strikes with his hip" (glava i dalje u promptu), zatim bez reči „head" (samo „the pale round
object"), i oba puta je pao. Zato je uzrok slika, ne prompt. Poređenje: shotovi 10, 11 i 24 sa mirnom
„pale head" su prošli, pa glava sama nije okidač, nego glava kao predmet u radnji, sa licem.

**Plan B (aktivan):** predmet je glatka bela tikva veličine dinje, bez lica (u mitu je u igri i bila
tikva), u ruci vodećeg lorda a ne u letu; animation kaže „the pale round ball"; Xbalanque je u
belom ogrtaču. **Plan C:** still.

Druge alternative:
1. **Predmet izvan kadra**: kadar na lordove koji gledaju u luk iznad ivice kadra, loptu vidi samo
   senka ili odjek na podu.
2. **Silueta**: lopta kao bela tačka u letu, bez detalja.
3. **Macro-object**: kadar samo na lopti koja se odbija o kamen (bez lica) uz zvuk; lordovi tek u
   sledećem shotu.

## 4. Kad poruke nema

Kad korisnik kaže samo „ne radi", radi ovim redom:

1. Proveri šta je u izvornoj slici: dete, gola koža, glava ili telesni deo, krv, vatra oko lika,
   prepoznatljivo lice.
2. Ako je prepoznatljivo nešto od toga, popravi to (odeljak 3).
3. Ako nije ništa od toga, a prompt ima glagole radnje koji se mogu čitati kao nasilje ili
   samopovređivanje (strikes, kicks, leaps into, stabs, drowns), prepiši ih u glagole kretanja
   (walks, turns, lifts, drifts).
4. Ako ni to ne pomogne: Plan B (nova slika + animacija), pa Plan C (still). Ne pokušavaj treći prepis.

## 5. Rečnik zamena

Zamene za **animation prompt** (reči) i za **image prompt** (ono što se vidi). Alat
`node tools/flow-risk.mjs` ispisuje istu zamenu uz svaki nalaz.

| Sporno | Pokušaj | Napomena |
|---|---|---|
| strikes, kicks, hits, knocks | sails, bounces, arcs, passes | opis putanje predmeta umesto udarca |
| leaps into the flames | stands at the lip of the pit, steps back, the fire roars higher | zaustavi pre čina |
| head (odvojena) | the pale round object, a pale ball | ne pomaže ako slika ima lice |
| blood, wound, gore | dark stain, torn cloth, red light | ili izostavi |
| naked, bare chest | wears a short white cotton cloak | menja se u image promptu |
| baby, newborn, child | a bundle of white cloth, a veil | ne pomaže ako slika ima dete |
| dies, drowns, burns | falls silent, sinks from sight, the light goes out | posledica umesto čina |
| screams, writhes | cries out, recoils | blaži glagol |
| kills, stabs, slays | raises the blade, turns away | prekini pre udarca |
| collapses, crumples, dies in dust | is swept up in spirals of dust and carried out of sight | ostaju prazni ukrasi za glavu |
| lies flat under a cloth | crouches under the cloth like a small tent; or stands behind it like a curtain | telo koje leži čita se kao leš |
| ball in flight (image) | ball drawn back at the hip, held in both hands | početni frejm |
| the house is already burning (image) | a lit torch in the dancer's hand, the house whole | početni frejm |
| twins embrace (image) | twins hand in hand, small, seen from behind, in white cotton capes | intima + gola koža |

## 6. Evidencija slučajeva

| Epizoda | Shot | Poruka | Uzrok | Rešenje |
|---|---|---|---|---|
| greek-gods-part-4 | 05 | minors | beba u opasnosti u slici | nova slika bez bebe (veo) |
| greek-gods-part-4 | 07 | minors | dečak u slici | still `pan-right` |
| greek-gods-part-4 | 10 | — | reči o sputavanju u promptu | prepisan prompt |
| hero-twins | 16 | (nepoznata, kasnije sexual) | gola koža velika u kadru | nova slika, mali likovi s leđa |
| hero-twins | 18 | sexual | blizanci u natkolenici veliki u kadru | odeća u image promptu, LS |
| hero-twins | 23 | nepoznata | predmet sa licem čita se kao glava (pretpostavka) | Plan B: bela tikva bez lica u ruci; Plan C still `push` |
| hero-twins | 26 | nepoznata | skok u vatru čita se kao samopovređivanje, gola koža velika u kadru (pretpostavka) | Plan B: blizanci mali, s leđa, u ogrtačima, staju pred jamom; Plan C still `push` |
| hero-twins | 29 | — | lik leži pod platnom kao telo (pretpostavka, nije probano) | Plan A: čuči pod platnom; Plan B: zavesa (`alternatives.md`) |
| hero-twins | 30 | — | blizanci „udaraju", gospodari „padaju" (pretpostavka, nije probano) | Plan A: spremni sa otvorenim šakama; Plan B: vrtlog prašine (`alternatives.md`) |
| el-dorado | 13 | sexual | zlatom premazan lik pun u kadru, spreda, bez ijednog komada odeće u promptu (shotovi 10 i 12 sa `a plain cloth at his hips`, MS, prošli) | Plan B: lik mali, tri četvrtine, bela tkanina od struka do ispod kolena, zlatni pektoral, mangal sa dimom ispred; Plan C still `pull` (`alternatives.md`) |

Dodaj red čim novi shot padne, i popuni „poruku" kad je korisnik navede.
