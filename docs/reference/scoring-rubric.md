# Rubrika bodovanja ideja

**Status:** zaključano u C03. Ovo je izvor istine za *kako se ideja ocenjuje*.
**Potrošač:** `docs/ideas.md` (bodovana tabela), i svaka buduća sesija koja dodaje ideju u tu tabelu.

Rubrika postoji zbog jedne stvari: **ponovljivosti**. Ista ideja, ocenjena dva puta u razmaku
od mesec dana, mora da dobije približno isti broj. Zato svaka metrika ima **deskriptor po nivou**
— šta konkretno znači 0, 1, 2, 3, 4, 5 — a ne samo naziv i osećaj. Ako se pri ocenjivanju
kolebaš između dva nivoa, čitaš deskriptore, ne pogađaš.

---

## 0. Kako se koristi

1. Uzmi ideju iz `docs/ideas.md` (polja `Story` i `Hook`).
2. Za svaku od 10 metrika pročitaj deskriptore i izaberi **ceo broj 0–5**. Nema polovina.
3. Upiši ocene u tabelu u `docs/ideas.md`, izračunaj ukupno po formuli iz sekcije 3.
4. Dodeli pojas (sekcija 4) i `status` (sekcija 5).
5. Napiši **jednu rečenicu** obrazloženja za ukupan skor. Ne obrazlaže se svaka pojedinačna ocena —
   30 ideja × 10 metrika = 300 ocena, obrazloženja bi bila duža od svih ideja zajedno.

Ako je ideja **`done`**, i dalje se boduje (radi kalibracije i poređenja), ali **ispada iz rangiranja**
i ne može ući u listu kandidata.

---

## 1. Metrike i težine

| # | Metrika | Težina | Smer |
|---|---|---|---|
| M1 | Snaga hooka / curiosity gap | ×3 | normalan |
| M2 | Potencijal naslova + tambnejla | ×3 | normalan |
| M3 | Kompletnost luka u 5 minuta | ×2 | normalan |
| M4 | Iznenađenje / kontraintuitivni payoff | ×2 | normalan |
| M5 | Emotivni ulog | ×2 | normalan |
| M6 | Raznovrsnost vizuelnih uređaja | ×2 | normalan |
| M7 | Originalnost naspram zasićenja | ×1.5 | normalan |
| M8 | Jasnoća (koliko konteksta traži) | ×1.5 | normalan |
| M9 | Istorijska čvrstina | ×1 | normalan |
| M10 | Produkciona cena | ×1 | **invertovan** |

**Zbir težina = 3 + 3 + 2 + 2 + 2 + 2 + 1.5 + 1.5 + 1 + 1 = 19.**

> ### ⚠️ M10 je invertovana metrika
> Kod M10 **veća ocena znači jeftiniju produkciju**.
> **5 = jeftino** (1–2 lika, 1–2 lokacije, statične ili kamerno vođene scene).
> **0 = skupo** (mase, bitke, desetine likova, velike arhitektonske scene).
> Ovo je jedina metrika gde „5" ne znači „više toga". Pri unosu u tabelu proveri dvaput:
> ako si ideji o bici dao M10 = 5, pogrešio si.

---

## 2. Deskriptori po nivou

Šest nivoa za svaku od deset metrika — ukupno **60 deskriptora**.

### M1 — Snaga hooka / curiosity gap (×3)

Meri se **prva rečenica**, onako kako stoji u polju `Hook`. Ne meri se koliko je tema zanimljiva,
nego koliko je nemoguće ne čuti sledeću rečenicu.

| Ocena | Deskriptor |
|---|---|
| 0 | Hook imenuje temu bez pitanja i bez tenzije („Danas pričamo o Vizantiji"). Gledalac ne dobija razlog da ostane. |
| 1 | Postavlja pitanje, ali odgovor je već sadržan u naslovu ili je opštepoznat („Ko je bio Julije Cezar?"). Praznina koju otvara je nula. |
| 2 | Postoji tenzija, ali je apstraktna — obećava „važnost", ne konkretan događaj („Ovaj izum je promenio svet"). |
| 3 | Konkretno pitanje sa konkretnim odgovorom koji se ne zna unapred, ali je formulisano suvo i traži strpljenje. |
| 4 | Konkretna, čulna slika ili oštro pitanje koje otvara jasnu prazninu; gledalac zna *šta* ne zna. Radi bez ikakvog predznanja. |
| 5 | Jedna rečenica koja zvuči nemoguće ili apsurdno, a doslovno je tačna, i praznina je takva da je zatvara samo gledanje do kraja. Funkcioniše i kao izgovorena rečenica i kao tekst na ekranu. |

### M2 — Potencijal naslova + tambnejla (×3)

Meri se da li iz priče izlazi **jedna konkretna slika** i **kratak naslov** (≤ 60 karaktera)
koji se ne poklapaju sa svim ostalim videima u niši.

| Ocena | Deskriptor |
|---|---|
| 0 | Nema ni jedne konkretne slike — samo apstrakcija (trgovina, uprava, „društvo"). Naslov mora da bude kategorija, ne događaj. |
| 1 | Slika postoji, ali je generička ilustracija epohe (rimski vojnik, srednjovekovni grad) koja bi stajala uz bilo koji drugi video. |
| 2 | Slika je prepoznatljiva, ali se ne razlikuje od desetak postojećih tambnejla o istoj temi; naslov mora da bude dug da bi objasnio ugao. |
| 3 | Postoji jedna solidna slika i naslov ispod 60 karaktera, ali jedno od to dvoje traži kompromis. |
| 4 | Jedna nedvosmislena slika koja se čita u malom formatu, plus kratak naslov koji sam po sebi otvara pitanje. |
| 5 | Slika je toliko specifična i čudna da radi bez teksta (leš u papskoj odori na sudu, zupčanici izvučeni iz mora), a naslov je kratak i sam je hook. |

### M3 — Kompletnost luka u 5 minuta (×2)

Meri se da li priča ima **postavku, obrt i zatvaranje** unutar ~750 reči narracije,
bez sečenja na pola i bez „a šta je bilo dalje, to je druga priča".

| Ocena | Deskriptor |
|---|---|
| 0 | Tema je pregled epohe ili procesa bez početka i kraja; svako sečenje na 5 minuta je proizvoljno. |
| 1 | Priča ima početak, ali kraj zahteva još jednu celu priču; u 5 minuta staje samo uvod. |
| 2 | Luk staje, ali samo uz drastično sažimanje koje ubija sve detalje — ostaje suvo nabrajanje. |
| 3 | Luk staje uz jedno svesno žrtvovanje (jedna linija radnje se odseca), i to se primeti, ali ne boli. |
| 4 | Postavka, obrt i rasplet prirodno staju u 5 minuta; ostaje mesta za jednu digresiju ili detalj. |
| 5 | Priča je *rođena* u toj dužini — ima jasan okidač, jednu promenu i konačan ishod, i pre bi se rastegla nego što bi se cepala. |

### M4 — Iznenađenje / kontraintuitivni payoff (×2)

Meri se **isplata sredine videa**: da li se u minutu 2–4 dešava obrt koji gledalac nije mogao
da predvidi iz hooka. Hook obećava; M4 meri ima li čime da plati.

| Ocena | Deskriptor |
|---|---|
| 0 | Nema obrta. Sve što se dogodi je logičan nastavak prve rečenice; ishod se pogađa iz naslova. |
| 1 | Obrt postoji samo za nekoga bez ikakvog predznanja; opštekulturno je poznat ishod. |
| 2 | Iznenađenje je detalj u dekoru, ne u ishodu — zanimljivo, ali ne menja kako gledalac razume priču. |
| 3 | Postoji jasan obrt, ali je iskorišćen već u hooku, pa sredina videa nema šta novo da otkrije. |
| 4 | Sredina donosi ishod suprotan očekivanju (namera je bila jedna, posledica druga) i menja značenje postavke. |
| 5 | Payoff prevrće celu premisu — ono što je izgledalo kao jaka strana ispada slabost, ili žrtva ispada uzrok. Gledalac mora unazad da preračuna priču. |

### M5 — Emotivni ulog (×2)

Meri se da li postoji **neko konkretan ko nešto gubi**. Ne meri se patos, nego identifikacija.

| Ocena | Deskriptor |
|---|---|
| 0 | Nema nosioca radnje — priča je o sistemu, resursu ili procesu. Niko ništa ne rizikuje. |
| 1 | Postoje ljudi, ali samo kao statistika ili kolektiv bez imena i bez izbora. |
| 2 | Postoji imenovani akter, ali njegov ulog je apstraktan (prestiž, prihod, „uticaj"). |
| 3 | Jedan akter rizikuje nešto opipljivo, ali gledalac nema razlog da bude na njegovoj strani. |
| 4 | Jasan akter, jasan gubitak (život, telo, dete, kraljevstvo) i odluka koju je sam doneo. |
| 5 | Ulog je i lični i nepovratan, i gledalac ga oseti bez objašnjavanja — žrtvovanje dela sebe, gubitak deteta, izdaja od strane onih kojima si verovao. |

### M6 — Raznovrsnost vizuelnih uređaja (×2)

Meri koliko **različitih tipova kadra** priča prirodno traži: mape, krupni plan lica, predmet,
pejzaž, dijagram, presek, vremenski skok. Direktno gađa problem ponavljanja iste slike.

| Ocena | Deskriptor |
|---|---|
| 0 | Cela priča je jedna slika koja se ponavlja; 30 shotova bi bila 30 varijacija istog kadra. |
| 1 | Dva tipa kadra, i drugi je samo bliži plan prvog. Montaža bi se raspala na repeticiju. |
| 2 | Tri tipa kadra, ali svi u istom ambijentu i istoj skali (npr. samo enterijeri, samo bojno polje). |
| 3 | Tri do četiri jasno različita tipa kadra; dovoljno da video ne izgleda ukočeno, ali bez pravog ritma skale. |
| 4 | Pet ili više tipova kadra sa smenom skale (mapa → pejzaž → predmet → lice) koja sama nosi montažni ritam. |
| 5 | Priča prirodno traži i uređaje koji nisu ilustracija nego objašnjenje — presek mehanizma, dijagram kretanja, promena godišnjeg doba, pod vodom pa iznad — i svaki od njih ima razlog da postoji. |

### M7 — Originalnost naspram zasićenja (×1.5)

Meri koliko je **ovaj konkretan ugao** već obrađen u nišama istorije/mitologije na YouTube-u.
Ne meri koliko je tema poznata — meri koliko je *ugao* potrošen.

| Ocena | Deskriptor |
|---|---|
| 0 | Tema i ugao su standardni sadržaj kanala u niši; postoji desetine identičnih videa sa istim naslovom. |
| 1 | Tema je izuzetno zasićena, a ugao je najčešći mogući (osnovno prepričavanje najpoznatije verzije). |
| 2 | Poznata tema, blago pomeren ugao — dovoljno da se razlikuje u opisu, ali ne u tambnejlu. |
| 3 | Tema je poznata, ali ugao je konkretan i ređe korišćen; ima prostora da se razlikuje. |
| 4 | Tema je poznata samo po imenu, a sama priča se retko priča do kraja; malo direktne konkurencije. |
| 5 | Tema je van uobičajenog repertoara niše ili je ugao takav da ga praktično niko ne koristi, a i dalje je odmah razumljiva. |

### M8 — Jasnoća (koliko konteksta traži) (×1.5)

Meri **koliko sekundi objašnjavanja** treba pre nego što hook počne da radi. Manje konteksta = viša ocena.

| Ocena | Deskriptor |
|---|---|
| 0 | Bez predznanja priča je nerazumljiva; traži uvod duži od minuta (geografija, dinastije, prethodni ratovi). |
| 1 | Traži tri ili više novih imena/pojmova pre prvog obrta, i svako mora da se objasni. |
| 2 | Traži jedan blok konteksta od ~30 sekundi koji zaustavlja tempo taman kad je najgore. |
| 3 | Traži dva-tri imena koja se mogu objasniti usput, u jednoj rečenici svako. |
| 4 | Potreban kontekst staje u jednu rečenicu; sve ostalo se razume iz same radnje. |
| 5 | Nula konteksta. Premisa je razumljiva svakome na planeti iz prve rečenice, bez datuma i bez imena. |

### M9 — Istorijska čvrstina (×1)

Meri **koliko čvrsto stoji ono što tvrdimo**. Mit se ne kažnjava zato što je mit — kod mita se
meri koliko je izvor jasno određen i koliko je verzija stabilna. Kažnjava se nemogućnost da se
kaže odakle nam podatak.

| Ocena | Deskriptor |
|---|---|
| 0 | Tvrdnja se oslanja na internet-anegdotu bez izvora ili na poznato falsifikovanu priču. |
| 1 | Postoji izvor, ali je kasni, usamljen i u ozbiljnoj literaturi tretiran kao izmišljotina. |
| 2 | Jedan izvor, kasan ili pristrasan, bez potvrde; priča se u struci vodi kao legenda. |
| 3 | Osnovni događaj je prihvaćen, ali su najzanimljiviji detalji sporni ili se pripisuju tradiciji — mora se reći „prema predanju". |
| 4 | Više nezavisnih izvora ili jasan arheološki nalaz; sporne su samo brojke i motivi, ne i sam događaj. |
| 5 | Neposredan materijalni dokaz ili savremeni zapis; sve što tvrdimo može da se pokaže, a ne samo prepriča. |

### M10 — Produkciona cena (×1, **invertovano**)

Meri **koliko košta da se ovo animira** u našem pipeline-u. Podsetnik: **5 = jeftino, 0 = skupo.**
Skupo je: mnogo likova u kadru, mase, bitke, velike arhitektonske celine, i svaka scena
u kojoj konzistentnost lika mora da se drži kroz mnogo shotova.

| Ocena | Deskriptor |
|---|---|
| 0 | Bitka ili masovna scena je jezgro priče: desetine likova u kadru, formacije, konjica, gomile. Bez toga priče nema. |
| 1 | Mase su neizbežne u više scena (opsada, invazija, epidemija), plus veliki gradski setovi. |
| 2 | Mase se pojavljuju u jednoj-dve ključne scene i mogu se delimično izbeći kadriranjem, ali ne sasvim. |
| 3 | Umeren obim: 3–5 imenovanih likova, nekoliko lokacija, povremeno više figura u kadru. |
| 4 | 2–3 lika, 2–3 lokacije, nema masa; najskuplje je jedno veće okruženje (brod, pejzaž, hram). |
| 5 | 1–2 lika, 1–2 lokacije, statične ili kamerno vođene scene; predmeti i pejzaži umesto gomila. |

---

## 3. Normalizacija

```
ukupno = zbir(težina × ocena) / (zbir(težina) × 5) × 100

zbir(težina) = 19
maksimum sirovo = 19 × 5 = 95   →   formula ga skalira na 100
```

Sirovi zbir se **nikad ne upisuje kao skor**. U tabeli stoji samo normalizovan broj,
zaokružen na jednu decimalu.

### 3.1 Izračunat primer — ideja #8, „The Corpse Put on Trial"

| Metrika | Težina | Ocena | Težina × ocena |
|---|---|---|---|
| M1 snaga hooka | 3 | 5 | 15 |
| M2 naslov + tambnejl | 3 | 5 | 15 |
| M3 luk u 5 min | 2 | 5 | 10 |
| M4 iznenađenje | 2 | 5 | 10 |
| M5 emotivni ulog | 2 | 3 | 6 |
| M6 vizuelna raznovrsnost | 2 | 4 | 8 |
| M7 originalnost | 1.5 | 5 | 7.5 |
| M8 jasnoća | 1.5 | 3 | 4.5 |
| M9 istorijska čvrstina | 1 | 4 | 4 |
| M10 produkciona cena (inv.) | 1 | 5 | 5 |
| **Sirov zbir** | | | **85.0** |

```
ukupno = 85.0 / (19 × 5) × 100
       = 85.0 / 95 × 100
       = 0.894736... × 100
       = 89.47...
       → 89.5
```

**89.5 → pojas „radi odmah".**

Zašto baš ove ocene, u jednoj rečenici: leš u papskoj odori na optuženičkoj klupi je istovremeno
hook, naslov i tambnejl (M1/M2/M7 = 5), cela stvar se odigra u jednoj prostoriji sa nekoliko
likova pa je i najjeftinija za animaciju (M10 = 5), a spuštaju je samo hladan emotivni ulog
(M5 = 3) i potreba da se objasni papska politika 9. veka (M8 = 3).

---

## 4. Pojasevi

| Pojas | Raspon | Šta znači |
|---|---|---|
| **radi odmah** | ≥ 80 | Ide u produkciju bez preoblikovanja. Ugao je već tu. |
| **oštriji ugao** | 65 – 79.9 | Vredna tema, ali pre pisanja skripte mora da se nađe uži ugao — obično podizanjem M1, M4 ili M8. |
| **parkiraj** | < 65 | Ne baca se, ali se ne pipa dok se ne pojavi bolji ugao ili novi izvor. |

Granice su **uključive odozdo**: 80.0 je „radi odmah", 65.0 je „oštriji ugao", 64.9 je „parkiraj".

**Nerešeni rezultat u rangiranju** rešava se redom: viši M1 → viši M2 → viši M6 → niži redni broj ideje.

## 5. `status`

| Vrednost | Značenje |
|---|---|
| `idea` | Uneta, još nije bodovana. Nema ocene u tabeli. |
| `scored` | Bodovana po ovoj rubrici, čeka na izbor. |
| `done` | Epizoda postoji u `episodes/`. Ostaje u tabeli radi kalibracije, **ispada iz rangiranja** i ne može u listu kandidata. |
| `rejected` | Odbačena ili spojena u drugu ideju. Ostaje zapisana da se ne bi ponovo predlagala; u redu tabele se navodi u koju je ideju spojena. |

Skor sam po sebi **nikad** ne postavlja `rejected`. Nizak skor daje pojas „parkiraj", ne odbacivanje.
