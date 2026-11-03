# greek-gods-part-4 — beleške produkcije

## Narracija i alignment

`narration.mp3` **256.21s** (4:16). `align.mjs` (small.en): 58 rečenica, poklapanje 99.1% tokena
(653/659), 1 pauza >1.5s (S40, 1.64s — predah posle Hermesove replike, pred smehom), 2 rečenice
ispod 0.85 — S25 (0.797) i S44 (0.799), obe kratke („Hephaestus went to his forge.", „Only
Poseidon did not laugh."), granice izmerene. `outro_start` 228.22 (S53). Tempo izgovora ~154 wpm
(659 reči).

## Režim: mešovit

**44 beata · 45 shotova · prosek 5.69s · plan 27 klipova · 18 slika.** Dva klipa (01 i 02) su
kopije iz Part 3 i ne generišu se, pa u Flow-u ostaje **25 klipova**. `shotlist.mjs` ih ipak
broji (27), pa su stvarni troškovi 2 klipa niži od zaglavlja čeklite.

Režim shota bira se vizuelno: pokret nosi informaciju → `clip`; kadar je držana tvrdnja → `still`.

| Slika | Zašto |
|---|---|
| 04 Hera sa novorođenčetom, prazan presto | portret i tiha tvrdnja; „bez Zevsa" je prazan presto |
| 08 Hefest kod nakovnja | portret odluke („took his revenge") |
| 09 zlatni presto stiže | predmet kao dar, bez radnje |
| 14 Afrodita | portret („most beautiful") |
| 15 slepi pesnik | istorijski registar, gozba |
| 16 Ares | portret |
| 25 Hefest se okreće na putu | kratak (2.5s) |
| 27 hrom Hefest na vratima | refleksivan; njegova rana je cela poenta |
| 28 Zevs i darovi | dijagram odnosa (veliki/mali) |
| 29 boginja zatvara kapke | kratak (2.9s), tiha tvrdnja |
| 32 Hermes se cereka | komični portret |
| 35 Posejdon se ne smeje | kratak (2.7s), tiha tvrdnja |
| 39 kaciga, pojas i troje dece | makro |
| 41 Hefest otvara ruke | refleksivan zaključak |
| 42 prazan krevet i mreža | posledica kroz odsustvo |
| 43 dvanaest prestola | najava compilationa |
| 44 čekić, pojas, kaciga | pitanje za komentare |
| 45 end kartica | uvek slika |

Klipovi po dužini generisanja: 4s ×8 (02, 03, 06, 11, 21, 22, 23, 38), 6s ×7 (05, 10, 24, 30,
31, 33, 37), 8s ×5 (01, 07, 18, 26, 36), 10s ×7 (12, 13, 17, 19, 20, 34, 40).

**Pokret slika:** push je podrazumevan, razbijen tamo gde bi se nizao — `pan-right` na 09,
`pan-left` na 15 i 28, `pull` na 41 i 43, `hold` na 44 i 45. Svaki prati `SCREEN DIRECTION` svog
kadra.

## Osa ekrana (zaključana pre pisanja promptova)

> **Hefest drži levu polovinu ekrana i gleda udesno. Oni koji ga odbacuju ili hvataju drže desnu.**

- **Levo, gleda i kreće se udesno:** Hefest (od kovačnice do vrata), dve morske boginje i dečak u
  pećini (07), bog vina koji ga vodi uz planinu (12), zlatne sluškinje sa presto-nosiljkom (09).
- **Desno, gleda i kreće se ulevo:** Hera (03, 04, 05, 10), Zevs (17, 28), Afrodita (14, 24),
  Ares (16, 17, 18, 23), Hermes, Apolon i Posejdon kao publika (30–36), boginja na kapcima (29).
- **Krevet i mreža u sredini**, glave ljubavnika okrenute ulevo, ka vratima. Hefest je uvek levo od
  kreveta, publika desno od njega.

Recap kadrovi iz Part 3 već prate istu osu: Atina levo i gleda udesno, Zevs na prestolu desno
(shot 01); Hera desno i gleda ulevo (shot 02).

**Svesna odstupanja, svako u jednom kadru, nijedno nije prelazak ose:**

- **11** — Hefest je okrenut leđima ka vratima iz kojih ga mole, pa mu pogled ide ulevo. Položaj je
  isti (levo), okreće se samo glava: odbijanje je poenta kadra.
- **25** — Hefest se vraća kući ka levoj ivici. Kuća stoji levo od njega kao u 22, pa vraćanje
  *jeste* kretanje ulevo (i početak 26, kad trči uz stepenice ka vratima). Jedino mesto gde se
  on kreće ulevo, i to zato što se vraća.
- **41** — lanci koje pušta lebde udesno. Nije lik nego svetlo; „pustiti" je odlazak od njega.

Ares i Afroditin odlazak (S47–S48) je prikazan mapom (38), pa osa ne važi za njega: linije
odlaze udesno, kao na svakoj mapi čitanoj sleva nadesno.

## Rekap (S01–S02): kopija, ne generisanje

Rekap je jedna rečenica Part 3 plus kadar Here iz Part 3, a oba kadra već postoje:

- **01 ← greek-gods-part-3 shot 12** (`shot12.mp4`, 5.97s, Atina iskače iz glave), kopirano u
  `shots/part01.mp4`, prozor 0.0–6.167s. Izvor je **0.197s kraći** od prozora; kratak rep je
  odobren u `freeze_tail: ["01"]` u `episode.json` (zamrznut poslednji frejm u pauzi pre S02).
- **02 ← greek-gods-part-3 shot 20** (`shot20.mp4`, 9.96s, Hera na Olimpu), kopirano u
  `shots/part02.mp4`, prozor 0.0–3.416s.

`image_prompt`, `characters` i `visual_priority` su prepisani iz Part 3 shotova 12 i 20.
`gen_len` u `storyboard.json` je 8 (01) i 4 (02) jer ga linter (T4) izvodi iz `use_len`; stvarni
klipovi su generisani na 6s i 10s, a prorezi u animation promptu su iz Part 3. Nijedan od ova dva
shota se ne šalje u Flow.

## Lockovi

- **Iz registra, doslovno:** `zeus`, `hera`, `athena`, `poseidon`, `apollo`, `helios`, `olympus`,
  `the-sea`.
- **Novi, u registru (biblija §4.7):** `hephaestus`, `aphrodite`, `ares` — nose ih end kartica,
  compilation i svaki kasniji kadar u kome se pojave.
- **Lokalni za Part 4:** `hermes`, `the-sea-goddesses` (Tetida i Eurinoma, bez imena u skripti),
  `sea-cave`, `the-forge`, `the-bedchamber`, `the-net`, `the-golden-throne`.
- **Nisu zaključani:** dečak Hefest u pećini (07), novorođenče (04, 05), bog vina (12), džinovi
  (18), slepi pesnik (15), boginja na kapcima (29), publika u 33 i 34. Afrodita u 34 i 37 je bez
  locka (lice sakriveno, vidi se samo kosa), jer treći lock pripada Aresu i mreži.
- **Tri locka nose** 01, 17, 21, 24, 30, 31, 34, 36, 37, 40 i 45. **Bez locka:** 15, 29, 38, 39.
- `thunderbolt` i `the-cyclopes` iz biblije nisu potrebni: Part 4 ih ne pominje.

## Krevet pod pokrivačem (odluka korisnika, biblija §4.7)

Krevet sa ljudima u njemu imaju 24, 31, 33, 34, 36 i 37 (u 26, 27 i 32 je u dubini, kao zrak
mreže nad njim). U svakom Afrodita i Ares leže pod teškim vunenim pokrivačem navučenim do
ramena, vide im se samo glave, a mreža pada preko pokrivača. U 42 je krevet prazan. Nijedan kadar ne pokazuje golo telo. `SUBJECT` blok nosi doslovan lock (sa
kirasom i hitonom) i odmah iza njega rečenicu da su ispod pokrivača — ako generator ipak nacrta
kirasu, kadar se vraća u prompt, ne u montažu.

## Ostale odluke

**Hrom, ne ružan.** Lock Hefesta ima „thin crooked left foot turned inward"; u 05 se kriva noga
vidi kao jedini razlog bacanja. Izvor: *Ilijada* 18, *Himna Apolonu* (biblija §4.7).

**Mreža je predmet, ne kostur.** U 24, 34, 36 i 37 nosi je lock `the-net`. Ceo kadar 20 je
njena izrada (`process-cutaway`): žica kroz bronzani vučni lim, sve tanja, pa lanci.

**Zlatne sluškinje** (13) nisu zaseban lock: nalaze se u lock tekstu `the-forge`, pa ih nose
kadrovi koji lock kovačnice navode (08, 11, 13). Kadrovi 20 i 40 opisuju kovačnicu slobodno, bez
sluškinja.

**Devet godina u pećini (07)** je `timeline-seasons` sa zaključanom kamerom: isti pogled, gomila
nakita na polici raste, vatra se gasi i potpaljuje, zeleno svetlo talasa ide po tavanici. Dečak
se ne menja po veličini (rizik od scene change-a).

**Mapa (38)** je `animated-map` bez natpisa: crvena linija do Trakije, bisernobela do Kipra.
Samo ikonice — jedan crvenoperi kočijaš i jedna čamac-školjka.

**„Fear, Panic and Harmony" (39)** su tri brončane figurice između kacige i pojasa, ne
personifikacije — zadržava se na predmetima da bi se izbeglo izmišljanje izgleda boginje i
božanskih sinova. `macro-object`.

**Dvanaest prestola (43)** je kružni savet bez figura: svaki presto nosi amblem svog boga
(munja, trozubac, crni šlem, kruna, klas, plamen, šlem sa sovom, lira, luk, čekić, pojas, koplje).
Nijedan lock nije potreban, pa kadar ne može da razjedini izgled bogova između partova.

**R5 — `image_prompt` ispod 360 reči: nema.** Svi su ≥ 360. Animation promptovi su svi unutar
150–210, `P2` ni jednom nije blizu 220.

**Kompozicija za Shorts / compilation portret:** Hefest — 41 (levo-centralno) ili 08, Afrodita —
14 (desno-centralno), Ares — 16 (desno-centralno).

**End kartica (45)** sledi §6.1 biblije: trojka preko kadra (Hefest levo, Afrodita u sredini —
između muža i ljubavnika — Ares desno), naslov u tri reda `THE SMITH, HIS WIFE AND HIS BROTHER` /
`AND THE NET THAT CAUGHT THEM` / `FORGE · LOVE · WAR`, a oko svakog sitne scene njegove priče:
Hefest — bačen s Olimpa i zlatni presto; Afrodita — zlatna mreža nad krevetom; Ares — bronzani
ćup. Simboli uz donju ivicu: nakovanj i čekić, pojas, kaciga i klupko sitnog lanca.
