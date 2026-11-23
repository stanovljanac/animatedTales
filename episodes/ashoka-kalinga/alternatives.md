# ashoka-kalinga — alternative za Flow

Redosled pokušaja za svaki rizičan shot ([`docs/reference/flow-filter.md`](../../docs/reference/flow-filter.md)):

1. **Plan A** — original (početni frejm, radnja kako je priča traži).
2. **Plan B** — alternativna animacija (i slika, ako je okidač u slici), sa zamenjenim rečima i preusmerenom radnjom.
3. **Plan C** — still sa slikom koja je prošla, bez Flow klipa.

Aktivan plan je onaj koji stoji u `storyboard.json`. Kad padne, sledeći se prekopira odavde, pa se pokrene
`node tools/lint.mjs episodes/ashoka-kalinga` i `node tools/render.mjs episodes/ashoka-kalinga`. Plan C ne traži nove
promptove, samo izmenu polja (`render_mode: still`, `still_motion`, `source_file: shots/shotNN.jpeg`).

`node tools/flow-risk.mjs episodes/ashoka-kalinga` ne javlja nijedan signal. Okidač je ovde sadržaj, ne reč: razdvajanje
para pod stražom, kolona raseljenih i sukob naoružanih grupa.

| Shot | Rizik | Plan A | Plan B | Plan C |
|---|---|---|---|---|
| 09 | kolona raseljenih ljudi sa dimom spaljenih sela | **aktivan** (figure sitne, bez lica) | ispod (prazan put, kolona sama bez dima, samo prašina) | still `pan-right` |
| 15 | muškarac i žena razdvojeni, dva vojnika između | **aktivan** | ispod (dve figure na raskršću, bez vojnika, jedna uz stub, druga odlazi) | still `push` |
| 24 | oficir sa vojnicima i šumski ljudi sa lukovima | **aktivan** (lukovi spušteni) | ispod (bez lukova: šumski ljudi sa praznim rukama i korpama) | still `push` |

Nijedan shot nije probao Flow, pa su sve „pretpostavka". Ako klip padne, traži tačnu poruku koju je Flow ispisao pre nego što
pređeš na Plan B (`flow-filter.md` §1).

---

## Shot 09 — kolona raseljenih

**Plan A (aktivan).** Dugačka kolona sitnih figura u belim i indigo omotima, sa zavežljajima na glavama, ide crvenim putem
od kamere; tri stuba dima na horizontu.

**Plan B.** Iz slike i prompta izbaci dim spaljenih sela i krupne figure uz donju ivicu; ostaje kolona od leđa u daljini i
prašina. Animacija: kolona hoda, prašina se diže. **Plan C.** Still `pan-right` iste slike.

## Shot 15 — razdvojeni par

**Plan A (aktivan).** Muškarac i žena gledaju jedno ka drugom dok između njih stoje dva vojnika.

**Plan B.** Menja se slika: bez vojnika, put se račva, jedna figura hoda levo, druga desno, obe se osvrću, a između njih na
raskršću stoji kameni putokaz. Animacija: razdvajanje bez dodira. **Plan C.** Still `push` iste slike.

## Shot 24 — šuma i lukovi

**Plan A (aktivan).** Oficir sa podignutom rukom i četiri kopljanika; šumski ljudi sa spuštenim lukovima.

**Plan B.** Šumski ljudi drže korpe i vezove pera umesto lukova; oficir i vojnici stoje uspravno, koplja uz telo. Animacija:
isti dijalog gestovima. **Plan C.** Still `push` iste slike.
