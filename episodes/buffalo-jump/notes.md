# buffalo-jump — beleške produkcije

## Narracija i alignment

`narration.mp3` **361.404s** (6:01), 70 rečenica, `small.en`, 98.2% tokena poklopljeno (994/1012), nijedan gap >1.5s.
Dve rečenice ispod 0.85 (S37 0.83, S57 0.84), nijedna interpolirana. `outro_start` 350.50s (S68 „A hunt built on
patience, not force."). Skripta je zamrznuta; audio tagovi se ne izgovaraju i nisu u `timing.json`.

Pet rezova unutar rečenice, svi na granici reči iz `timing.json` (splitter ih bira jer nijedna podela po rečenicama
ne staje u 3–10s). Svaki pada na prirodnoj pauzi i svaka polovina ima svoj kadar:

| Shot | Beat | Rez | Šta se vidi levo / desno od reza |
|---|---|---|---|
| 01 / 02 | B01 @ 5.125s | „…run much faster \| than you, and have horns…" | lovac naspram stada / rog i prazna šaka („no horse, no rifle") |
| 06 / 07 | B05 @ 27.792s | „…in the nineteenth \| century, and from what Blackfoot elders…" | putnik skicira lov / starešina i arheolog |
| 19 / 20 | B17 @ 115.083s | „…in single \| file, and that the bison…" | ljudi puze u koloni / odozgo kolona liči na zmiju |
| 30 / 31 | B26 @ 185.292s | „…a hundred cows and fifty calves \| weighed about sixty thousand…" | gomila životinja ispod litice / dijagram sa 25 kamiona |
| 48 / 49 | B40 @ 295.333s | „…the trader Peter Fidler \| watched Piikani riders…" | konjanik na grebenu zimi / trgovac gleda terivanje stada |

`tail-absorbed`: 0.324s tišine posle S70 pripojeno je završnom shotu (end kartica). Normalno.

## Režim: mešovit

**48 beatova · 58 shotova · prosek 6.23s · 49 klipova + 9 slika (84% / 16%).** Klipovi po dužini generisanja: 6s ×21,
8s ×17, 10s ×11. Nijedan klip od 4s.

| Slika | Zašto |
|---|---|
| 04 trkač u vučjoj koži leži u travi (push) | beat od 3.7s, tiha tvrdnja „They persuaded it." |
| 05 prazna padina ispod litice danas (pull) | beat od 3.4s, „Nobody alive has seen a hunt", kadar je prazan po zamisli |
| 25 zbijeno stado na ivici litice (push) | držana tvrdnja „If a tight pack of two hundred does, you kill them all." (3.7s) |
| 28 prašina nad ivicom i jedna silueta u padu (hold) | „They fell." — jedna slika, bez pokreta, bez anatomije |
| 31 dijagram: 25 kamiona (5×5) i gomila životinja (push) | 25 identičnih kamiona ne sme da nosi pokret u klipu; brojka mora da se prebroji |
| 33 logor kraj izvora (pan-right) | uvodni kadar od 3.2s |
| 38 oko bizona sa odrazom litice (push) | makro od 3.3s, „aware, and remembered" |
| 47 portret starešine (push) | citat „We always just called it the buffalo jump", 3.8s |
| 58 end kartica (hold) | uvek slika, `endcard_file: shots/shot58.jpeg` |

Klipovi koji su na ivici i prvo se proveravaju na slici: **19** (šest lovaca puzi u koloni, svaki tačno u stopu
prethodnog), **22** (ljudi ustaju i mašu ogrtačima, jedna životinja se vraća u red), **24** (tanka kolona od dve stotine
bizona stiže na ivicu, nijedna ne pada), **27** (vođe koče na ivici), **29** (stoji jedan bizon, lovci u polukrugu),
**43–45** (priča o imenu: mala figura, senka ispusta, vuča ropama) i **50** (stado probija liniju, jedna životinja pada
sa litice). Plan B/C za njih je u `alternatives.md`.

Nijedan `link_group`.

## Osa ekrana (zaključana pre pisanja promptova)

> **Lov teče s leva udesno. Ljudi (lovci, trkači, ljudi iza hrpa, jahači, starešine) drže levu polovinu ekrana i
> gledaju/kreću se udesno; stado, uski kraj staze i litica drže desnu. Vetar duva s leva udesno (trava se povija ka
> desnoj ivici). Stranci (putnik, arheolog) drže desnu polovinu i gledaju ulevo.**

- **01–03:** lovac levo, stado desno; pogled udesno; prelazak kroz sezone (03) ide s leva udesno.
- **04, 09–18:** trkač puzi ka stadu udesno; vatra i dim idu udesno; krave prate pozive teladi ka ušću staze (desno).
- **08, 10, 13, 53, 56, 57:** litica i uski kraj staze su uvek desno; široko ušće levo.
- **19–28:** kolona puzi udesno; ljudi ustaju levo iza stada i mašu; stado trči udesno; vođe stižu na ivicu na desnoj
  strani kadra.
- **29–36:** ljudi prilaze gomili s leva; putnik drži desnu stranu i gleda ulevo (36, 37, 49); arheolog desno (07, 35, 46).
- **Izuzeci bez ose** (nisu deo sukoba): 05, 08 (litica sama), 12, 38 (makro bizona), 31 (dijagram), 33 (logor),
  35 (isečak tla), 54 (stari snimak na stolu), 55 (muzej).
- **Jedan namerni prelazak ose: shot 50.** Stado probija liniju hrpa i beži **ulevo**, natrag u basen, jahači se
  okreću za njim: sistem za pešake ne drži konje. Svi drugi kadrovi posle toga (51, 52, 56) opet idu udesno.
- **Shot 45** (ljudi vuku životinje od ispusta): užad vuče ulevo, ali su glave okrenute preko ramena udesno, ka ispustu.

## Lockovi i kontinuitet

- 8 likova (`buffalo-runner`, `piikani-hunters`, `hidden-people`, `bison`, `fur-trader`, `blackfoot-elder`,
  `archaeologist`, `piikani-riders`), 6 lokacija (`plains-basin`, `drive-lanes`, `jump-cliff`, `kill-camp`,
  `winter-camp`, `interpretive-centre`), 5 rekvizita (`sage-bones`, `drying-rack`, `bone-layers`, `old-print`,
  `pickup-trucks`). Nijedan `scale_critical`; blok `SCALE` stoji ručno u 01 i 35, gde je razmera poenta.
- **Odeća van locka:** trkačevu vučju kožu i telećak, kojima se menja kostim kroz epizodu, nosi `SUBJECT` tekst
  svakog shota, ne lock (lock je isti mladić u običnoj jelenskoj košulji).
- **Brojevi iz naracije stoje u promptu:** 25 kamiona u pet redova po pet (31), dve stotine bizona (24, 25), šest
  lovaca (19), pet mladića (14), osam nosilaca baklji (09), tri bizona (52), deset metara (08, 35).
- **Deca se ne crtaju.** Skripta pominje decu iza hrpa i mladića ispod litice; u slikama su svi ljudi odrasli, a
  mladić je mala figura s leđa (43), senka ispusta (44), samo užad i ispust (45). Reč „child" nije ni u jednom
  `NOT IN FRAME`.
- **Krv i anatomija:** nijedna. Crvene mrlje na litici su rđa (Brink). Gomila životinja ispod litice je tamna masa bez
  detalja (30, 31, 44, 45). „Wounded" nije u promptovima, ranjeni bizon (29) stoji, para mu ide iz nozdrva.
- **Tačnost:** pre konja i pušaka: jelenska koža i krzno, kameno koplje, tipi od kože, psi vuku travois. Hrpe su niske
  (do struka), sa granjem i busenom, ne zidovi. Konji tek od 48 (zima 1792–93). Reč „photograph" iz S64 je u slici
  „old sepia print" (54), jer „photo" je zabranjen stilski token.
- **Muzej i starešine (55):** generički starešine, ne portret Joea Crowshoea.

## Šta ostaje

1. **Flow:** `node tools/flow-images.mjs episodes/buffalo-jump` je pokrenut (58 × 4); korisnik bira i animira. Pre
   klipova proveri na slici brojke: 25 kamiona u 5×5 (31 je slika), dve stotine bizona (24), šest lovaca (19).
2. **Pre montaže** otvori `shot58.jpeg` i potraži naslov „HOW HUNTERS WITH NO HORSE AND NO GUN HERDED BISON OFF A
   CLIFF", liniju „BUILT ON PATIENCE, NOT FORCE" i SUBSCRIBE dugme.
3. **`protagonists`** u `episode.json`: glavni lik je mesto, svaki naslov imenuje „Buffalo Jump" ili „Head-Smashed-In".
4. **Publish komplet** posle montaže; S69 („If you like…") ima poverenje 0.91, S70 1.00 — nijedna nije interpolirana.
5. **Sajt:** tek pri objavi.
