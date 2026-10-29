# greek-gods-part-3 — beleške produkcije

## Narracija i alignment

`narration.mp3` **288.84s** (4:49). `align.mjs` (small.en): 60 rečenica, poklapanje 98.2% tokena,
2 pauze >1.5s (S27 1.54s i S31 1.62s, obe su prelazi pasusa), 3 rečenice ispod 0.85 — S14 (0.713),
S18 (0.748) i S27 (0.811). Sve tri su pravopis whispera („leaped/armor", „Maitis", „Leta"), a
granice su izmerene, ne interpolirane. `outro_start` 258.68 (S54). Tempo izgovora ~157 wpm
(757 reči).

## Režim: mešovit, pretežno animacija

**50 beatova · 50 shotova · prosek 5.78s · plan 30 klipova · 20 slika.**

Režim shota bira se vizuelno: pokret nosi informaciju → `clip`; kadar je držana tvrdnja → `still`.

| Slika | Zašto |
|---|---|
| 03 Metida sa peharom | portret i tiha tvrdnja („najmudrija"); pehar je callback, ne radnja |
| 05 Zevs i žena od oblaka iste visine | „jednaka njemu" je poređenje, ne događaj |
| 08 Kron sa kamenom u povoju | citat Part 1, 3.6s |
| 15 Metida u Zevsovim grudima | refleksivno, posle burnog rođenja |
| 16 Atina i Posejdon na steni | sukob pre poteza — pokret čuva shot 17 |
| 27 Hera drži boginju porođaja | držanje je sama tvrdnja; „hold" u liku, ne u kameri |
| 32 devojčica pridržava Leto | ruke dve osobe ruše klip |
| 34 Leto pred zatvorenom kapijom | kratak eho (3.9s) |
| 35 porodilja i srebrna Artemida | kratka tvrdnja (3.6s), dve osobe na dva plana |
| 38 kamen u Delfima, 39 Apolon i kamen | predmet i čuvar — makro i mirni kadar |
| 40 heraldov dekret na Delosu | istorijski registar, gomila |
| 42 trojka s leđa, 43 Atina sa ključem, 44 blizanci na obali | rekapitulacija pred kraj |
| 45 prazan presto, 46 Zevs sa sjajem u grudima | odsustvo i završna slika |
| 47 dva kralja u istoj pozi | dijagram-poređenje |
| 49 maslina, lira, luk | makro, pitanje za komentare |
| 50 end kartica | uvek slika |

Klipovi po dužini generisanja: 4s ×3 (11, 26, 33), 6s ×13, 8s ×11, 10s ×3 (19, 20, 29).

**Pokret slika:** push je podrazumevan, ali je razbijen tamo gde bi se nizao — `hold` na 16, 42,
46 i 50, `pull` na 39 i 47, `pan-left` na 35 i 40 i `pan-right` na 44. Svaki prati
`SCREEN DIRECTION` svog kadra.

## Osa ekrana (zaključana pre pisanja promptova)

> **Rođenja drže levu polovinu ekrana. Oni koji pokušavaju da ih spreče drže desnu.**

- **Levo, gleda i kreće se udesno:** Metida, Atina (od rođenja nadalje), Leto, Apolon, Artemida,
  novorođenče, devojčica Artemida, porodilja u 35, nerođeni sin u viziji (06) i njegov prazan
  presto (45), trojka.
- **Desno, gleda i kreće se ulevo:** Zevs kao kralj koji guta, Kron, Hera, Posejdon, Zemlja i Nebo
  (06: oblak-sin nad Zevsom je levo, Zevs dole desno), atinski glasnik sa dekretom (40), vrata
  odaje munje (19, 43).

**Prelaz Zevsa sa leve na desnu stranu** dešava se između B01 i B02, kao u Part 2: B01 je citat
Part 1 i čuva osu Part 1 (Zevs levo nad Kronom desno), a od B02 Zevs je kralj koji guta i stoji
desno. Rez je između dve scene, ne unutar scene.

**Hera prelazi stranu između epizoda:** u Part 2 je bila sestra (levo), u Part 3 je progoniteljka
(desno). To je druga epizoda i druga uloga, ne rez.

**Namerni prelazak ose — jedan, shot 41.** Čamac sa trudnicom ide ka levoj ivici, dakle u
„otpor", dalje od Delosa koji stoji desno. Kretanje ulevo je ovde sama poenta: ostrvo koje je
jedino primilo porođaj sada ga tera od sebe.

## Lockovi

- **Iz registra, doslovno:** `zeus`, `hera`, `poseidon`, `cronus`, `olympus`, `the-sea`,
  `thunderbolt`, `trident`.
- **Iz ranijih partova, doslovno:** `helios` (Part 2), `the-stone` (Part 1). Oba su sada u dve
  epizode, pa su upisana u registar serije (`docs/series/greek-gods.md` §4.6).
- **Novi, za registar:** `athena`, `apollo`, `artemis` — koriste ih Part 3, end kartice i
  compilation.
- **Lokalni za Part 3:** `the-three-children` (grupni, kompresija tri pojedinačna sa istim
  tokenima: zlatni šlem zabačen i egida preko maslinastozelenog / zlatokosi bez brade u belom i
  zlatu sa lovorom / kestenjasta lovkinja u kratkom šafran hitonu), `metis`, `leto`, `eileithyia`,
  `iris`, `thunderbolt-key`, `acropolis`, `delos`, `delphi`.
- **Deca nisu zaključana** (biblija §4.2): novorođeni Apolon (30) i devojčica Artemida (32) su
  opisani slobodno u `ACTION`, bez `apollo`/`artemis` u `characters`.
- `the-war-plain` nije u `episode.json`: u 01 je ravnica opisana slobodno, jer su tri locka
  potrošena na Zevsa, Krona i munju.
- Tri locka nose 01, 02, 06, 07, 12, 15, 16, 17, 18, 19, 27, 43, 44 i 50.

## Ostale odluke

**Hefest se ne vidi i ne imenuje** (biblija §7). Sekira u 11 nema nosioca — samo podlaktica
odsečena na laktu. U 12 i na end kartici `NOT IN FRAME` isključuje kovača i nosioca sekire.
Mreža u 48 je najava Part 4 kroz predmet: kovački alat na podu, bez lica.

**Metidin pehar (03) je isti bronzani kylix** koji Zevs drži u Part 1, shot 08. Narracija ne
kaže da je Metida spravila napitak; kadar to samo tiho pokazuje, po Apolodoru 1.2.1.

**B09 i B15 su rima sa Part 1 B04.** Presek Kronovog torza sa petoro dece je postao presek
Zevsovog torza sa Metidom. Plavi sjaj u grudima nosi kontinuitet kroz 07, 09, 15, 46 i 47.

**Kamen iz Part 1 u Delfima (38, 39)** je po Hesiodu (*Teogonija* 497–500), a ulje i nepredena
vuna po Pausaniji (10.24.6).

**„Devet lakata" (28) i „devet dana i devet noći" (26)** stoje u promptu kao brojevi, po pravilu
preciznosti.

**R5 — 11 image promptova sa 348–358 reči** (22, 33, 34, 35, 37, 40, 41, 45, 46, 48, 49) ostaje
tik ispod mekog cilja, namerno: to su makro kadrovi, mape i kadrovi sa jednim subjektom, a šablon
kaže da se takav kadar ne razvlači.

**Kompozicija za Shorts / compilation portret:** Atina — 14 (vreteno i koplje), Apolon — 31
(lira na zlatnom Delosu), Artemida — 33 (trk sa jelenom). Sva tri su centralno-bezbedna.

**End kartica (50)** sledi §6.1 biblije: trojka preko kadra (Atina levo, Apolon u sredini,
Artemida desno), naslov u tri reda `THE THREE CHILDREN` / `WHO WERE NEVER SUPPOSED TO BE BORN` /
`WISDOM · PROPHECY · THE HUNT`, a oko svakog boga sitne scene njegove priče iz ovog parta.
