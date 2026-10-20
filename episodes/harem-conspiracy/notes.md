# harem-conspiracy — beleške produkcije

## Režim: sve slike

Korisnikova odluka: epizoda je u potpunosti od still kadrova (`render_mode: "still"`), nula
kredita. Skelet je napravljen sa `beatplan.mjs --still`.

## Trajanje

Skripta: **676 reči** (639 + outro 37). Procena pre snimanja: 4:34 pri 148 wpm, 4:52 pri 139 wpm.

**Izmereno:** `narration.mp3` **273.006s** (4:33). Ni skraćivanje ni vraćanje ne treba.

## Narracija i alignment

`align.mjs` je pušten tri puta: dvaput `small.en`, jednom `medium.en`.

- **`small.en`**: poklapanje 97.2%, 7 rečenica ispod 0.85 — sve na imenima (Ramesses, Tiye,
  Pentawer, „Man E"), 0 pauza >1.5s.
- **`medium.en`**: poklapanje isto 97.2%, ali 10 rečenica ispod 0.85 i pet granica pomerenih
  za 0.3–0.8s.

Granice su proverene `silencedetect`-om nad samim mp3 (−40 dB, 0.15s). Na S27, S51, S53 i S57
početak rečenice po `small.en` pada na kraj stvarne tišine (±0.15s). `medium.en` ga stavlja
**na početak tišine**, dakle 0.5–0.9s prerano: to je ista greška koju je heavenly-horses imao
na dve granice. Ovde je obrnuto: bolji je `small.en`, pa je on zadržan (`--model small.en
--force`, rezultat identičan prvom runu). `timing.json` se ne dira ručno.

## Osa ekrana (zaključana pre pisanja promptova)

> **Kralj i njegova strana drže levu polovinu i gledaju/kreću se udesno. Zaverenici drže desnu i
> gledaju/kreću se ulevo — ka kralju.**

Podrazumevana podela iz `camera-language.md`: strana sa kojom gledalac ide je levo. Ovde je to
kralj, žrtva, i sve što radi u njegovo ime ili za istinu o njegovoj smrti.

- **Levo, gleda udesno:** Ramzes III, Ramzes IV (izabrani sin), sud i sudije u kraljevo ime,
  čuvar svitaka u arhivi, istraživači sa skenerom, mumija Ramzesa III na stolu u laboratoriji,
  pogrebna povorka.
- **Desno, gleda ulevo:** Tija, Pentaver, harem, šef odaje, peharnici, komandant vojske, poruke
  koje izlaze napolje (idu ulevo), mumija E.
- **Parada 2021** ide **udesno**, jer su to kraljevi: kočija Ramzesa III vodi desno, a kočija
  Ramzesa IV je tačno iza nje, levo.
- **Jedan namerni prelazak ose: shotovi 28–30.** Dvojica sudija pređu na desnu stranu: prvo
  stoje kao optuženi, pa na pijanci leže među zaverenicima, pa sede osramoćeni. Taj prelazak je
  informacija, ne greška: sud je bukvalno prešao na drugu stranu.

## Beat mapa

**38 beatova · 50 slika · prosek 5.46s · 18/50 u opsegu 4–6s.** Uređaji: `macro-object` ×2,
`empty-aftermath` ×2, `silhouette` ×2, `process-cutaway` ×1.

Tri reza unutar rečenica. U sve tri rečenice je duža od 9s, i rez pada na granicu dve planirane
slike:

| Rečenica | Prvi shot | Drugi shot |
|---|---|---|
| S09 | „…the chief of his chamber, royal butlers" — šef odaje i peharnici kod Tije | „harem officials, a commander of the army" — krug se širi |
| S12 | „…a magic roll that belonged to Ramesses" — arhiva, kraljev svitak | „the Third himself, and smuggled into the harem…" — šverc voštanih figura |
| S17 | „…while I am among the just kings who are" — sudije pred praznim prestolom | „before Amun-Ra, king of gods, and before Osiris…" — dvorana bogova |

Dugi kadrovi: 36 (CT, 8.8s), 37 (balzamovanje, 8.3s), 46 (dve kočije, 8.3s), 29 (pijanka, 8.0s),
40 (sanduk bez imena, 7.9s), 49 (prazan kartuš, 7.9s). Na svima ide `push`, `pull` ili `pan`, ne
`hold`.

`link_group`: samo **08–09** (`B08`), isti sastanak u istoj sobi pod istom lampom.

## Tačnost perioda — važi za svaku sliku

- **Ramzesovo doba, 20. dinastija, oko 1155. p.n.e.** Beli plisirani lan, perike, široke
  ogrlice od fajansa i zlata. Kralj nosi plavu krunu *khepresh*. Sinovi kralja nose dugu
  pletenicu sa strane (*sidelock*), kao na reljefima prinčeva u Medinet Habuu.
- **Gvožđa nema** u drevnim scenama: oružje je bronzano (srp-mač *khopesh*, koplja, štitovi od
  goveđe kože), baklje su u bronzanim držačima.
- **Harem je domaćinstvo, ne „hareem" iz orijentalističkog slikarstva.** Razboji, deca, nadzornik
  sa raboš-daskom, straža na kapiji. Nema ležaljki, golotinje ni gozbe u B05.
- **Moderne scene su moderne**: 1881 (radnici u galabijama, službenik sa fesom), 1886 (rukopis
  perom), 1890-e (frakovi, gas), 2012 (CT), 2021 (parada). Isti likovni stil, drugo doba.
- **Tekst u slici:** nigde latinica, osim jednog slova **E** na etiketi (shot 42, i ponovo na
  karti u vitrini, shot 48) i naslova i dugmeta na end kartici. Hijeratika i kartuši smeju da se
  vide kao znaci, ne kao čitljiv tekst.

## Kadrovi koji traže odluku pre promptova

- **Napad se ne prikazuje.** Rečenica „the record never says" nosi prazan hodnik u zoru
  (prevrnuta lampa, pala lepeza, otvorena vrata), bez krvi i bez tela.
- **Samoubistva se ne prikazuju.** Princ je silueta na klupi u zatvorenoj sobi (27). Šestorica u
  sudnici samo sede u ispražnjenoj dvorani (24), bez pehara: papirus ne kaže kako su umrli.
- **Odsečeni nosevi i uši** su lica uredno umotana lanom (30), bez rane.
- **CT rana** je siva kriška na monitoru, crna pukotina od grla do pršljena, sa linijom mere bez
  brojeva (36). **Horusovo oko** se umeće u već zatvoren, smolom zatamnjen rez (37).
- **Mumija koja vrišti** (41, 48) je jeziva, ne krvava: otvorena vilica, koža zategnuta preko
  kostiju, kozja koža do ramena.
- **Mitski registar** samo na 19: Amon-Ra i Oziris sede veći od pilona, kraljevi im dopiru do
  stopala, svetlo izvire iz njih. Sve ostalo je istorijski zapis.
- **End kartica (50)** je poster cele priče:
  - Ramzes III levo, Tija i Pentaver desno, po osi.
  - U sredini daleko: palata u Medinet Habuu i kolona osuđenih.
  - U prvom planu: voštane figure, kraljev svitak, sudski papirus, Horusovo oko i plava kruna.
  - Naslov „THE HAREM CONSPIRACY", ispod linija „WHAT THE RECORD NEVER SAYS", SUBSCRIBE dugme
    na sredini.

## Lockovi i kontinuitet

- 12 likova, 6 lokacija, 6 rekvizita u `episode.json`.
- `scale_critical`: `wax-figures` (dug kao prst) i `eye-of-horus` (veličine vrha prsta). Svaki
  shot sa njima nosi `SCALE`.
- **Živi Ramzes III** (`ramesses-iii`, sa krunom) i **njegova mumija** (`ramesses-iii-mummy`, sa
  lanenom kragnom) su dva entiteta. Mrtvo telo na stolu za balzamovanje (37) nema lock, jer bi
  živi lock uneo krunu.
- **Ramzes IV** je zaključan bez pokrivala za glavu. Krunu dobija po kadru: na prestolu u 16,
  krunisanje u 39.
- **Pentaver** (živ) i **Unknown Man E** (mumija) su namerno dva entiteta. Isti su samo kao
  „mogući kandidat", pa slika ne sme da tvrdi da je to isto lice.
- Sanduk bez imena (`plain-coffin`) ide doslovno u 40, 42 i 47. Etiketa sa slovom E je u 42.
