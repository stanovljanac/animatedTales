# emu-war — alternative za Flow

Redosled pokušaja za svaki rizičan shot ([`docs/reference/flow-filter.md`](../../docs/reference/flow-filter.md)):

1. **Plan A** — original (početni frejm, radnja kako je priča traži).
2. **Plan B** — alternativna animacija (i slika, ako je okidač u slici), sa zamenjenim rečima i preusmerenom radnjom.
3. **Plan C** — still sa slikom koja je prošla, bez Flow klipa.

Aktivan plan je onaj koji stoji u `storyboard.json`. Kad padne, sledeći se prekopira odavde (ili iz
`node tools/shotlist.mjs episodes/emu-war --only NN`), pa se pokrene `node tools/lint.mjs episodes/emu-war` i
`node tools/render.mjs episodes/emu-war`. Plan C ne traži nove promptove, samo izmenu polja ispod.

`node tools/flow-risk.mjs episodes/emu-war` ne javlja nijedan signal. Okidač je ovde radnja, ne reč: ni jedan kadar ne
prikazuje pogodak, ranu ni telo, ali tri kadra uključuju top koji puca ili cev uperenu u životinju.

| Shot | Rizik | Plan A | Plan B | Plan C |
|---|---|---|---|---|
| 12 | top puca u zid emua (pretpostavka: oružje uperen u životinje) | **aktivan** (kratak rafal, prašina pred stadom, zaglavljenje) | ispod (samo zaglavljenje, bez rafala) | still `push` |
| 13 | kamion sa topom juri emue | **aktivan** (top na sanduku, bez pucnjave) | ispod (kamion juri bez topa u kadru) | still `track`→`push` |
| 19 | strelci nišane cevi niz pašnjak sa emuima | **aktivan** | ispod (cev spuštena, strelci gledaju) | still `push` |

Nijedan shot nije probao Flow, pa su sve tri „pretpostavka". Ako klip padne, traži poruku koju je Flow ispisao pre nego što
pređeš na Plan B (`flow-filter.md` §1).

---

## Shot 12 — zid emua i zaglavljen top

**Plan A (aktivan).** Slika: major kleči uz Lewis top na obali brane, jedan strelac uz kundak, drugi drži šaržer; široki
zid emua hoda ka njima. Animation prorez `1–3.5s:` kaže „the Lewis gun chatters in a short burst, red dust leaping up in
the grass short of the flock", a posle njega „the gun clacks and falls silent … smoke curls from the breech".

**Plan B.** Zamenjeno je samo ono što je okidač, i to u animation promptu (slika se ne menja):

| Plan A | Plan B | Razlog |
|---|---|---|
| „chatters in a short burst, red dust leaping up in the grass short of the flock" | „the gunner hauls the cocking handle and the Lewis gun clacks and jams at once" | nema rafala, samo zaglavljenje |
| „the flock slows and its heads swing" | „the flock walks on unhurried, heads swinging" | emui reaguju na zaglavljenje, ne na paljbu |

Novi prorez `1–3.5s:` (isti broj reči):

```
1–3.5s: the gunner hauls the cocking handle and the Lewis gun clacks and jams at once, a curl of smoke rising from the breech; the flock walks on unhurried, heads swinging.
```

Prorez `3.5–6s:` ostaje, ali se otvara sa „the second gunner slaps the pan magazine while the gunner at the stock yanks the cocking handle twice".

**Plan C.**

```
"source_file": "shots/shot12.jpeg",
"motion_budget": null,
"gen_len": null,
"animation_prompt": null,
"render_mode": "still",
"still_motion": "push",
"tags.camera_motion": "push"
```

## Shot 13 — kamion juri emue

**Plan A (aktivan).** Kamion sa Lewis topom na sanduku juri dva emua preko pšenice; strelac se drži za top. Nema paljbe ni
pogotka, samo hajka.

**Plan B.** Top ostaje u slici kao teret, ali strelac se drži za ivicu sanduka umesto za top (`the gunner clutches the
tray rail`); u animation promptu se „the gunner clutches the gun" menja u „the gunner clutches the tray rail". Ostalo
isto.

**Plan C.** Still, `still_motion: "push"`, `tags.camera_motion: "push"`, isti niz polja kao gore.

## Shot 19 — strelci postavljaju top na ivici puta

**Plan A (aktivan).** Strelci spuštaju top na bipod, jedan nišani niz cev ka grupama emua na pašnjaku; nema paljbe.

**Plan B.** Animation prorezi `1–3s:` i `4.5–6s:` zamenjuju „the first gunner sighting along the barrel" i „the gunners track them along the
barrel" sa „the first gunner squints along the paddock" i „the gunners lower the barrel and push up their hat brims"; emui i dalje
beže u male grupe. Cev se ne nišani.

**Plan C.** Still, `still_motion: "push"`, `tags.camera_motion: "push"`.
