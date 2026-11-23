# la-navidad — alternative za Flow

Redosled pokušaja za svaki rizičan shot ([`docs/reference/flow-filter.md`](../../docs/reference/flow-filter.md)):

1. **Plan A** — original (početni frejm, radnja kako je priča traži).
2. **Plan B** — alternativna animacija (i slika, ako je okidač u slici), sa zamenjenim rečima i preusmerenom radnjom.
3. **Plan C** — still sa slikom koja je prošla, bez Flow klipa.

Aktivan plan je onaj koji stoji u `storyboard.json`. Kad padne, sledeći se prekopira odavde, pa se pokrene
`node tools/lint.mjs episodes/la-navidad` i `node tools/render.mjs episodes/la-navidad`. Plan C ne traži nove promptove,
samo izmenu polja ispod (`render_mode: still`, `still_motion`, `source_file: shots/shotNN.jpeg`, `animation_prompt: null`).

`node tools/flow-risk.mjs episodes/la-navidad` ne javlja nijedan signal. Okidač je ovde sadržaj, ne reč: maloletnik
(mlad mornar), insceniran okršaj, mrtvi daleko u polju i svađa sa hvatanjem za okovratnik.

| Shot | Rizik | Plan A | Plan B | Plan C |
|---|---|---|---|---|
| 07 | mlad mornar preuzima krmilo (maloletnik: „ship's boy") | **aktivan** (vitak mornar u dvadesetim, mali u kadru) | ispod (samo krmilo, krmanoš ostavlja ruku na njemu, drugi mornar viđen samo kao ruke i leđa) | still `push` na krmilo |
| 30 | top gađa trup, dve vrste naoružanih mornara jure jedna na drugu | **aktivan** | ispod (top i dim nad olupinom, mornari u dva reda stoje u stavu mirno sa podignutim kopljima) | still `pan-left` |
| 41 | spaljeno utvrđenje, vrane, daleko tamni oblici u travi („mrtvi u polju") | **aktivan** | ispod (bez tamnih oblika: vrane i prazno izgažena trava, zgarište) | still `push` |
| 45 | svađa oko zlata, petorica se guraju | **aktivan** | ispod (petorica oko stola pokazuju prstom na zlato i viču, bez guranja i hvatanja) | still `push` |
| 46 | ruke hvataju okovratnik iznad gomile zlata | **aktivan** | ispod (ruke se otimaju za zlatnu ogrlicu, bez okovratnika) | still `push` |

Nijedan shot nije probao Flow, pa su sve „pretpostavka". Ako klip padne, traži tačnu poruku koju je Flow ispisao pre nego što
pređeš na Plan B (`flow-filter.md` §1).

---

## Shot 07 — mlad mornar na krmilu

**Plan A (aktivan).** Slika: krmanoš skida ruku sa dugačkog krmila i okreće se ka grotlu; vitak mornar (dvadesetih godina)
na desnoj trećini, mali u kadru, pruža ruku ka krmilu.

**Plan B.** Slika se menja, jer je okidač lik u izvornoj slici: ostaje samo krmilo i krmanoš.

| Plan A | Plan B | Razlog |
|---|---|---|
| mlad mornar na desnoj trećini preuzima krmilo | krmanoš skida ruku, krmilo ostaje samo sa uzdignutom ručicom; prazan prostor desno | nema mogućeg maloletnika u kadru |
| `SUBJECT`: krmanoš + vitak mornar | `SUBJECT`: krmanoš viđen otpozadi, ruka na krmilu, mesečina na planu | lock `crew` ostaje, osoba je odrasla |

Novi `ACTION`: *the helmsman, seen from behind, lifts his hand from the long tiller bar and turns toward the hatch, the bar
swaying slightly on its own.* Animacija: prorezi opisuju samo krmanoša koji odlazi ka grotlu i krmilo koje se lagano njiše.

**Plan C.** Still `push`, ista slika kao Plan B (krmilo i krmanoš otpozadi pod mesečinom).

## Shot 30 — top i okršaj

**Plan A (aktivan).** Top ispaljen, dim preko peska; dva reda naoružanih mornara jure jedan na drugog.

**Plan B.** Zamenjeno u slici i animaciji: nema juriša ni sudara.

| Plan A | Plan B | Razlog |
|---|---|---|
| „charge toward each other", „crash together", „pikes crossing and men shoving" | „two rows of armed sailors stand facing each other in drill, pikes raised and lowered together" | okršaj postaje vežba, kao što je Kolumbo i naredio „da bi poglavica video prijatelje" |
| top puca i trup puca | top ispaljen, dim se kotrlja preko olupine, drvena iverka pada | bez povrede |

**Plan C.** Still `pan-left` preko dima nad olupinom, bez ljudi.

## Shot 41 — spaljeno utvrđenje

**Plan A (aktivan).** Zgarište, vrane, daleko u travi nekoliko tamnih oblika.

**Plan B.** Iz slike i `SUBJECT` sufiksa izbaci „a few small dark shapes far off in the tall grass", ostavi vrane i izgažena
polja trave. Animacija: vrane kruže, dim se razređuje, bez oblika u polju. **Plan C.** Still `push` iste slike.

## Shot 45 — svađa oko zlata

**Plan A (aktivan).** Petorica mornara viču i guraju se oko stola sa gomilom zlata.

**Plan B.** „Grab each other's collars", „fist thumps down" → „point at the gold and shout", „lean across the table with open
palms". Gomila zlata ostaje; nema fizičkog kontakta među ljudima. **Plan C.** Still `push`: gomila zlata na stolu, prevrnuta
čaša, senke petorice u pozadini.

## Shot 46 — ruke na okovratniku

**Plan A (aktivan).** Dva para ruku stežu okovratnik iznad zlata.

**Plan B.** Ruke se otimaju za istu zlatnu ogrlicu (vuku je na dve strane), bez okovratnika; zlato se rasipa po stolu.
**Plan C.** Still `push` iste slike sa zlatom i dve ruke na ogrlici.
