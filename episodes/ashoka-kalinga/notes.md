# ashoka-kalinga — beleške produkcije

## Narracija i alignment

`narration.mp3` **332.826s** (5:33), 56 rečenica, `small.en`, 99.4% tokena poklopljeno (879/884). Dve rečenice ispod 0.85:
**S40 „Why?"** (0.26, jednorečna rečenica od 0.5s, trajanje je pouzdano) i S47 (0.83). Nijedna nije interpolirana.
`outro_start` 318.10s (S54). Skripta je zamrznuta, nijedna rečenica nije menjana. Početke beatova nisam proveravao
`silencedetect`-om (nije rađeno u ovoj sesiji).

Tri beata se dele unutar rečenice na granici reči (**B13, B23, B32**), svi su beatovi od 13–19s. Beat plan je odobren
pre upisa.

## Režim: mešovit

**37 beatova · 44 shota · prosek 7.56s · 33 klipa + 11 slika (75% / 25%).** Klipovi po dužini generisanja: 5s ×1, 7s ×7,
9s ×13, 10s ×12. Procena Omni 1.2 cene svih klipova: ~873 kredita (291 s generisanja).

| Slika | Zašto |
|---|---|
| 10 dleto i čekić uz stubce zareza (push) | beat od 4.7s, „his own figures": nijedna ruka u kadru |
| 11 Ashoka sam na grebenu u sumrak (push) | beat od 4.8s, „something changed" kao tih portret |
| 16 šaka sa crvenom zemljom (push) | makro; zrna koja padaju čitaju se i na slici |
| 17 kuhinja sa redovima kotlova (pan-right) | beat od 3.4s |
| 19 dva pauna i jedan jelen (hold) | tačan broj tri; generator ne broji |
| 31 isklesani redovi u steni, gušter (pan-left) | beat od 3.2s |
| 33 Ashoka ćuti na postolju pred starešinama (hold) | tih beat, prazna ploča uz njega |
| 36 monasi pred stupom (push) | beat od 4.0s |
| 41 lavlji kapitel u zoru (pull) | držani završni simbol |
| 43 prevaljen stub u travi (pull) | zaključna držana tvrdnja, beat od 7.2s |
| 44 end kartica (hold) | uvek slika, `endcard_file: shots/shot44.jpeg` |

Klipovi koji su na ivici i prvo se proveravaju na slici: **03** (monah piše, freska gori u svetlu lampe), **09** (kolona
raseljenih kao tekstura, bez lica), **13** (krupno lice, ruka na ustima), **15** (muškarac i žena se razilaze, dva
vojnika između), **23** (vojska odozgo, blokovi pešadije, slonovi i kola), **26–27** (mape sa pet grčkih kraljevstava
i tri južna znaka), **35** (godišnja doba nad stubom, zaključana kamera), **37** (stotine ljudi vuku stub na kolima).
Ako slika ne drži broj (pet kraljevstava u 26, tri znaka u 27, dva sina u 28, pet učenjaka u 38), ne ide u klip.

Nijedan `link_group`.

## Osa ekrana (zaključana pre pisanja promptova)

> **Ashoka i njegova strana (vojska, službenici, glasnici) drže levu polovinu ekrana i gledaju/kreću se udesno, ka
> Kalingi. Kalinga i njeni ljudi drže desnu polovinu i gledaju/kreću se ulevo. Na mapama je zapad levo i istok desno,
> pa je Kalinga na istočnoj obali desno, a grčka kraljevstva levo.**

- **01, 02, 21–24, 28, 32–33:** Ashoka i dvor levo, Kalinga/šuma/stene desno; vojska 23 maršira ulevo→udesno, glasnik 34
  jaše ulevo→udesno.
- **05–06, 26–27:** mape; vojska i putevi idu ka obali udesno (06), izaslanici ka grčkim zemljama ulevo (26).
- **Izuzeci bez ose:** 03, 04, 07–08, 10, 12–13, 16–20, 25, 29–31, 35–36, 40–43 (pojedinačni predmeti, portreti i pejzaži);
  37–39 (srednji vek i XIX vek).

## Lockovi i kontinuitet

- 11 likova (`ashoka`, `mason`, `courtiers`, `soldiers`, `kalingans`, `forest-people`, `monks`, `princes`, `firuz`, `brahmin`,
  `prinsep`), 5 lokacija (`pataliputra-hall`, `pataliputra-chamber`, `kalinga-rock`, `royal-kitchen`, `mauryan-road`),
  3 rekvizita (`edict-rock`, `edict-pillar`, `lion-capital`). Nijedan `scale_critical`. Lokacije stoje doslovno na početku
  `SETTING` linije (osim u 17, 18, 20, 30, 32, 42 gde su u `characters[]`).
- **Tačnost perioda (III v. p.n.e.):** drvene i cigla palate, stubovi i stene sa uklesanim redovima **Brahmi** pisma kao
  sitne crte, nikad čitljiva slova, ni latinična ni devanagari. Pešadija u pamuku i kožnim prslucima, ratni slonovi i kola.
  Stupa se javlja samo u 36 (kasniji vek, posle Ashoke). 37–38 su XIV vek (Firuz Šah, zelene zastave, sandstone Delhi), 39 je
  Kalkuta 1830-ih (Prinsep, rubovi mastila).
- **Ashoka kao čovek srednjih godina:** ni svetac ni zlikovac; belo ruho sa crvenim ramenim platnom i zlatnim nakitom, bez
  golog trupa. Bez krvi i leševa: posledice rata su kolona raseljenih (09), dimovi na horizontu i prazna ravnica u magli (07).
- **Bez dece** u kadru; sinovi u 28 su odrasli (princes, dvadesetih godina).
- **Brojevi iz narracije u promptu:** pet grčkih kraljevstava i tri tamilska znaka na mapama (26–27), dva pauna i jedan
  jelen (19), dva sina (28), pet učenjaka (38).
- **Ime u natpisima:** u 34 (S50–S51) nema ničega što imenuje Ashoku; skripta kaže da sebe zove „Beloved of the Gods".

## Šta ostaje

1. **Flow:** 33 klipa + slike (10, 11, 16, 17, 19, 31, 33, 36, 41, 43) + end kartica (44). Slike prve, pa proveri brojeve.
2. **Pre montaže** otvori `shot44.jpeg` i potraži naslov „THE EMPEROR WHO WON A WAR AND CARVED HIS REGRET IN STONE" i SUBSCRIBE
   dugme.
3. **Plan B / C** za 09, 15, 24 su u [`alternatives.md`](alternatives.md).
4. **Publish komplet** i sajt (region India, epoha Ancient World) tek posle montaže.
