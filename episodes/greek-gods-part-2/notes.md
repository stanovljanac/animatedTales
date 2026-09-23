# greek-gods-part-2 — beleške produkcije

## Narracija i alignment

`narration.mp3` **278.49s** (4:38). `align.mjs` (small.en): 59 rečenica, poklapanje 99.3% tokena,
6 pauza >1.5s (sve su prelazi pasusa i tri „full beat" pauze pre jednorečeničnih otvaranja
sestara), 3 rečenice ispod 0.85 — S51 (0.839), S53 (0.79, „It is lived in theirs") i S34 (0.811);
vremena su izmerena, ne interpolirana. `outro_start` 248.86 (S54).

## Režim: mešovit, pretežno animacija

**43 beata · 46 shotova · prosek 6.05s · plan 31 klip · 15 slika.**

Režim shota bira se vizuelno: pokret nosi informaciju → `clip`; kadar je držana tvrdnja → `still`.

| Slika | Zašto |
|---|---|
| 02 Kron odozdo | kratka tvrdnja (3.2s) pre dugog preseka; pokret bi ponovio Part 1 S03 |
| 04 pećina na Kritu, 07 prazan šlem | prazna posledica / citat Part 1 |
| 14 tri svetilišta, 16 udovica | tvrdnje koje se čitaju, ne dešavaju |
| 19 Zevs i Had | dogovor dve ruke — ruke dve osobe ruše klip |
| 22 Had i Persefona na tronu | mirna činjenica posle Heliosovog klipa |
| 25 hladan oltar, 27 Demetra odbija | odsustvo i odbijanje; pokret bi razvodnio |
| 32 Demetra i Persefona | zagrljaj dve osobe — rizik za animaciju, a kadar je vrh emocije |
| 34 darovi prosaca | makro, dva predmeta |
| 40 rt Tenar | kadar je o odsustvu — tri carstva bez ijednog živog bića |
| 43 tri sestre s leđa, 45 triptih, 46 end kartica | grupni kadar / makro / uvek slika |

Klipovi po dužini generisanja: 4s ×3, 6s ×9, 8s ×13, 10s ×6.

## Izmene posle reviewa (pre promptova)

| Beat | Izmena | Zašto |
|---|---|---|
| B41 | Zevs sam, šaka na slepoočnici, svetlo se skuplja **iza** čela; izvor se ne vidi, ništa ne izlazi | „pukotina duž čela" može da ispadne kao rana; rođenje Atine pripada Part 3 (biblija §7) i tamo mora da bude jači kadar |
| B37 | presek kosmosa → **rt Tenar**: olujno nebo, more i ulaz u podzemlje u steni | `process-cutaway` bi bio ×3 (R3), a B37 četvrti „dijagram kosmosa" posle B05 i B27 |
| B23, B36 | bogovi s leđa / u kontrasvetlu, lica se ne vide | Atina, Apolon, Artemida, Hefest, Afrodita i Ares dobijaju lockove u Part 3–4 |
| B10 | Hera na levoj ivici, stoji nad usnulim Zevsom i pokazuje na oluju | naracija kaže da ga je *ona* uspavala |
| B40 | tri sestre **s leđa** na pragu ljudske kuće | end kartica (B43) je tri sestre spreda — odgovor na end kartu Part 1 sa trojicom braće |

## Lockovi po kadrovima

- `the-sea` je izbačen iz `episode.json`: kolonistički brod (38) je luka u sumrak, a lock opisuje
  bistru vodu kroz koju se vidi pesak — protivrečio bi kadru.
- `olympus` ide kao SUBJECT 2 u 33, 39 i 44 (Hestijino ognjište, kočije, teaser), da Olimp izgleda
  isto kao u Part 1. `the-underworld` ide u 22 kao treći lock.
- `hermes` se pojavljuje samo u 29, kao treći lock (Persefona, Had, Hermes) — P1 335 reči.
- 29 je jedini klip sa tri locka; seme nar-a je jedan predmet, jedan akter (njena šaka), jer sitni
  predmeti i ruke više osoba ruše klip.

## Osa ekrana (zaključana pre pisanja promptova)

> **Sestre drže levu polovinu ekrana. Braća drže desnu.**

- **Levo, gleda i kreće se udesno:** Hera, Demetra, Hestija, tri sestre zajedno, Persefona,
  petoro progutanih i Zevs kao dečak/oslobodilac u rekapu (isto kao Part 1: deca levo).
- **Desno, gleda i kreće se ulevo:** Zevs (odrasli kralj), Had, Kron, Helios, Hermes, bogovi sa
  darovima. Sve što dolazi po sestru ili od kralja ulazi sa desne ivice.

Rekap čuva osu Part 1 (Kron desno, deca levo). U Part 1 je Zevs bio na levoj strani jer je bio
dete protiv oca; ovde je kralj protiv sestara, pa prelazi na desnu stranu. Taj prelaz se dešava
**između** rekapa i Herine priče (B08) i nije rez unutar scene, pa se ne čita kao greška.

**Namernog prelaska ose unutar scene nema.** Obrt u B25/B29 (kralj popušta) nosi se pozom — Zevs
spušta munju i glavu — a ne zamenom strana.

## Ostale odluke

**Apolon se ne vidi.** Part 3 ga zaključava; ako bi se ovde nacrtao iz glave, Part 3 bi imao dva
Apolona. S43 se nosi amblemima — Posejdonov trozubac (registar) i zlatna lira na Hestijinom kamenu.

**Hermes i Helios su lokalni lockovi.** Nijedan nije u mapi serije (Part 5 nije planiran).

**`the-three-sisters` je lokalni grupni lock**, kompresija tri pojedinačna iz registra, sa istim
tokenima: zlatna kruna u belom i tamnocrvenom / žitna kosa u oker i smeđem / potpuno pokrivena u
nebojenoj vuni i sivom. Koristi se u B01, B40.

**Rekap unutar Krona (B02) koristi `the-five-siblings`, ne sestre sa simbolima** — kao u Part 1,
unutar oca su bogovi pre svojih simbola. Svetle samo tri žene, redom odozdo: Hestija, Demetra, Hera.

**B05 i B27 su ista bronzana ploča.** Svet podeljen na tri dela (B05) i godina podeljena na tri dela
(B27) — Hadova trećina sveta mu donosi i trećinu Persefonine godine. Vizuelna rima je namerna.

**B21 i B28 su isti kadar polja** (`the-fields`, zaključana kamera) — glad i povratak žita.

**Rez unutar rečenice S20** pada između „Hera" i „the Wife" (90.04s): prvi shot su tri svetilišta u
nizu, drugi Hera koja ide kući. Tekst preko reza ne smeta slici.

**Kompozicija za Shorts / compilation portret:** Hera — 16 (udovica), Demetra — 23 (Eleusina),
Hestija — 33 (ognjište). Sva tri centralno-bezbedna.
