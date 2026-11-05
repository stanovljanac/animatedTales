# el-dorado — beleške produkcije

## Narracija i alignment

`narration.mp3` **244.271s** (4:04), 54 rečenice, `small.en`, 97.0% tokena poklopljeno. Osam rečenica ispod
0.85 (S03, S06, S07, S19, S24, S25, S31, S33), sve kratke ili sa imenima; nijedna nije interpolirana. `outro_start`
232.02s (S52). Skripta je zamrznuta, nijedna rečenica nije menjana.

Početke beatova sam proverio `silencedetect`-om nad mp3-om (kraj tišine = početak rečenice). Svi su unutar 0.25s
osim dva, oba bezopasna: **B13 (S18)** — S17 i S18 teku bez pauze, a najbliža tišina je unutar S18; **B24 (S36)** —
između S35 i S36 ima pauza od 0.6s, pa se slika pećine u Pasci menja pola sekunde pre „A clue turned up in a
cave", usred pauze.

Jedan rez unutar rečenice: **S38** se deli na 168.5s, pred „ten smaller figures", što je granica reči iz
`timing.json`. Shot 25 je ceo zlatni splav, shot 26 prsten od deset figura.

## Režim: mešovit

**37 beatova · 38 shotova · prosek 6.43s · 32 klipa + 6 slika (84% / 16%).** Režim je biran iz kadra, ne iz
kredita. Klipovi po dužini generisanja: 6s ×12, 8s ×12, 10s ×8. Nijedan klip od 4s.

| Slika | Zašto |
|---|---|
| 04 mladi naslednik u pećini (push) | beat od 3.7s, uvod u post; sliku nosi izolacija |
| 08 obala puna ljudi odozgo (pull) | zbirni kadar, hiljade sitnih figura nemaju šta da pokreću |
| 14 zlato tone kroz vodu (push) | beat od 3.6s, držana tvrdnja „dar, ne blago" |
| 35 rukavica grabi zlato iz blata (push) | beat od 4.0s, makro lakomosti |
| 36 jedna figurica tone (pull) | beat od 3.7s, tiha završna tvrdnja |
| 38 end kartica (hold) | uvek slika, `endcard_file: shots/shot38.jpeg` |

Klipovi koji su na ivici i prvo se proveravaju na slici: **09** (oblak zlatne prašine, dodir ruku), **12**
(naslednik baca zlato, četiri poglavice bacaju jedan za drugim: ako slika ne drži četiri, ne ide u klip),
**15** (pijaca i pan do potoka), **19** (mapa na kojoj se crtaju linije), **22** (oko dvanaest radnika i
brana od vode), **25/26** (zlatni splav, makro; 26 mora da pokaže deset figura), **27** (presek kalupa) i **33**
(sveštenik pada ničice). Ako slika ne drži broj (četiri poglavice, četiri kamina, tri konjanika, deset
figura), ne ide u klip.

Nijedan `link_group`: svi beatovi imaju po jedan shot, rez je svuda tvrd.

## Osa ekrana (zaključana pre pisanja promptova)

> **Muisca (naslednik, poglavice, gomila, sveštenik, stari don Juan) drže levu polovinu ekrana i gledaju/kreću
> se udesno. Lovci (konkvistadori, Belalcázar, Raleigh, Sepúlveda, Freyle u lovu) drže desnu polovinu i
> gledaju/kreću se ulevo, ka jezeru i zlatu.**

- **01–13 (ceremonija):** naslednik levo, splav iz leve obale ka sredini jezera; poglavice dve levo, dve desno
  od njega, svi gledaju ka sredini jezera udesno; gomila sa obale levo i okolo.
- **16–18 (Quito i visoravan):** Muisca trgovac levo, Španci desno; Belalcázar desno pokazuje ulevo; tri
  jahača ulaze zdesna, idu ulevo.
- **20–23 (lov):** Raleigh desno, brod ide ulevo uz reku; ostaci ekspedicije desno, jezero levo (kamera klizi
  ulevo); Sepúlveda desno gleda ulevo ka useku; voda ide kroz usek udesno; pan udesno ka grobu (23).
- **31–34 (Teusacá):** jezero je uvek levo; Freyle i sveštenik penju se ulevo; u 34 Freyle silazi udesno
  i osvrće se ulevo.
- **Izuzeci bez ose** (nisu deo sukoba): 02 i 30 (Freyle za stolom), 03 (stari don Juan), 04–06 (post), 14, 19,
  21, 24–28, 35–37 (predmeti, mape, jezero).

## Lockovi i kontinuitet

- 10 likova (`muisca-heir`, `old-don-juan`, `muisca-chiefs`, `muisca-crowd`, `freyle`, `belalcazar`,
  `conquistadors`, `raleigh`, `sepulveda`, `muisca-priest`), 4 lokacije (`guatavita-lake`, `heir-cave`,
  `freyle-study`, `teusaca-lake`), 3 rekvizita (`reed-raft`, `gold-raft`, `offering-heap`). Nijedan
  `scale_critical`.
- **Pozlaćeni naslednik nikad nije gol u kadru.** Lock nosi samo lice, kosu i građu; zlatna prašina i platno
  oko bokova pišu se po kadru (01, 09, 10, 12, 13, 38). Prikazuje se sa leđa ili u profilu, iz daljine ili u
  dimu, nikad sprijeda.
- **Freyle je jedan lock od oko pedeset godina** i za pisanje 1636. i za lov na Teusacá; godine se ne
  razlikuju u kadru.
- **Broj četiri** (poglavice, kamini) stoji u lockovima i u promptu svakog kadra gde se pojavljuju (07, 10,
  12, 38). **Deset i jedan** (zlatni splav) stoji u lock-u i u 25, 26, 27, 38.
- **Tačnost perioda:** Muisca nisu Inke ni Asteci; nema kamenog grada ni piramide. Visoki andski páramo
  (hladno, magla, frailejón), splav od trske, perje, zlatne krune. Španci 1530-ih u moriónu i kirasu, Raleigh u
  elizabetanskoj odeći. Freyle ne pominje ronjenje u jezero ni udavljenu suprugu, pa se to ne crta.
  Nijedan Španac nije video ceremoniju: nijedan kadar ceremonije nema Špance (29 je „duh" splava u magli).

## Šta ostaje

1. **Flow:** 32 klipa + slike (04, 08, 14, 35, 36) + end kartica (38). Slike prve (0 kredita), pa proveri
   brojeve pre klipova.
2. **Pre montaže** otvori `shot38.jpeg` i potraži naslov „EL DORADO WAS NEVER A CITY. / IT WAS A MAN ON A
   RAFT" i SUBSCRIBE dugme.
3. **`protagonists`** u `episode.json` se upisuje pre naslova (`docs/publish.md`): naslov ili ne imenuje nikog
   (El Dorado je legenda) ili imenuje sve glavne (Freyle, Belalcázar, Raleigh, Sepúlveda), nikad jednog + deo.
4. **Publish komplet** (`publish.md`, `subtitles.srt`) se piše posle montaže; chapteri idu iz `timing.json`.
5. **Sajt:** tek pri objavi, sa pravom sličicom, trajanjem i YouTube ID-jem (nova regija South America).
