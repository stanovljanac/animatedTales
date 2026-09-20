# greek-gods-part-1 — beleške produkcije

## Režim: mešovit, pretežno animacija

**33 beata · 38 shotova · 25 klipova · 13 slika · prosek 6.35s.**

Epizoda je prvo bila isečena u still kadenci (40 beatova / 43 shota, sve slike, nula kredita).
Prekrojena je u clip kadencu jer se kanal zove Animated Tales i ime obećava animaciju. Prost
prelazak režima nije radio: tri beata su padala ispod clip minimuma od 3.0s i obarala T2, a ni
posle toga se nije dobijao clip tempo. Beat mapa je zato spojena na šest mesta.

Režim shota bira se **vizuelno, nikad po ceni** (`docs/reference/google-ai-plus.md` §4):
pokret nosi informaciju → `clip`; kadar je držana tvrdnja → `still`.

| Ostaje slika | Zašto |
|---|---|
| S04 silueta | `visual-devices.md` vodi siluetu kao **visok rizik** za animaciju — ravna crna površina nema crte koje model prati; u prvoj epizodi je duplirao figuru i puštao je da iscuri iz kadra |
| S20, S25, S31 makro | jedan predmet, plitka dubina, poenta je držana tvrdnja |
| S27, S36 prazna posledica | kadar je o odsustvu; pokret bi ga razvodnio |
| S07, S18, S21, S28, S33, S37 | punch rezovi i mirne tvrdnje |
| S38 end kartica | uvek slika |

## Osa ekrana (zaključana pre pisanja promptova)

> **Nova vlast drži levu polovinu ekrana. Stara vlast drži desnu.**

- **Levo, gleda i kreće se udesno:** Reja, Zevs, šestoro dece, Kiklopi, Sturuki, vojska bogova.
- **Desno, gleda i kreće se ulevo:** Kron, Titani.

Podrazumevana podela iz `camera-language.md` — gledalac ide sa decom, pa deca drže levu polovinu,
a kretanje nadesno se čita kao napredovanje. Kron gleda ulevo u svakom kadru u kome se pojavljuje
(S02, S03, S04, S05, S08).

**Namernog prelaska ose nema.** Obrt u S08 (Zevs prisiljava oca) nosi se pozom — Kron presamićen,
Zevs uspravan — a ne zamenom strana.

## Redosled trojice braće (zaključan)

> **Zevs levo · Posejdon centar · Had desno**, u svakom kadru u kome stoje zajedno
> (S15, S18, S38).

Slaže se sa vertikalnim slaganjem preseka svemira (S16, S35): Zevs gore (nebo), Posejdon sredina
(more), Had dole (podzemlje). Idući udesno ide se i naniže — jedna dijagonala kroz celu epizodu.

Posledica za S23/S24: Zevsov glasnik dolazi sa **leve** ivice, Posejdon je desno i gleda ulevo.

## Šest spajanja beat mape i šta je svako dobilo

| Spojeno | Novo | Dobitak |
|---|---|---|
| stari B02+B03+B04 | **B02**, 15.8s, 2 shota | S03 je sad jedan neprekidan potez od ožiljaka na šakama gore do lica. Rez to ne može, klip može — jedini kadar u epizodi koji animacija stvarno otvara |
| stari B06+B07 | **B04**, 7.5s | presek dobija vremena da se pročita; širok kadar „pet tačkica svetla" je bio prepričavanje istog |
| stari B08+B09 | **B05**, 12.5s, 2 shota | 7.6/4.9 prebalansirano u 7.6/4.9 sa boljim tempom |
| stari B14+B15 | **B10**, 9.2s | kovačnica je jedan klip od 9.2s: čekići padaju, svetlo se oblikuje i staje kao gotovo oružje. Zasebni kadar „tri gotova oružja" više ne treba |
| stari B19+B20 | **B15**, 7.0s | **nov kadar**: obična zelena zemlja sa Olimpom usred nje i nijednim međašem. Jedna slika umesto dve, i tačno ono što rečenica kaže |
| stari B33+B34 | **B27**, 13.3s, 2 shota | presek zemlje sada u jednom kadru nosi i žile naniže i izdanak naviše |

## Kompozicija bezbedna za Shorts

S19 (Zevs), S22 (Posejdon) i S26 (Had) su komponovani **centralno-bezbedno**: figura u centru,
dovoljno praznog prostora levo i desno da vertikalni 9:16 izrez ne odseče telo. Besplatno pre
generisanja, skupo posle.

Kandidati za Shorts: Had (B23–B29, ~52s), Posejdon (B20–B22, ~25s), Zevs (B17–B19, ~19s).
Odluka pada posle finalnog videa.

## Ostale odluke

**B14 — tri žreba u jednom kadru, ne tri kadra.** „Poseidon drew the sea" traje 1.6s, „Hades drew
the mist and the dark" 2.3s, „Zeus drew the wide sky" 2.4s. Tri zasebna kadra bi oborila T2 i
čitala se kao treperenje. Umesto toga jedan presek u tri sprata sa drugačijim pokretom u svakom
pojasu. Sam čin izvlačenja nosi S15, gde ruka ulazi u šlem.

**B31 — nema locka za tri sestre.** Kadar ne prati narraciju doslovno: tri duge senke preko golog
olimpskog mermera, figure van kadra. Teaser za Part 2 bez trošenja locka i bez opisa koji bi Part 2
morao da poštuje.

**Lockovi skinuti sa pet kadrova** jer entitet na toj veličini nije čitljiv, a plafon od 280 reči
je stvaran: S06 (kamen je do pola umotan — njegov krupni plan je S09), S11 (Zevs je silueta na
pragu), S12 (munja je tu još meka, a lock opisuje gotov predmet), S19 (poenta beata je da oružje
nije poenta — njen kadar je S21). Nijedan `locked_description` nije skraćivan.
