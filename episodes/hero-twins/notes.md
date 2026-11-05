# hero-twins — beleške produkcije

## Narracija i alignment

`narration.mp3` **248.607s** (4:08), 58 rečenica, `small.en`, 95.2% tokena poklopljeno. Devet rečenica ispod
0.85 (S04, S06, S18, S20, S29, S39, S46, S57, S58), većina na imenima ili kratkim rečenicama. **S57 je
interpolirana** (whisper je nije čuo, `confidence` 0.00): to je outro rečenica „If you like old stories…".
Silencedetect je pokazao da govor počinje na 241.23s, a `timing.json` je stavlja na 240.40s, pa end kartica
(B36) kreće ~0.8s u tišini posle „A ball, a river and a long way down". Rez je bezopasan, tišinu pokriva end
kartica. `outro_start` 236.78s (S56). Skripta je zamrznuta.

Početke beatova sam proverio `silencedetect`-om. Odstupanja >0.12s su na rečenicama koje teku bez pauze (S27,
S33, S38) ili su pomenute interpolirane (S57); ostalo je u granicama 0.12–0.23s.

Jedan rez unutar rečenice: **S52** se deli na 217.292s, pred „twins". Zato shot 33 počinje krupnim planom
naslikanih blizanaca na vazi, a tek onda se kamera povlači do naučnika i rukopisa.

## Režim: mešovit

**36 beatova · 37 shotova · prosek 6.72s · 32 klipa + 5 slika (86% / 14%).** Klipovi po dužini generisanja: 6s
×11, 8s ×11, 10s ×10. Nijedan klip od 4s.

| Slika | Zašto |
|---|---|
| 15 dva štapa, levo suva a desno zelena (hold) | dijagonalni „pre/posle" je za klip uređaj sa visokim rizikom; kao slika je sigurna |
| 17 red gospodara viče jedan za drugim (push) | beat od 3.4s, uvod u kadar sa imenima |
| 34 polica: ostaci oca, bakljа sa perjem, dva štapa (pan-right) | držana tvrdnja, pan prati čitanje s leva na desno kao tri rečenice |
| 36 lopta sama na terenu (pull) | beat od 3.6s, tiha završna tvrdnja |
| 37 end kartica (hold) | uvek slika, `endcard_file: shots/shot37.jpeg` |

Klipovi koji su na ivici i prvo se proveravaju na slici: **13** (jastreb, zmija, žaba i vaš kao ugnježdeni
presek: ako slika ne drži četiri životinje, ne ide u klip), **04** (presek zemlje, igra gore i dvorana dole),
**21** (džinovski slepi miš, bez sečenja glave u kadru), **22** (roj životinja i kornjača), **27** (podvodni
prelaz iz reke u dno), **28** (kuća gori pa je opet cela) i **30** (dvojica glavnih gospodara se rasipaju u
prašinu). Ako slika ne drži broj (dva štapa, po jedna baklja i cigar, četiri životinje), ne ide u klip.

Nijedan `link_group`.

## Osa ekrana (zaključana pre pisanja promptova)

> **Braća (Hun Hunahpu i Vucub, blizanci, mlada žena) drže levu polovinu ekrana i gledaju/kreću se udesno.
> Gospodari Xibalbe drže desnu polovinu i gledaju/kreću se ulevo. Silazak ide dole i udesno, put gore je
> ulevo i uvis.**

- **01, 05–09:** braća levo, rupa u zemlji i reka desno; prelaz preko reke ide s leva udesno; izlazak kroz vrata
  u 09 ide udesno ka igralištu.
- **10–11:** drvo desno od mlade žene; kap pada zdesna ulevo u njen dlan.
- **14–26:** blizanci levo, gospodari desno; u 23–24 lopta ide s desna ulevo, zec iz leva udesno; u 26 blizanci
  skaču udesno u vatru.
- **27–30:** gospodari na obali desno, blizanci kao „prosjaci" levo; u 30 glavni gospodari silaze s postolja
  zdesna ulevo.
- **31:** blizanci i otac na platformi, dva svetla se dižu levo gore (sunce) i desno gore (mesec).
- **Izuzeci bez ose** (nisu deo sukoba): 02, 03 (Gvatemala 1550-ih i 1701), 13 (presek životinja), 15, 32–34
  (vaza, naučnici, polica), 36.

## Lockovi i kontinuitet

- 8 likova (`hunahpu`, `xbalanque`, `hun-hunahpu`, `vucub-hunahpu`, `xibalba-lords`, `chief-lords`,
  `young-woman`, `soothsayers`), 3 lokacije (`xibalba-hall`, `ballcourt`, `house-of-darkness`), 3 rekvizita
  (`rubber-ball`, `calabash-tree`, `twin-canes`). Jedini `scale_critical` je `chief-lords` (shot 30 nosi
  `SCALE`); `SCALE` je dodat i u 04, 07, 21, 26 i 31 jer na mitskom beatu kadar mora da radi na natprirodnoj
  razmeri.
- **Blizanci se razlikuju po licu:** Hunahpu ima crne mrlje na obrazima i jadeitnu traku, Xbalanque krzno
  jaguara na obrazima i podlakticama i tamnoplavu traku. U kadrovima 28–29 su u dronjcima, ali lock ostaje
  isti (odeća se piše po kadru).
- **Otac i stric su dva zasebna locka** (`hun-hunahpu`, `vucub-hunahpu`) jer ih skripta pominje kao „braću"
  pre blizanaca; blizanci i oni nikad nisu u istom kadru osim u 31.
- **Bez krvi i bez golog tela:** glava na drvetu je mirna i bleda (10, 11), slepi miš je senka koja prelazi
  preko cevi (21), glava u igri je gladak bledi oblik sa zatvorenim očima (23), „žrtvovanje" kao trik sa
  platnom (29), glavni gospodari se rasipaju u prašinu (30). Nijedna odrasla figura nije gola; svi su u
  majanskom ruhu.
- **Bez dece:** blizanci su mladi ljudi, a mlada žena odrasla; nijedan kadar ne prikazuje dete (Flow filter).
- **Tačnost:** klasično majansko ruho (perje, jadeit, pamuk), loptaški teren u obliku slova I sa prstenima,
  nikad aztečki ili generički „tribal" izgled. Skripta ne tvrdi da su blizanci na vazama, pa 32–33 kažu
  „mogu biti".

## Šta ostaje

1. **Flow:** 32 klipa + slike (15, 17, 34, 36) + end kartica (37). Slike prve, pa proveri brojeve: dva
   štapa (14, 15, 34), po jedna baklja i jedan cigar za svakog od dvojice (08 i 19), četiri životinje u 13
   (jastreb, zmija, žaba, jedan vaš).
2. **Pre montaže** otvori `shot37.jpeg` i potraži naslov „TWO BROTHERS BEAT THE MAYA LORDS OF DEATH AT
   THEIR OWN GAME" i SUBSCRIBE dugme.
3. **`protagonists`** u `episode.json` pre naslova: naslov već imenuje grupu („Two Brothers"); ako se
   preimenuje, ili grupno ili sve glavne (Hunahpu, Xbalanque, Hun Hunahpu), nikad jednog + deo.
4. **Publish komplet** posle montaže; **S57 je interpolirana**, pa chapteri koji se oslanjaju na nju za
   outro treba da se proveravaju po `silencedetect`-u (241.23s).
5. **Sajt:** tek pri objavi (nova regija North America; epoha Myth & Legend).
