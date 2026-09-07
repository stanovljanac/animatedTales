# tyr-and-fenrir — beleške suvog hoda

Epizoda **1 od 3** potrebnih za kalibraciju kvota (C13 → C14 → C15). Kvote se mere, ne nameću —
sve ispod su izmerene vrednosti, ne ciljevi.

## C13 — alignment + beat plan (2026-09-06)

### Alignment

| Podatak | Vrednost |
|---|---|
| model | `small.en` |
| trajanje whisper run-a | 43.5s |
| trajanje narracije | 200.438s |
| rečenica / reči | 50 / 464 |
| poklapanje tokena | 98.7% |
| interpolirane rečenice | **0** (svako vreme izmereno, nijedno pogođeno) |
| gapovi > 1.5s | 2 — posle S07 (1.700s) i S43 (1.540s) |
| rečenice ispod `confidence 0.85` | 3 — S15 (0.743), S31 (0.666), S39 (0.831) |
| `outro_start` | 182.060s |

Rerun sa `medium.en` **nije** pokrenut: 3/50 ispod praga je 6% i sve tri su kratke linije sa
vlastitim imenima, a poklapanje tokena je 98.7%. Oba gapa su dramske pauze, ne greške rendera.

### Beat plan

| Podatak | Vrednost |
|---|---|
| beatova / shotova | 18 / 27 |
| beatova ručno prepravljenih na checkpointu | **0** (plan odobren iz prve) |
| trajanje beata | min 6.18s · prosek 11.14s · max 18.38s |
| shotova po beatu | 1 shot ×9 · 2 shota ×9 · 3 shota ×0 |

### Distribucija `use_len` — prvi stvarni podatak o splitteru

| Opseg | Shotova | Udeo |
|---|---|---|
| 3–5s | 2 | 7% |
| 5–7s | 9 | 33% |
| **7–9s (ciljni)** | **11** | **41%** |
| 9–10s | 5 | 19% |

prosek 7.424s · medijana 7.541s · min 3.708s · max 9.584s

Ciljni opseg hvata 41% shotova. Rano je za zaključak sa jedne epizode, ali smer je vidljiv:
gubitak je uglavnom nadole (40% ispod 7s), i to na beatovima od ~6–7s koji daju jedan kratak
shot jer ih deljenje na dva probija `minShot`.

### Uređaji

| Uređaj | Beatova |
|---|---|
| `null` (doslovno) | 7 |
| `macro-object` | 3 |
| `silhouette` | 2 |
| `timeline-seasons` | 2 |
| `empty-aftermath` | 2 |
| `process-cutaway` | 1 |
| `ledger-accumulation` | 1 |

11 od 18 beatova nosi uređaj. Konkretni su svi u srednjem delu (B10–B14, sam čin vezivanja) —
tamo se radnja vidi doslovno i uređaj bi je samo zaklonio.

### Upozorenja splittera — 4

| Kod | Gde | Napomena |
|---|---|---|
| `intra-sentence-cut` | B02 @ 16.833s (S05) | rečenica traje 13.1s |
| `intra-sentence-cut` | B09 @ 92.042s (S22) | rečenica traje 12.2s |
| `intra-sentence-cut` | B18 @ 191.375s (S49) | rečenica traje 7.1s |
| `tail-absorbed` | B18 @ 199.96s | 0.478s repa pripojeno poslednjem shotu |

Sva tri reza unutar rečenice su neizbežna i benigna: rečenice su duže nego što jedan shot sme
da bude, pa nijedna podela po granicama rečenica ne staje u 3–10s. Sva tri padaju na **granicu
reči** — nijedan `blind-cut`, dakle nijedna tačka reza nije pogođena.

### Verifikacija C13

| Uslov | Rezultat |
|---|---|
| `timing.json` postoji, zbir ≈ trajanje narracije ±0.3s | ✓ |
| nijedan gap > 1.5s | ✗ 2 gapa (1.700s, 1.540s) — dramske pauze, ne greška |
| beat plan odobren od korisnika | ✓ |
| `sum(use_len)` = trajanje narracije ±0.2s (T1) | ✓ 200.458s vs 200.438s, drift 0.020s |
| svaki `use_len` u [3.0, 10.0] | ✓ 3.708–9.584 |
| udeo u ciljnom opsegu 7–9s zabeležen | ✓ 41% |
| `outro_start` postavljen | ✓ 182.060s |
| broj upozorenja zabeležen | ✓ 4 |

`lint.mjs --no-media` nad skeletom: **211 BLOCKING**, svi T3/S2/P1/P2 — dakle prazni promptovi
i ništa drugo. Nijedan nalaz iz vremenskog sloja (T1/T2), što je i poenta: skelet je vidljivo
nedovršen, ali matematika tajmlajna već drži.

## Odstupanja i odluke iz ove sesije

**1. Rep narracije — zatvorena otvorena stavka iz C04.** `planTimeline` je apsorbovao tišinu na
početku tajmlajna, a na kraju nije; ova epizoda je prva koja je na to naletela (0.478s repa, T1
bi pao). Rešeno simetrično: poslednji beat se sada završava na `timing.duration`. Puna odluka je
u `schemas.md` §5.12, promena je u `tools/timeline.mjs`.

**2. `script.md` je stigao bez `## OUTRO` naslova**, pa je `outro_start` bio `null` i end card
ne bi imao odakle da krene. Naslov je umetnut ispred poslednjeg pasusa, pošto je dokazano da je
tekstualno neutralan: `parseScript()` vraća istih 50 rečenica sa identičnim tekstom i `id`-jevima
pre i posle, menja se samo `outro_start` (`null` → 182.060s). Narracija i `timing.json` nisu
dirani. **Za sledeću epizodu: `## OUTRO` mora da stigne u isporuci** (C13, preduslovi).

**3. `research.md` nije isporučen.** Deset `locked_description`-a u `episode.json` izvedeno je iz
skripte i nordijske tradicije. Svi prolaze 25–40 reči po `countWords`, `id`-jevi su jedinstveni,
bez tačke na kraju — ali ih vredi pročitati pre C14, jer ih C14 prepisuje **doslovno** u svaki
prompt (C1).

**4. `endcard_file` još ne postoji** u folderu epizode. Nije potreban sada; obavezan pre C15.

## C14 — promptovi (2026-09-06)

27 parova promptova upisano u `storyboard.json`. `lint.mjs --no-media`: **BLOCKING 0**
(sa 211 na skeletu), ADVISORY 4 signala.

### Izmerene dužine

| Podatak | P1 (image) | P2 (animation) |
|---|---|---|
| granica | 90–160 | 60–100 |
| min · prosek · max | 138 · 154.1 · 159 | 83 · 94.6 · 99 |

Prosek sedi 6 reči ispod plafona, ne zato što je tako planirano nego zato što je to ostatak:
16 reči `STYLE` + 30–35 reči `locked_description` + pet kamera-blokova pojedu ~110 reči pre
nego što se napiše išta o radnji, svetlu i boji. **Nijedan shot nije pao ispod donje granice** —
uzak je samo plafon.

### Zaključani entiteti po shotu — tvrdo ograničenje, ne stil

| Entiteta u `characters[]` | Shotova |
|---|---|
| 0 | 4 (03, 12, 21, 22) |
| 1 | 22 |
| **2** | **1** (08) |

Prvi merljiv dokaz za računicu iz `schemas.md` §3.3: **dva zaključana opisa staju samo ako je
sve ostalo minimalno.** Shot 08 (`empty-aftermath`, dva prsnuta lanca kao jedini subjekt) je
jedini kadar u epizodi u kome to prolazi — 159 reči, jedna ispod plafona, i to zato što nema
lika, nema `FACING` složenijeg od „viđeno odozgo" i nema drugog `SETTING`-a. Svaki pokušaj da
se lik i lokacija zaključaju u istom kadru probijao je 160 za 18–25 reči.

Praktično pravilo izvedeno iz ovoga: **jedan zaključan entitet po shotu**, i to onaj koji je
subjekt kadra na veličini na kojoj mu se opis vidi.

### Pokrivenost zaključanih opisa

| Entitet | Shotova | Gde |
|---|---|---|
| `fenrir` | 5 | 05, 15, 16, 23, 24 |
| `gleipnir` | 5 | 10, 11, 13, 19, 27 |
| `dromi` | 3 | 07, 08, 26 |
| `tyr` | 2 | 18, 20 |
| `the-gods` | 2 | 14, 17 |
| `laeding` | 2 | 06, 08 |
| `binding-ground` | 2 | 01, 25 |
| `gods-hall` | 2 | 02, 04 |
| `dwarf-smiths` | 1 | 09 |
| **`dwarf-forge`** | **0** | — |

`dwarf-forge` je jedini opis iz manifesta koji nije zaključan ni u jednom shotu. Nije previd,
nego posledica ograničenja iznad. Kovačnica se vidi u tri shota (09, 10, 11), ali:

- shot 09 je jedini od njih dovoljno širok da se opis kovačnice uopšte vidi, a tu već stoji
  `dwarf-smiths` — narracija imenuje **patuljke**, ne kovačnicu („They turned to the dwarfs");
- shotovi 10 i 11 su macro/ECU na dlanu i na traci, gde `gleipnir` mora da bude zaključan, a
  „niske svodove i žile rude u zidovima" iskreno nije moguće pokazati.

Zaključati oba u shot 09 traži 66 reči opisa, što bi ostatak kadra spustilo na ~78 reči i
zahtevalo sečenje kamera-blokova — što `prompt-templates.md` izričito zabranjuje. Beat B07 je
jedna rečenica od 6.167s, pa se ne može ni rasformirati na dva shota (dobila bi se dva od
~3.08s, tik uz `minShot`). **Odluka: kovačnica se drži konzistentnom kroz `SETTING` linije, a
`dwarf-forge` ostaje nezaključan.** Ako se pri pregledu ispostavi da je kovačnica važnija od
patuljaka, zamena je jednolinijska — u shotu 09 se `dwarf-smiths` menja za `dwarf-forge`.

### `link_group` — 14 shotova u 7 lanaca

B02, B03, B08, B09, B15, B16, B18 — svuda gde su dva shota nastavak **istog kadra**
(push-in na kamen, zaključan kadar kroz godišnja doba, macro koji se približava).

Tvrd rez je namerno ostavljen u B10 i B11, jedina dva dvoshotna beata bez lanca: tamo su dva
različita kamera-postavljanja (bogovi ↔ vuk), a ne nastavak jednog.

### ADVISORY — 4 signala

- **R2** — 9 `character`, 11 `object`, 4 `group`, 2 `environment`, 1 `architecture`.
  Nula `crowd` i `map-diagram`; ovo je kamerna priča sa deset likova i tri predmeta, mapa
  nema šta da pokaže.
- **R3** — 6 uređaja, nijedan više od 3 puta; 7 beatova bez uređaja (svi u B10–B14, sam čin
  vezivanja, gde se radnja vidi doslovno).
- **R4 — 1 signal**, shot 23 ↔ 24: 14 reči. Ostaje **namerno**. To je linkovan par
  `timeline-seasons`, čija je cela poenta *jedan zaključan kadar* kroz godišnja doba —
  identična `FRAME LAYOUT` i `FACING` linija su ono što uređaj traži, ne propust.
  Prvi prolaz je imao 9 R4 signala; ostalih 8 je bilo mehaničko poklapanje
  `SCREEN DIRECTION` + `LIGHT` + `PALETTE` linija na shotovima koji nemaju veze jedan sa
  drugim, i ta su prepisana.
- **C2** — 0 multi-visual klipova, očekivano: aktuelni animation šablon nema taj oblik
  (`schemas.md` §5.6 tačka 11).

### Verifikacija C14

| Uslov | Rezultat |
|---|---|
| `lint.mjs --no-media` BLOCKING = 0 | ✓ (sa 211) |
| svih 27 `image_prompt` u 90–160 | ✓ 138–159 |
| svih 27 `animation_prompt` u 60–100 | ✓ 83–99 |
| pet kamera-blokova u svakom image promptu (S2) | ✓ |
| nijedna zabranjena prostorna fraza bez klauzule (S1) | ✓ |
| nijedna reč koja implicira rez u animation promptu (S3) | ✓ |
| `locked_description` doslovno gde je entitet naveden (C1) | ✓ |
| `link_group` = sopstveni `beat_id` ili `null` | ✓ |
| šest tag-osa popunjeno stvarnim vrednostima | ✓ |
| R1 ne javlja ni par ni eskalaciju | ✓ 0 signala |
| `render.mjs` prošao, `storyboard.md` regenerisan | ✓ |
| `shotlist.mjs` daje čeklistu za Flow | ✓ 27 shotova |

`locked_description`-i se u promptove nisu kucali rukom nego su čitani iz `episode.json` u
generatoru, pa C1 nije mogao da odluta ni na jednom shotu.

### Otvoreno posle C14

**`endcard_file` i dalje ne postoji.** Blokira C15 (`assemble.mjs`), ne blokira generisanje
klipova u Flow-u — shotlist se može odraditi bez njega.

## Pregled posle C14 i prelazak na shemu 2 (2026-09-06)

Epizoda je prepisana sa sheme 1 na **shemu 2** (`schema_version: 2`). Ugovor je u
`schemas.md` §3.3.1, šablon u `prompt-templates.md`, gustina u `style-string.md`, lista praznih
`SCREEN DIRECTION` formulacija u `camera-language.md` (lista D), osa ekrana u istom fajlu.

### Nalazi pregleda

Lista je **rekonstruisana iz artefakata**, ne prepisana: originalna numeracija iz sesije pregleda
nije bila zapisana ni u jedan fajl, pa je izgubljena kad je razgovor sažet. Numeracija ispod je
zato nova i verovatno se ne poklapa sa prvom. **Zaključak koji vredi više od same liste: nalaz
koji nije upisan u fajl ne postoji.** Otud i ovaj odeljak.

| # | Nalaz | Gde se rešava |
|---|---|---|
| A1 | Plafon P1 od 160 reči guši sadržaj — 17/27 shotova sedelo je na ≤5 reči od plafona | shema 2, plafon 280 uz meki opseg 180–260 (R5) |
| A2 | `locked_description` nosi poze i relacije, pa ih C1 doslovno ubaci u kadar koji ih poriče | `episode.json`, svih 10 opisa pregledano, 8 prepravljeno |
| A3 | Entitet je u kadru i imenovan, ali nije u `characters[]` — C1 ga ne proverava | 22 lock-mesta umesto 15; `dwarf-forge` više nije nezaključan |
| A4 | Osa ekrana se prevrće (14↔15, 18/19↔20, 05/07 vs 06) | jedna osa za epizodu, 6 shotova prepravljeno |
| A5 | PRIMARY lock potrošen na rekvizit tamo gde je vuk subjekt kadra (06, 07, 19) | `characters[0]` = vizuelni subjekt + `SCALE` blok |
| A6 | Silueta kao **uvodni** kadar, i silueta koja se sama pokreće (01, 25) | B01 više nije `silhouette`; shot 25 zaključana kamera, pokret samo ambijentalni |
| A7 | `SCREEN DIRECTION` popunjen negacijom u 8 shotova (04, 05, 10, 14, 16, 17, 23, 24) | R6; svih 8 sada imenuje najsitniji živi element |
| A8 | Ista gustina tražena i na ECU i na XLS (konstanta u `STYLE`) | `DETAIL` blok vezan za `tags.shot_size` |
| A9 | `tags.subject_type` ne opisuje kadar (01, 04, 09, 19) | 01 → environment, 04 → character, 09 → group, 19 → character |
| A10 | `dwarf-forge` nije zaključan ni u jednom shotu — posledica plafona, ne odluke | zaključan u shotu 09 uz `dwarf-smiths` |
| A11 | Nesklad prioriteta prolazi kroz ceo BLOCKING sloj neprimećen | `visual_priority` + S5 |
| A12 | `storyboard.md` je 1347 redova bez ijednog režijskog pregleda | režijska tabla u `render.mjs` |

### A2 — šta je tačno bilo u lockovima

Poza ili stanje u opisu entiteta nije stilska sitnica: C1 **zahteva** da opis stoji doslovno u
svakom kadru gde entitet učestvuje, pa poza putuje u kadrove koji je poriču.

| Entitet | Izbačeno | Zašto |
|---|---|---|
| `fenrir` | „always drawn larger than the gods around him" | relacija prema likovima koje `NOT IN FRAME` često izbacuje — sada je nosi `SCALE` |
| `laeding` | „coiled in a loose pile" | poza; shot 08 ga pokazuje prsnutog i polupotonulog u blatu |
| `dromi` | „so heavy it sags deeply and drags furrows in the ground" | poza; u shotu 07 je zategnut, a ne opušten |
| `gleipnir` | „coiled small" | poza; u shotovima 19 i 27 je razmotan i zategnut |
| `the-gods` | „carrying spears and coiled chains", „faces set and wary" | posle B06 nema više celih lanaca da se nose; izraz lica je stanje po kadru |
| `dwarf-smiths` | „working with impossibly fine thread rather than hammers" | to je radnja, i pripada `ACTION` liniji |
| `gods-hall` | „dim orange light and deep shadow" | svetlo; B03 kroz istu dvoranu vodi zelenu, sivu i snežnu svetlost |
| `tyr` | „on his right wrist" (uz `arm-ring`) | mesto rekvizita koje shot 20 doslovno odseca |
| `dwarf-forge` | „warm red firelight cutting through drifting smoke" | svetlo; shotovi 10 i 11 su na dogorelom žaru |

Svih deset opisa i dalje je u granicama 25–40 reči (30–36). `fenrir` i `gleipnir` su označeni sa
`scale_critical: true` — obojici je veličina deo identiteta, i to suprotnih znakova.

### A4 — osa ekrana

**Bogovi i Tir drže levu polovinu ekrana, Fenrir desnu, od prvog do poslednjeg kadra.** Pravilo i
obrazloženje su u `camera-language.md`; ovde stoji samo izabrana vrednost, kako je taj fajl traži.

Osa je izabrana po podrazumevanom pravilu (gledalac ide sa bogovima, pa oni drže levu stranu) i
zato što je uvodni kadar već tako postavljen: povorka se penje uz greben zdesna nalevo bi bila
otpor, a ona ide ka vuku. Prepravljeni su shotovi **06, 15, 16, 17, 18, 19** — pre toga je
epizoda imala dve ose koje su se sudarale na dva mesta, a jedno od njih je vrhunac priče
(18/19 vuk levo → 20 vuk desno, dva reza).

Nijedan **nameran** prelazak ose nije upotrebljen. Bio je razmatran za shot 20 — trenutak u kome
se odnos snage obrne — ali čeljusti se zatvaraju u istom kadru u kome Tir stoji, pa bi prelazak
pao na rez posle kojeg gledalac više ne zna ko je gde, umesto na rez koji to saopštava.

### Izmerene dužine — shema 2

| Podatak | P1 (image) | P2 (animation) |
|---|---|---|
| tvrda granica | 90–280 | 60–100 |
| meki cilj (R5) | 180–260 | — |
| min · prosek · max | 181 · 228.0 · 280 | 83 · 94.9 · 100 |

Prosek je 32 reči **ispod** plafona — na shemi 1 je bio 6 ispod. To je prva potvrda da je plafon
bio ograničenje: čim je podignut, promptovi se nisu nastavili puniti do vrha nego su se smirili
tamo gde im je sadržaj stao.

**R5 javlja 5 shotova (01, 05, 06, 07, 19), sve preko 260.** Svih pet je isti slučaj: dva locka
plus `SCALE` blok. Dva locka nose 63–71 reč, `SCALE` još 30–40, i pre nego što se napiše ijedan
kamera-blok potrošeno je oko 130 reči. To nije razvlačenje nego cena koju košta kadar sa dva
zaključana entiteta — i sada je merljiva, umesto da se, kao na shemi 1, plaća izbacivanjem
glavnog lika iz locka.

### Zaključani entiteti po shotu

| Lockova | Shotova |
|---|---|
| 0 | 5 (03, 04, 12, 21, 22) |
| 1 | 12 |
| 2 | 10 |
| 3 (`LIMITS.maxLocks`) | 0 |

Nijedan shot ne koristi treći lock. Pokušan je na shotu 07 (vuk + Drómi + bogovi) i probio je
280 za 20-ak reči — dakle granica od tri locka je i dalje teorijska, a stvarna granica su dva.
Pet shotova bez ijednog locka su kadrovi u kojima nema šta da se zaključa: rezbarija u kamenu
(03), poluodrastao vuk kome opis odraslog protivreči (04), nemoguća porekla (12) i dva kadra
posledice u kojima je jedini predmet Tirova narukvica (21, 22).

### Pokrivenost zaključanih opisa — pre i posle

| Entitet | Shema 1 | Shema 2 | Gde |
|---|---|---|---|
| `fenrir` | 5 | **9** | 01, 05, 06, 07, 15, 16, 19, 23, 24 |
| `gleipnir` | 5 | 6 | 10, 11, 13, 14, 19, 27 |
| `laeding` | 2 | 4 | 06, 08, 15, 26 |
| `dromi` | 3 | 3 | 07, 08, 26 |
| `binding-ground` | 2 | 2 | 01, 25 |
| `gods-hall` | 2 | 2 | 02, 05 |
| `the-gods` | 2 | 2 | 14, 17 |
| `tyr` | 2 | 2 | 18, 20 |
| `dwarf-smiths` | 1 | 1 | 09 |
| **`dwarf-forge`** | **0** | **1** | 09 |

Glavni lik epizode dobio je lock u 9 od 27 kadrova umesto u 5. Tri od te četiri nove pojave su
tačno oni kadrovi iz obrazloženja u `schemas.md` §3.3.1 — 06, 07 i 19 — u kojima je vuk bio
`center, near-camera and large`, a lock je odlazio na lanac.

`SCALE` blok nosi 14 shotova, `SUBJECT 2` deset.

### ADVISORY posle prelaska — 10 signala

- **R1 — 1 signal**, shotovi 18–20: tri uzastopna `character` kadra u istoj lokaciji i svetlu.
  Ostaje **namerno**. To je vrhunac (Tir ulazi → vuk se otima → Tir gubi šaku); razlika među
  njima je nošena veličinom kadra (MS → LS → CU) i uglom, a ne lokacijom — na otvorenoj steni u
  istom popodnevu nema druge lokacije ni svetla koje bi bilo istinito. Signal je tačan opis, ali
  ono što opisuje je odluka.
- **R2** — 11 `character`, 10 `object`, 3 `group`, 2 `environment`, 1 `architecture`.
  Posle ispravke `subject_type`-a (A9) miks je pomeren ka likovima, što je istinitije za priču sa
  dva imenovana lika i tri predmeta.
- **R3** — 6 uređaja; `silhouette` sada ×1 umesto ×2 (uvodni kadar više nije silueta), pa je
  8 od 18 beatova bez uređaja.
- **R4 — 1 signal**, shot 23 ↔ 24: **55** uzastopnih identičnih reči, sa 14 na shemi 1. Ostaje
  namerno i broj je porastao iz strukturnog razloga: `timeline-seasons` traži *isti kadar* kroz
  godišnja doba, a šablon sheme 2 stavlja više teksta o kadru u niz (`CAMERA`, `FRAME LAYOUT`,
  `FACING` jedno za drugim). `SCALE` i `DETAIL` su izuzeti iz R4, pa u tih 55 reči nisu ni ušli.
  Razlikuju se `ACTION`, `SETTING`, `SCREEN DIRECTION`, `LIGHT` i `PALETTE` — dakle sve što se
  kroz godišnja doba menja, i ništa što se ne sme menjati.
- **R5 — 5 signala**, obrazloženo iznad.
- **R6 — 0 signala.** Svih 8 praznih `SCREEN DIRECTION` linija je zamenjeno imenovanim pokretom;
  u zaključanim kadrovima to je najsitniji živi element (pramen dlake, para daha, meltvoda,
  oblak), pa kompozicija ostaje ista a blok prestaje da bude prazan.
- **C2** — 0 multi-visual klipova, i dalje očekivano (`schemas.md` §5.6 tačka 11).

### Verifikacija

| Uslov | Rezultat |
|---|---|
| `lint.mjs --no-media` BLOCKING = 0 na shemi 2 | ✓ |
| svih 27 `image_prompt` u 90–280 (P1) | ✓ 181–280 |
| svih 27 `animation_prompt` u 60–100 (P2) | ✓ 83–100 |
| sedam naziva blokova u svakom image promptu (S2) | ✓ |
| `SCALE` u svakom shotu sa `scale_critical` lockom (S4) | ✓ 14 shotova |
| PRIMARY lock doslovno u `SUBJECT` bloku (S5) | ✓ |
| `visual_priority` 3–5 stavki, `[0]` imenuje PRIMARY (S5) | ✓ 27/27, po 4 stavke |
| nijedan shot preko `LIMITS.maxLocks` | ✓ max 2 |
| nijedna zabranjena prostorna fraza bez klauzule (S1) | ✓ |
| nijedna reč koja implicira rez u animation promptu (S3) | ✓ |
| `locked_description` doslovno gde je entitet naveden (C1) | ✓ |
| osa ekrana ista u svih 27 kadrova | ✓ ručno, linter je ne meri |
| `node --test tests/` | ✓ 392/392 |
| `check-fixtures.mjs` | ✓ |
| `render.mjs` + `shotlist.mjs` prošli | ✓ |

Promptovi se ni ovog puta nisu kucali rukom: `locked_description`-i i kanonski style string čitani
su iz `episode.json` i `style-string.md` u generatoru, pa C1, S5 i izuzeće R4 ne mogu da odlutaju.

### Otvoreno

1. **`endcard_file` i dalje ne postoji.** Blokira C15, ne blokira generisanje klipova.
2. ~~`beatplan.mjs` piše `schema_version: 1`~~ — **zatvoreno u istoj sesiji.** Skelet sada izlazi na
   shemi 2 sa praznim `visual_priority`; `storyboard.sample.json` je preveden na shemu 2 (dodat
   `DETAIL` blok i `visual_priority`), a `check-fixtures.mjs` bira P1 opseg i listu S2 blokova po
   `schema_version`-u, isto kao linter. Ostale fixture epizode (`good-`, `bad-`, `linked-`,
   `repetitive-`) namerno ostaju na shemi 1 — one su dokaz da stara shema i dalje prolazi.
